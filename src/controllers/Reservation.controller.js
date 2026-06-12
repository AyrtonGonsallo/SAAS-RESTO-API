const db = require('../models');
const bcrypt = require('bcryptjs');
const emailService = require('../services/mailer.service');
const {  Reservation,TotalReservationsCouvertsParJour,Parametre,ReservationsTablesParCreneauJour,Restaurant,Utilisateur,Role,Creneau,Tag,Service,RestaurantTable,Societe,ZoneTable,Notification } = db;
const DEFAULT_PASS = process.env.DEFAULT_PASS;
const notificationService = require('../services/notifications.service');
const { Op,Sequelize } = require('sequelize');

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}


exports.createReservation = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      date_reservation,
      heure_reservation,
      duree_reservation,
      societe_id,
      restaurant_id,
      tags,
      nb_couverts,
      service_id,
      tables_id,
      ...rest
    } = req.body;

    let tables_array = Array.isArray(tables_id) ? tables_id : [tables_id];

    const [hD, mD] = heure_reservation.split(':').map(Number);

     //  2. DATE
    const dateObj = new Date(Date.UTC(
      date_reservation.year,
      date_reservation.month - 1,
      date_reservation.day,
      hD,
      mD,
      0
    ));

    
    

    const dateOnly = `${date_reservation.year}-${String(date_reservation.month).padStart(2,'0')}-${String(date_reservation.day).padStart(2,'0')}`;

  
    

     //verifier si existe une reservation pour la table a cette date et plage_horaire et annuler avec 400 si oui si non creer
    const existingReservationTablesParCreneauJour = await ReservationsTablesParCreneauJour.findOne({
      where: {
        date: dateOnly,
        table_id: {
          [Op.in]: tables_array
        }
      },
      transaction: t
    });

    //current_plage_horaire = existingReservationTablesParCreneauJour.plage_horaire//11:00 - 120 
    //verifier que heure_reservation est dans la plage 120 est en minutes la duree
    // si existe → erreur

    if (existingReservationTablesParCreneauJour) {

      const currentPlageHoraire =
        existingReservationTablesParCreneauJour.plage_horaire;

      // "11:00 - 120"
      const [heureDebutExistante, dureeExistanteStr] =
        currentPlageHoraire.split(' - ');

      const dureeExistante = Number(dureeExistanteStr);

      const debutExistant = timeToMinutes(heureDebutExistante);
      const finExistant = debutExistant + dureeExistante;

      const dureeNouvelle = Number(
        duree_reservation
      );

      const debutNouvelle = timeToMinutes(heure_reservation);
      const finNouvelle = debutNouvelle + dureeNouvelle;

      const chevauchement =
        debutNouvelle < finExistant &&
        finNouvelle > debutExistant;

      if (chevauchement) {
        return res.status(400).json({
          message:
            `Une des tables sélectionnées est déjà réservée sur ce créneau ${currentPlageHoraire}.`
        });
      }
    }


   
 

    //  1. CLIENT chercher ou creer
    let client = await Utilisateur.findOne({ where: { email }, transaction: t });

    if (!client) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASS, 10);

      const role = await Role.findOne({
        where: { type: 'client' },
        transaction: t
      });

      if (!role) {
        throw new Error('Rôle non trouvé');
      }

      client = await Utilisateur.create({
        nom,
        prenom,
        email,
        telephone,
        mot_de_passe: hashedPassword,
        role_id: role.id,
        societe_id,
      }, { transaction: t });

      await client.setRestaurants([restaurant_id], { transaction: t });
    }else{
      await client.addRestaurant(restaurant_id, { transaction: t });
    }


    const service = await Service.findByPk(service_id);

    if (!service) {
      await t.rollback();
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    

    
    //  4. CRÉNEAU DU JOUR (SAFE) chercher ou creer
    const [totalReservationsCouvertsParJour, ] = await TotalReservationsCouvertsParJour.findOrCreate({
      where: {
        service_id:service_id,
        date: dateOnly,
      },
      defaults: {
        service_id:service_id,
        date: dateOnly,
        nb_reservations_actuel: 0,
        nb_couverts_actuel: 0,
        societe_id,
        restaurant_id
      },
      transaction: t
    });

    //  5. CHECK CAPACITÉ (AVANT incrément)
    if (totalReservationsCouvertsParJour.nb_couverts_actuel + nb_couverts > service.max_couverts_par_service) {
      await t.rollback();
      return res.status(400).json({ message: `Le service de cette date est complet pour les couverts. Nombre actuel ${totalReservationsCouvertsParJour.nb_couverts_actuel} nombre demandé ${nb_couverts} nombre maximum ${service.max_couverts_par_service}` });
    }

    

    //  6. INCRÉMENT ATOMIQUE
    await totalReservationsCouvertsParJour.increment(
      { nb_couverts_actuel: nb_couverts },
      {
        where: {
          id: totalReservationsCouvertsParJour.id,
          [Op.and]: Sequelize.literal(
            `nb_couverts_actuel + ${nb_couverts} <= ${service.max_couverts_par_service}`
          )
        },
        transaction: t
      }
    );

    await totalReservationsCouvertsParJour.increment(
      { nb_reservations_actuel: 1 },
      {
        transaction: t
      }
    );

    //  7. CRÉATION RÉSERVATION
    const reservation = await Reservation.create({
      ...rest,
      societe_id,
      restaurant_id,
      service_id,
      plage_horaire:`${heure_reservation} ${duree_reservation}`,
      nb_couverts,
      total_reservations_couverts_par_jour_id: totalReservationsCouvertsParJour.id,
      date_reservation: dateObj,
      client_id: client.id
    }, { transaction: t });


  

    for (const table_id of tables_array) {

      await ReservationsTablesParCreneauJour.findOrCreate({
        where: {
          date: dateOnly,
          table_id,
          plage_horaire: `${heure_reservation} - ${duree_reservation}`
        },
        defaults: {
          date: dateOnly,
          table_id,
          plage_horaire: `${heure_reservation} - ${duree_reservation}`,
          societe_id,
          reservation_id: reservation.id,
          restaurant_id,
          utilisateur_id: client.id
        },
        transaction: t
      });

    }
    

    //  8. TAGS
    if (tags?.length) {
      await reservation.setTags(tags, { transaction: t });
    }

    //  9. table

    if (tables_array?.length) {
      await reservation.setTables(tables_array, { transaction: t });
    }

   

    const dateReservation = new Date(reservation.date_reservation).toLocaleString('fr-FR', {
      timeZone: 'UTC',
    });

    await notificationService.createNotification({
        objet:reservation,
        titre: `Nouvelle reservation`,
        type:'info',
        texte: `Vous avez une nouvelle réservation ${reservation.id} : Client "${prenom} ${nom}" pour le "${dateReservation}" dans le restaurant ${restaurant_id}`,
    });

    await notificationService.createNotification({
         objet:reservation,
        titre: `Nouvelle reservation`,
        type:'rappel',
        texte: `N'oubliez pas votre réservation ${reservation.id} pour ${dateReservation}`,
        utilisateur_id: reservation.client_id
    });

  
    
    
         
    await t.commit();


    //  9. RELOAD (hors transaction → plus rapide)
    const reservationObjet = await Reservation.findByPk(reservation.id, {
      include: [
        { association: 'client' },
        { association: 'tables',
          include: [
            { model: ZoneTable }
          ]
        },
        { association: 'service' },
        { association: 'societe' },
        { association: 'tags' },
      ]
    });


      // chercher le paramètre d'envoi mail
    const params = await Parametre.findOne({
      where: {
        restaurant_id: restaurant_id,
        type: 'envoi_de_mail_recap_reservation',
        est_actif: true
      }
    });
    
    console.log("EMAIL PARAM CHECK =", params);

    // si activation email OK
    if (params) {
      try {
        const restaurant = await Restaurant.findByPk(restaurant_id);

        const nom_restaurant = restaurant?.nom || '';
        const telephone_restaurant = restaurant?.telephone || '';

        const titre = 'Récapitulatif de votre réservation';

        const dateReservation = new Date(reservation.date_reservation).toLocaleString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const dateCreation = new Date(reservation.created_at).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    await emailService.sendMail({
      to: email,
      subject: titre,
      template: 'recap-reservation.ejs',
      context: {
        titre,
        nom,
        prenom,
        email,
        nom_restaurant,
        nb_tables:reservationObjet.tables.length,
        telephone_restaurant,
        date_reservation: dateReservation,
        date_creation: dateCreation,
        nombre_personnes: reservation.nombre_de_personnes,
        nombre_couverts: reservation.nb_couverts,
        demandes_speciales: reservationObjet.tags ?.map(tag => tag.titre).join(', ') || '',
        commentaire: reservation.notes
      }
    });

  } catch (err) {
    console.error("Erreur email (non bloquante):", err);
  }
}

   
    res.json(reservationObjet);

  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getReservations = async (req, res) => {
  try {

  
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
        if(req.role_priorite==8){
          restaurantFilter = {societe_id: req.societe_id,client_id:req.user_id}
        }
        else if (selectedRestaurantId) {
          //  filtre sur UN restaurant
          restaurantFilter = {
              restaurant_id: selectedRestaurantId,
              societe_id: req.societe_id
          };
        } else {
          //  filtre sur plusieurs restaurants autorisés
          restaurantFilter = {
              restaurant_id: {
              [Op.in]: req.restos
              },
              societe_id: req.societe_id
          };
        }
    }else{
        if (req.isSuperAdmin) {
        restaurantFilter = {}
        }else{
            restaurantFilter = {societe_id: req.societe_id}
        }
    }
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const reservations = await Reservation.findAll({
      where:restaurantFilter,
      include: [
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
            required: false,
        },
        { association: 'client' },
        { association: 'tables',
          include: [
            { model: ZoneTable }
          ]
        },
        { association: 'service' },
        { association: 'societe' },
        { association: 'paiements' },
        { association: 'tags' }
      ],
      order: [['date_reservation', 'DESC']]
    });

    res.json(reservations);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getMaxReservations = async (req, res) => {
  try {

  
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
        if(req.role_priorite==8){
          restaurantFilter = {societe_id: req.societe_id,client_id:req.user_id}
        }
        else if (selectedRestaurantId) {
          //  filtre sur UN restaurant
          restaurantFilter = {
              restaurant_id: selectedRestaurantId,
              societe_id: req.societe_id
          };
        } else {
          //  filtre sur plusieurs restaurants autorisés
          restaurantFilter = {
              restaurant_id: {
              [Op.in]: req.restos
              },
              societe_id: req.societe_id
          };
        }
    }else{
        if (req.isSuperAdmin) {
        restaurantFilter = {}
        }else{
            restaurantFilter = {societe_id: req.societe_id}
        }
    }
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const reservations = await Reservation.findAll({
      where:restaurantFilter,
      include: [
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
            required: false,
        },
        { association: 'client' },
        { association: 'tables',
          include: [
            { model: ZoneTable }
          ]
        },
        { association: 'service' },
        { association: 'societe' },
        { association: 'paiements' },
        { association: 'tags' },
      ],
      order: [['date_reservation', 'DESC']],
      limit: 4
    });

    res.json(reservations);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
            required: false,
        },
        { association: 'client' },
        { association: 'tables',
          include: [
            { model: ZoneTable }
          ]
        },
        { association: 'service' },
        { association: 'societe' },
        { association: 'paiements' },
        { association: 'tags' },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation non trouvé' });
    }

    res.json(reservation);
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};

