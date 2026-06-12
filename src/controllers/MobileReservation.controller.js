const db = require('../models');
const {  Reservation,Service,TotalReservationsCouvertsParJour,ReservationsTablesParCreneauJour,Creneau,RestaurantTable,ZoneTable } = db;







exports.updateMobileReservation = async (req, res) => {
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
      statut,
    } = req.body;

   
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

   

    await t.commit();

    //  Reload
    const reservationUpdated = await Reservation.findByPk(reservation.id, {
      include: [
        { association: 'client' },
        { association: 'tables',
          include: [
            { model: ZoneTable }
          ]
        },
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