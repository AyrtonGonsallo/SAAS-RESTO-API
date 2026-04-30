const db = require('../models');
const {  Reservation,TotalReservationsCreneauParJour,ReservationsTablesParCreneauJour,Creneau,RestaurantTable, } = db;







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

    //  LOGIQUE UNIQUE
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
          date: reservation.date_reservation,
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
      statut,
    }, { transaction: t });

   

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