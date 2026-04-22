const db = require('../models');
const bcrypt = require('bcryptjs');
const {  Reservation,TotalReservationsCreneauParJour,ReservationsTablesParCreneauJour,Restaurant,Utilisateur,Role,Creneau,Tag,Service,RestaurantTable,Societe,ZoneTable,Notification } = db;
const DEFAULT_PASS = process.env.DEFAULT_PASS;
const notificationService = require('../services/notifications.service');
const { Op } = require('sequelize');
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
      societe_id,
      restaurant_id,
      creneau_id,
      tags,
      table_id,
      ...rest
    } = req.body;

     //  2. DATE
    const dateObj = new Date(
      date_reservation.year,
      date_reservation.month - 1,
      date_reservation.day,
      heure_reservation.hour,
      heure_reservation.minute,
      heure_reservation.second || 0
    );

    
    

    const dateOnly = `${date_reservation.year}-${String(date_reservation.month).padStart(2,'0')}-${String(date_reservation.day).padStart(2,'0')}`;

   
    

     //verifier si existe une reservation pour la table a cette date et annuler avec 400 si oui si non creer
    const existingReservationTablesParCreneauJour = await ReservationsTablesParCreneauJour.findOne({
      where: {
        creneau_id,
        date: dateOnly,
        table_id,
      },
      transaction: t
    });

    // si existe → erreur
    if (existingReservationTablesParCreneauJour) {
      return res.status(400).json({ message: 'Table déjà réservée pour ce créneau' });
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

    

   
    //  3. CRÉNEAU chercher
    const creneau = await Creneau.findByPk(creneau_id, { transaction: t });

    if (!creneau) {
      throw new Error('Créneau introuvable');
    }

    console.log('creneau_id ',creneau_id,
        'date ', dateOnly,)
    //  4. CRÉNEAU DU JOUR (SAFE) chercher ou creer
    const [totalReservationsCreneauParJour, ] = await TotalReservationsCreneauParJour.findOrCreate({
      where: {
        creneau_id,
        date: dateOnly,
      },
      defaults: {
        creneau_id,
        date: dateOnly,
        nb_reservations_actuel: 0,
        societe_id,
        restaurant_id
      },
      transaction: t
    });

    //  5. CHECK CAPACITÉ (AVANT incrément)
    if (totalReservationsCreneauParJour.nb_reservations_actuel >= creneau.nb_reservations_max) {
      await t.rollback();
      return res.status(400).json({ message: 'Créneau complet' });
    }

    //  6. INCRÉMENT ATOMIQUE
    await totalReservationsCreneauParJour.increment('nb_reservations_actuel', { transaction: t });

    //  7. CRÉATION RÉSERVATION
    const reservation = await Reservation.create({
      ...rest,
      table_id,
      creneau_id,
      societe_id,
      restaurant_id,
      total_reservations_creneau_par_jour_id: totalReservationsCreneauParJour.id,
      date_reservation: dateObj,
      client_id: client.id
    }, { transaction: t });


    // sinon créer
    const newReservationTablesParCreneauJour = await ReservationsTablesParCreneauJour.create({
      creneau_id,
      date: dateOnly,
      table_id,
      societe_id,
      reservation_id:reservation.id,
      restaurant_id,
      utilisateur_id: client.id
    }, { transaction: t });

    //  8. TAGS
    if (tags?.length) {
      await reservation.setTags(tags, { transaction: t });
    }

    //  9. table

    const table = await RestaurantTable.findByPk(table_id);

    if (!table) {
      return res.status(404).json({
        message: 'Table non trouvée'
      });
    }

    if (table.statut=="réservée") {
      await t.rollback();
      return res.status(400).json({ message: 'Table déja réservée' });
    }

   

    
    const dateReservation = new Date(reservation.date_reservation).toLocaleString('fr-FR');

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
        { association: 'table' },
        { association: 'service' },
        { association: 'creneau' },
        { association: 'societe' },
        { association: 'tags' }
      ]
    });

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
        { association: 'table' },
        { association: 'service' },
        { association: 'creneau' },
        { association: 'societe' },
        { association: 'paiements' },
        { association: 'tags' },
        { association: 'messages' }
      ],
      order: [['date_reservation', 'DESC']]
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
      { association: 'table' },
      { association: 'service' },
      { association: 'creneau' },
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
      { association: 'messages' }
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
      statut,
      total_reservations_creneau_par_jour_id,
      creneau_id,
      table_id,
      tags,
      ...rest
    } = req.body;

    //  Convert date
    const dateObj = new Date(
      date_reservation.year,
      date_reservation.month - 1,
      date_reservation.day,
      heure_reservation.hour,
      heure_reservation.minute,
      heure_reservation.second || 0
    );

    //  Récupérer créneau
    const creneau = await Creneau.findByPk(creneau_id, { transaction: t });
    if (!creneau) throw new Error('Créneau introuvable');

    //  Charger créneau du jour avec lock
    const totalReservationsCreneauParJour = await TotalReservationsCreneauParJour.findByPk(total_reservations_creneau_par_jour_id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!totalReservationsCreneauParJour) {
      throw new Error('Créneau du jour introuvable');
    }

    //  Définir groupes de statuts
    const actifs = ['En attente', 'Confirmée','En cours'];
    const inactifs = ['Annulée','Terminée','No-show'];

    let delta = 0;

    const table = await RestaurantTable.findByPk(table_id);
    if (!table) {
      return res.status(404).json({
        message: 'Table non trouvée'
      });
    }

    // 🔥 LOGIQUE UNIQUE
    if (actifs.includes(former_statut) && inactifs.includes(statut)) {
      delta = -1;

      //  supprimer
      const reservationsTablesParCreneauJour = await ReservationsTablesParCreneauJour.findOne({
        where: {
          reservation_id: reservation.id,
        }}, 
        { transaction: t }
      );

      if (reservationsTablesParCreneauJour) {
        await reservationsTablesParCreneauJour.destroy({ transaction: t });
      }

    } else if (inactifs.includes(former_statut) && actifs.includes(statut)) {
      delta = +1;

      //verifier si existe une reservation pour la table a cette date et annuler avec 400 si oui si non creer
      const existingReservationTablesParCreneauJour = await ReservationsTablesParCreneauJour.findOne({
        where: {
          reservation_id: reservation.id,
        },
        transaction: t
      });

      // si existe → bon
      if (!existingReservationTablesParCreneauJour) {
         // sinon créer
        const newReservationTablesParCreneauJour = await ReservationsTablesParCreneauJour.create({
          creneau_id:reservation.creneau_id,
          date: date_reservation,
          table_id:reservation.table_id ,
          societe_id:reservation.societe_id ,
          reservation_id:reservation.id,
          restaurant_id:reservation.restaurant_id ,
          utilisateur_id:reservation.client_id ,
        }, { transaction: t });
        
      }
    }

    //  Appliquer delta
    if (delta !== 0) {
      if (delta === 1 && totalReservationsCreneauParJour.nb_reservations_actuel >= creneau.nb_reservations_max) {
        await t.rollback();
        return res.status(400).json({ message: 'Créneau complet' });
      }

      if (delta === -1 && totalReservationsCreneauParJour.nb_reservations_actuel <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Compteur invalide' });
      }

      await totalReservationsCreneauParJour.increment('nb_reservations_actuel', {
        by: delta,
        transaction: t
      });
    }

    //  UPDATE UNIQUE
    await reservation.update({
      ...rest,
      statut,
      table_id,
      creneau_id,
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
        { association: 'table' },
        { association: 'service' },
        { association: 'creneau' },
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

    const totalReservationsCreneauParJour = await TotalReservationsCreneauParJour.findByPk(
      reservation.total_reservations_creneau_par_jour_id,
      { transaction: t }
    );

    if (totalReservationsCreneauParJour && totalReservationsCreneauParJour.nb_reservations_actuel > 0) {
      await totalReservationsCreneauParJour.increment('nb_reservations_actuel', {
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
        }
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