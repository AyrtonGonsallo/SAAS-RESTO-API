
const db = require('../models');
const {  Reservation,Parametre,Restaurant,Commande } = db;
const notificationService = require('../services/notifications.service');
const emailService = require('../services/mailer.service');
const { Op } = require('sequelize');

exports.updateReservationsStatuts = async (req, res) => {
  try {

    const reservations = await Reservation.findAll({
      where: {
        [Op.or]: [
          {
            statut: {
              [Op.notIn]: ['Annulée','Terminée','No-show']
            }
          },
          {
            avis_envoye: false
          }
        ]
      },
      include: [
          { association: 'table' },
          { association: 'creneau' },
          { association: 'client' },
          {
            model: Restaurant,
            attributes: ['id', 'nom',  'telephone'],
            required: false,
        },
      ],
      order: [['date_reservation', 'DESC']]//important ecrasements
    });

     const commandes = await Commande.findAll({
      where: {
        [Op.or]: [
          {
            statut: {
              [Op.notIn]: ['Retirée', 'Annulée']
            }
          },
          {
            avis_envoye: false
          }
        ]
      },
      include: [
          { association: 'client' },
          {
            model: Restaurant,
            attributes: ['id', 'nom',  'telephone'],
            required: false,
        },
      ],
      order: [['date_retrait', 'DESC']]//important ecrasements
    });

    let tablesMisesAJour = 0;
    let notificationsEnvoyees = 0;
    let mailsEnvoyees = 0;
    let reservationsMisesAJour = 0;
    let commandesMisesAJour = 0;
    let verifs = []

    const now = Date.now();
    const now2 = new Date(now);
    const hours = now2.getHours();
    const minutes = now2.getMinutes();

    let nowstring = `${hours}:${minutes}`;//ca correspon bien a now version humanreadable ?

    for (const reservation of reservations) {

      const dateReservation = new Date(reservation.date_reservation);

      const [startHour, startMin] = reservation.creneau.heure_debut.split(':');
      const [endHour, endMin] = reservation.creneau.heure_fin.split(':');

      // base date en UTC (important)
      const base = new Date(Date.UTC(
        dateReservation.getUTCFullYear(),
        dateReservation.getUTCMonth(),
        dateReservation.getUTCDate()
      ));

      const start = new Date(base);
      start.setUTCHours(startHour, startMin, 0, 0);

      const end = new Date(base);
      end.setUTCHours(endHour, endMin, 0, 0);

        
        let statut = 'libre';

        if (now >= start.getTime() && now <= end.getTime()) {
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
          verifs.push(`comparaison date en cours réussie reservation #${reservation.id} date reservation (${reservation.date_reservation}): date debut : ${start} - date fin : ${end} - heure actuelle : ${nowstring}`);

          

        }else if (now > end.getTime()) {
          statut = 'libre';
          await notificationService.createNotification({
                objet:reservation,
              type:'info',
              titre: `Reservation terminée`,
              texte: `Nouveau statut de la réservation ${reservation.id} : Terminée. Nouveau statut de la table ${reservation.table.numero} : ${statut}`,
              utilisateur_id: 0
          });
          await notificationService.createNotification({
                objet:reservation,
              type:'info',
              titre: `Reservation terminée`,
              texte: `Votre réservation ${reservation.id} pour la table ${reservation.table.numero} est terminée`,
              utilisateur_id: reservation.client_id
          });
          notificationsEnvoyees++;
          await reservation.update({ statut:'Terminée'});
          reservationsMisesAJour++;
          verifs.push(`comparaison date passée réussie reservation #${reservation.id} date reservation (${reservation.date_reservation}): date debut : ${start} - date fin : ${end} - heure actuelle : ${nowstring}`);

          let titre = 'Demande d\'avis'
          let lien = `https://resto.orocom.io/ajouter-avis/1/${reservation.id}`
          
          nom_client = reservation.client.nom
          prenom_client = reservation.client.prenom
          email_client = reservation.client.email
          nom_restaurant = reservation.Restaurant.nom
          telephone_restaurant = reservation.Restaurant.telephone
          await emailService.sendMail({
            to: 'ayrtongonsallo444@gmail.com',
            subject: titre,
            template: 'reservation-info.ejs',
            context: { titre,lien,nom_client,prenom_client,email_client,nom_restaurant,telephone_restaurant } // variable à injecter dans ejs
          });
          mailsEnvoyees ++;
          
        }else{
          verifs.push(`comparaison echouée (reservation a venir) reservation #${reservation.id} date reservation (${reservation.date_reservation}): date debut : ${start} - date fin : ${end} - heure actuelle : ${nowstring}`);

        }

        await reservation.table.update({ statut });
         tablesMisesAJour++;
        

    };


   
    for (const commande of commandes) {

      const dateRetrait = new Date(commande.date_retrait);
      const retraitTime = dateRetrait.getTime();

      if (now > retraitTime) {
        
        await notificationService.createNotification({
              objet:commande,
            type:'info',
            titre: `Commande terminée`,
            texte: `Nouveau statut de la Commande ${commande.id} : Terminée. `,
            utilisateur_id: 0
        });
        await notificationService.createNotification({
              objet:commande,
            type:'info',
            titre: `Commande terminée`,
            texte: `Votre Commande ${commande.id} est terminée`,
            utilisateur_id: commande.client_id
        });
        notificationsEnvoyees++;
        await commande.update({ statut:'Retirée'});
        commandesMisesAJour++;
        verifs.push(`comparaison date passée réussie commande #${commande.id} date retrait (${retraitTime}) - heure actuelle : ${now}`);

        let titre = 'Demande d\'avis'
        let lien = `https://resto.orocom.io/ajouter-avis/2/${commande.id}`
        
        nom_client = commande.client.nom
        prenom_client = commande.client.prenom
        email_client = commande.client.email
        nom_restaurant = commande.Restaurant.nom
        telephone_restaurant = commande.Restaurant.telephone
        await emailService.sendMail({
          to: 'ayrtongonsallo444@gmail.com',
          subject: titre,
          template: 'commande-info.ejs',
          context: { titre,lien,nom_client,prenom_client,email_client,nom_restaurant,telephone_restaurant } // variable à injecter dans ejs
        });
        mailsEnvoyees ++;
        
      }


    };

     return res.status(200).json({
      success: true,
      message: "🔄 Traitement de statut des commandes, reservations et tables",
      data: {
        total_commandes_traitées: commandes.length,
        total_reservations_traitées: reservations.length,
        tables_mises_a_jour: tablesMisesAJour,
        reservationsMisesAJour:reservationsMisesAJour,
        notifications_envoyées: notificationsEnvoyees,
        mailsEnvoyees:mailsEnvoyees,
        commandesMisesAJour:commandesMisesAJour,
        verifs:verifs,
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