exports.updateReservation = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE //  important
    });

    if (!reservation) {
      await t.rollback();
      return res.status(404).json({ message: 'Reservation non trouvée' });
    }

    const former_statut = reservation.statut;

    const {
      date_reservation,
      heure_reservation,
      duree_reservation,
      societe_id,
      restaurant_id,
      tags,
      plage_horaire,
      total_reservations_couverts_par_jour_id,
      nb_couverts,
      service_id,
      tables_id,
      ...rest
    } = req.body;
    
    let tables_array = Array.isArray(tables_id) ? tables_id : [tables_id];

    //  Convert date
    const dateObj = new Date(Date.UTC(
      date_reservation.year,
      date_reservation.month - 1,
      date_reservation.day,
      heure_reservation.hour,
      heure_reservation.minute,
      heure_reservation.second || 0
    ));

    const dateOnly = `${date_reservation.year}-${String(date_reservation.month).padStart(2,'0')}-${String(date_reservation.day).padStart(2,'0')}`;


    const service = await Service.findByPk(service_id);

    if (!service) {
      await t.rollback();
      return res.status(404).json({ message: 'Service non trouvé' });
    }


    //  Charger créneau du jour avec lock ne change jamais
     totalReservationsCouvertsParJour = await TotalReservationsCouvertsParJour.findByPk(total_reservations_couverts_par_jour_id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    //cet objet permet de verifier qu'un utilisateur ne depasse pas le nombre de couverts pour un service, donc verifier que le service n'a pa change si il change decrementer ceci et creer un autre a lier
    if (totalReservationsCouvertsParJour.service_id !== service_id) {

      // 1. nb_reservations_actuel
      if (totalReservationsCouvertsParJour.nb_reservations_actuel > 0) {
        await totalReservationsCouvertsParJour.increment('nb_reservations_actuel', {
          by: -1,
          transaction: t
        });
      }

      // 1. décrémenter nb_couverts
      if (totalReservationsCouvertsParJour.nb_reservations_actuel > 0) {
        await totalReservationsCouvertsParJour.increment('nb_couverts_actuel', {
          by: -nb_couverts,
          transaction: t
        });
      }

      // 2. créer ou récupérer le nouveau service
      const [newTotalReservationsCouvertsParJour, created] = await TotalReservationsCouvertsParJour.findOrCreate({
        where: {
          service_id,
          date: dateOnly,
        },
        defaults: {
          service_id,
          date: dateOnly,
          nb_reservations_actuel: 0,
          societe_id:reservation.societe_id,
          restaurant_id:reservation.restaurant_id
        },
        transaction: t
      });

      // 3. incrémenter le nouveau
      await newTotalReservationsCouvertsParJour.increment('nb_couverts_actuel', {
        by: nb_couverts,
        transaction: t
      });

      await newTotalReservationsCouvertsParJour.increment('nb_reservations_actuel', {
        by: 1,
        transaction: t
      });

      totalReservationsCouvertsParJour = newTotalReservationsCouvertsParJour;
    }


    if (!totalReservationsCouvertsParJour) {
      throw new Error('totalReservationsCouvertsParJour du jour introuvable');
    }

    //  Définir groupes de statuts
    const actifs = ['En attente', 'Confirmée','En cours'];
    const inactifs = ['Annulée','Terminée','No-show'];

    let delta_reservations = 0;
    let delta_couverts = 0;




    //  contr decrementer le nombre de reservations pour table, plage_horaire, date correspondant
    if (actifs.includes(former_statut) && inactifs.includes(statut)) {
      delta_reservations = -1;
      delta_couverts = -nb_couverts;

      //  supprimer
      await ReservationsTablesParCreneauJour.destroy({
        where: {
          reservation_id: reservation.id
        },
        transaction: t
      });

    } else if (inactifs.includes(former_statut) && actifs.includes(statut)) {
      delta_reservations = 1;
      delta_couverts = nb_couverts;

      for (const table_id of tables_array) {

        await ReservationsTablesParCreneauJour.findOrCreate({
          where: {
            date: dateOnly,
            table_id,
            plage_horaire: reservation.plage_horaire
          },
          defaults: {
            date: dateOnly,
            table_id,
            plage_horaire: reservation.plage_horaire,
            societe_id,
            reservation_id: reservation.id,
            restaurant_id,
            utilisateur_id: reservation.client_id
          },
          transaction: t
        });

      }
      
    }

  
    //  UPDATE UNIQUE
    await reservation.update({
      heure_reservation,
      duree_reservation,
      societe_id,
      restaurant_id,
      tags,
      plage_horaire,
      total_reservations_couverts_par_jour_id,
      nb_couverts,
      service_id,
      tables_id,
      ...rest,
      date_reservation: dateObj
    }, { transaction: t });

    //  TAGS
    if (tags?.length) {
      await reservation.setTags(tags, { transaction: t });
    }

    await t.commit();

    //  Reload
    const reservationUpdated = await Reservation.findByPk(reservation.id, {
      include: [
        { association: 'client' },
        { association: 'tables' },
        { association: 'service' },
        { association: 'societe' },
        { association: 'tags' }
      ]
    });

    res.json(reservationUpdated);

  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(req.params.id, { transaction: t });

    if (!reservation) {
      await t.rollback();
      return res.status(404).json({ message: 'Reservation non trouvée' });
    }

    const totalReservationsCouvertsParJour = await TotalReservationsCouvertsParJour.findByPk(
      reservation.total_reservations_creneau_par_jour_id,
      { transaction: t }
    );

    if (totalReservationsCouvertsParJour && totalReservationsCouvertsParJour.nb_reservations_actuel > 0) {
      await totalReservationsCouvertsParJour.increment('nb_reservations_actuel', {
        by: -1,
        transaction: t
      });
    }

    const reservationsTablesParCreneauJour = await ReservationsTablesParCreneauJour.findOne({
      where: {
        reservation_id: reservation.id,
      }}, 
      { transaction: t }
    );

    if (reservationsTablesParCreneauJour) {
      await reservationsTablesParCreneauJour.destroy({ transaction: t });
    }

    

    await reservation.destroy({ transaction: t });

    await t.commit();

    return res.json({ message: 'Reservation supprimée' });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: error.message });
  }
};


exports.getReservationDatasBySocieteID = async (req, res) => {
  try {

    const societeID = req.params.societeID;

    const societe = await Societe.findByPk(societeID);

    if (!societe) {
      return res.status(404).json({
        message: 'Societe non trouvée'
      });
    }
    restaurantFilter = {societe_id: societeID};


    const tags = await Tag.findAll({where: restaurantFilter,});
    const services = await Service.findAll({where: restaurantFilter,});
    const creneaux = await Creneau.findAll({where: restaurantFilter,});
    const tables = await RestaurantTable.findAll({
        where: {
        ...restaurantFilter,
          statut: 'libre'
        },
        include: [
          {
            model: ZoneTable,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ],
        order: [['zone_id', 'ASC']]
      },
    );
    const restaurants = await Restaurant.findAll({
      where: restaurantFilter,
      include: [
        {
          association: 'parametres',
          where: { est_important: true },
          required: false
        },
        {
          association: 'horaires',
          include: [
            {
                model: Service,
                required: false,
            }
          ],
        },
      ],
      order: [['created_at', 'DESC']]
    });
    

    res.json({
      societe:societe,
      tags:tags,
      services:services,
      creneaux:creneaux,
      tables:tables,
      restaurants:restaurants,

    });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};