
const db = require('../models');
const {  Reservation,Parametre, } = db;
const notificationService = require('../services/notifications.service');

exports.updateReservationsStatuts = async (req, res) => {
  try {

    const reservations = await Reservation.findAll({
        include: [
            { association: 'table' },
            { association: 'creneau' },
        ],
        order: [['date_reservation', 'DESC']]//important ecrasements
    });

    let tablesMisesAJour = 0;
    let notificationsEnvoyees = 0;
    let reservationsMisesAJour = 0;

    const now = new Date();
    reservations.forEach(async (reservation) => {

        const dateReservation = new Date(reservation.date_reservation);

        const [startHour, startMin] = reservation.creneau.heure_debut.split(':');
        const [endHour, endMin] = reservation.creneau.heure_fin.split(':');

        // début du créneau
        const start = new Date(dateReservation);
        start.setHours(startHour, startMin, 0);

        // fin du créneau
        const end = new Date(dateReservation);
        end.setHours(endHour, endMin, 0);

        let statut = 'libre';

        if (now >= start && now <= end) {
            statut = 'occupée';
            await notificationService.createNotification({
                 objet:reservation,
                type:'info',
                titre: `Changement de statut d'une reservation`,
                texte: `Nouveau statut de la réservation ${reservation.id} : En cours. Nouveau statut de la table ${reservation.table.numero} : ${statut}`,
                utilisateur_id: 0
            });
            notificationsEnvoyees++;
            await reservation.update({ statut:'En cours'});
            reservationsMisesAJour++;
        }

        await reservation.table.update({ statut });
         tablesMisesAJour++;
        

    });

     return res.status(200).json({
      success: true,
      message: "🔄 Traitement de status des reservations et tables",
      data: {
        total_reservations_traitées: reservations.length,
        tables_mises_a_jour: tablesMisesAJour,
        reservationsMisesAJour:reservationsMisesAJour,
        notifications_envoyées: notificationsEnvoyees,
        statut: "OK"
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};


exports.watchReservationsDelais = async (req, res) => {
  try {
    const reservations = await Reservation.findAll({});

    const now = new Date();

    let total_annulations = 0;
    let total_rappels = 0;
    let total_invitations = 0;

    for (const reservation of reservations) {
        const dateReservation = new Date(reservation.date_reservation);

        const [rappel, annulation, avis] = await Promise.all([
            Parametre.findOne({
                where: {
                type: 'delai_rappel_reservation',
                restaurant_id: reservation.restaurant_id,
                est_actif: true
                }
            }),
            Parametre.findOne({
                where: {
                type: 'delai_annulation_reservation',
                restaurant_id: reservation.restaurant_id,
                est_actif: true
                }
            }),
            Parametre.findOne({
                where: {
                type: 'delai_invitation_avis',
                restaurant_id: reservation.restaurant_id,
                est_actif: true
                }
            })
        ]);
        const delai_rappel = parseInt(rappel?.valeur || 0);
        const delai_annulation = parseInt(annulation?.valeur || 0);
        const delai_avis = parseInt(avis?.valeur || 0);

        const dateRappel = new Date(dateReservation);
        dateRappel.setMinutes(dateRappel.getMinutes() - delai_rappel);

        const dateAnnulation = new Date(dateReservation);
        dateAnnulation.setMinutes(dateAnnulation.getMinutes() - delai_annulation);

        const dateAvis = new Date(dateReservation);
        dateAvis.setMinutes(dateAvis.getMinutes() + delai_avis);

        // RAPPEL
        if (now >= dateRappel && !reservation.rappel_envoye) {

            await notificationService.createNotification({
                 objet:reservation,
                titre: `Rappel de réservation`,
                type:'rappel',
                texte: `N'oubliez pas votre réservation ${reservation.id} pour ${dateReservation}`,
                utilisateur_id: reservation.client_id
            });
            total_rappels++;


        }

        // ANNULATION AUTO
        if (now >= dateAnnulation && reservation.statut === 'En attente') {
            await reservation.update({ statut: 'Annulée' });
            await notificationService.createNotification({
                 objet:reservation,
                titre: `Reservation annuléé `,
                type:'alerte',
                texte: `Reservation ${reservation.id} annuléé car le delai de ${delai_avis} minutes est passé`,
            });
            total_annulations++;
        }

        /*

        //  AVIS
        if (now >= dateAvis && !reservation.avis_envoye) {

        }
        */

    }

     return res.status(200).json({
      success: true,
      message: "🔄 Traitement des delais de reservations",
      data: {
        total_reservations_traitees: reservations.length,
        total_annulations: total_annulations,
        total_invitations: total_invitations,
        total_rappels: total_rappels,
        statut: "OK"
      }
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

