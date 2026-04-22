// cat produits, variation produits
// routes/stripe.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const Stripe  = require('stripe')
const { Reservation, Paiement, Commande, Panier } = db;
const endpointSecret = process.env.ENDPOINT_SECRET;
const {stripeLogger} = require('../utils/logger');


router.post(`/stripe_reservation_payment_webhook`, express.raw({ type: 'application/json' }), async (req, res) => {

  const sig = req.headers['stripe-signature'];

  let event;
    stripeLogger.info(
      `debut stripe`
    );
  try {
    event = Stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
      stripeLogger.error(`
        ERROR ${req.method} ${req.originalUrl}
        Message: ${err.message}
        Stack: ${err.stack}
        Body: ${JSON.stringify(req.body)}`);
    return res.status(400).send(`Webhook Error`);
  }

  if (event.type === 'checkout.session.completed') {

    const session = event.data.object;

    const type = session.metadata.type;
    if(type == 'paiement_commande'){

      const id_final_commande = session.metadata.id_final_commande;
      const nom = session.metadata.nom;
      const prenom = session.metadata.prenom;
      const email = session.metadata.email;
      const statut = session.metadata.statut;
      const date_retrait = session.metadata.date_retrait;
      const montant = session.metadata.montant;
      
      console.log('id_final_commande',id_final_commande)
      console.log('nom',nom)
      console.log('prenom',prenom)
      console.log('email',email)
      console.log('statut',statut)
      console.log('montant',montant)
      console.log('date_retrait',date_retrait)

      stripeLogger.info(
        `id_final_commande ${id_final_commande} - nom ${nom} - prenom ${prenom} - email ${email} - statut ${statut}  - date_retrait ${date_retrait} -  montant ${montant}`,
      );

      const t = await db.sequelize.transaction();

      stripeLogger.info(
        `debut transaction`,
      );

      const commande = await Commande.findByPk(id_final_commande, {
        transaction: t,
        lock: t.LOCK.UPDATE //  important
      });
      if (!commande) {
        await t.rollback();
        return res.status(404).json({ message: 'commande non trouvée' });
      }
      stripeLogger.info(
        `commande ${id_final_commande} trouvée`,
      );

      const datepaiement = new Date();
      
      let paiement = await Paiement.create({
        titre:`Paiement d'une commande pour le client ${nom} ${prenom}`,
        date:datepaiement,
        type:'Solde final',
        moyen:'Stripe',
        montant:montant,
        reference:null,
        description:`Paiement d'une commande pour le client ${nom} ${prenom}`,
        commande_id:id_final_commande,
        societe_id:commande.societe_id,
        restaurant_id:commande.restaurant_id,
        utilisateur_id:commande.client_id,
        }, { transaction: t });

        stripeLogger.info(
        `paiement crée ${paiement.id}`,
      );

      await commande.update({
        statut:'En préparation',
      }, { transaction: t });

      const panier = await Panier.findByPk(commande.panier_id, {
        transaction: t,
        lock: t.LOCK.UPDATE //  important
      });
      if (!panier) {
        await t.rollback();
        return res.status(404).json({ message: 'panier non trouvée' });
      }

      await panier.update({
        statut:'payé',
        paiement_id:paiement.id
      }, { transaction: t });

      stripeLogger.info(
        `panier mis a jour`,
      );

      await t.commit();

    }else if(type == 'paiement_reservation' ){
      const id_final_reservation = session.metadata.id_final_reservation;
      const nom = session.metadata.nom;
      const prenom = session.metadata.prenom;
      const email = session.metadata.email;
      const statut = session.metadata.statut;
      const nombre_de_personnes = session.metadata.nombre_de_personnes;
      const nb_couverts = session.metadata.nb_couverts;
      const date_reservation = session.metadata.date_reservation;
      const montant = session.metadata.montant;
      
      console.log('id_final_reservation',id_final_reservation)
      console.log('nom',nom)
      console.log('prenom',prenom)
      console.log('email',email)
      console.log('statut',statut)
      console.log('nombre_de_personnes',nombre_de_personnes)
      console.log('montant',montant)
      console.log('date_reservation',date_reservation)

      stripeLogger.info(
        `id_final_reservation ${id_final_reservation} - nom ${nom} - prenom ${prenom} - email ${email} - statut ${statut} - nombre_de_personnes ${nombre_de_personnes} - date_reservation ${date_reservation} -  montant ${montant}`,
      );

      const t = await db.sequelize.transaction();

      stripeLogger.info(
        `debut transaction`,
      );

      const reservation = await Reservation.findByPk(id_final_reservation, {
        transaction: t,
        lock: t.LOCK.UPDATE //  important
      });
      if (!reservation) {
        await t.rollback();
        return res.status(404).json({ message: 'Reservation non trouvée' });
      }
      stripeLogger.info(
        `reservation ${id_final_reservation} trouvée`,
      );

      const datepaiement = new Date();
      
      let paiement = await Paiement.create({
        titre:`Paiement d'une reservation pour le client ${nom} ${prenom}`,
        date:datepaiement,
        type:'Acompte',
        moyen:'Stripe',
        montant:montant,
        reference:null,
        description:`Paiement d'une reservation pour le client ${nom} ${prenom}`,
        reservation_id:reservation.id,
        societe_id:reservation.societe_id,
        restaurant_id:reservation.restaurant_id,
        utilisateur_id:reservation.client_id,
        }, { transaction: t });

        stripeLogger.info(
        `paiement crée ${paiement.id}`,
      );

      await reservation.update({
        statut:'Confirmée',
      }, { transaction: t });

      stripeLogger.info(
        `reservation mise a jour`,
      );

      await t.commit();

    }

    

    
   
  }

  res.json({ received: true });
});
module.exports = router;