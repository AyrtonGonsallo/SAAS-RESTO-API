const db = require('../models');
const {  Paiement,Restaurant,Parametre, Notification, Societe,Reservation,Commande,Utilisateur } = db;
const Stripe  = require('stripe')
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL;
const STRIPE_FAILURE_URL = process.env.STRIPE_FAILURE_URL;
const { Op } = require('sequelize');

exports.createPaiement = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      titre,
      type,
      moyen,
      montant,
      reference,
      description,
      reservation_id,
      societe_id,
      restaurant_id,
      utilisateur_id,
    } = req.body;

   
    //  2. DATE
    const datepaiement = new Date();

    let paiement = await Paiement.create({
      titre,
      date:datepaiement,
      type,
      moyen,
      montant,
      reference,
      description,
      reservation_id,
      societe_id,
      restaurant_id,
      utilisateur_id,
      }, { transaction: t });

   
    await t.commit();

    

    res.json(paiement);

  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPaiements = async (req, res) => {
  try {
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
      if(req.role_priorite==8){//si client
        restaurantFilter = {utilisateur_id: req.user_id}
      }else{
        if (selectedRestaurantId) {
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
      }
    }else{
      if (req.isSuperAdmin) {
      restaurantFilter = {}
      }
      else{
      restaurantFilter = {societe_id: req.societe_id}
      }
    }

    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const paiements = await Paiement.findAll({
        where:restaurantFilter,
        include: [
          {
              model: Restaurant,
              attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
              required: false,
          },
          {
              model: Societe,
              attributes: ['id', 'titre', ],
              required: false,
          },
          {
              model: Reservation,
              as:'reservation'
          },
          {
              model: Commande,
              as:'commande'
          },
          {
              model: Utilisateur,
          },
          
      ],
    });

    res.json(paiements);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findByPk(req.params.id, {});

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    res.json(paiement);
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};

exports.updatePaiement = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const paiement = await Paiement.findByPk(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    await paiement.update(req.body);
    res.json(paiement);

  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deletePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByPk(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    await paiement.destroy();

    res.json({ message: 'Paiement supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.createStripePaymentForReservation = async (req, res) => {

  const restaurantId = req.params.restaurantId;

  const final_reservation = req.body;

  const restaurant = await Restaurant.findByPk(restaurantId);

  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurant non trouvé' });
  }

  const params = await Parametre.findAll({
    where: {
      restaurant_id: restaurantId,
      type: [
        'cle_publique_stripe',
        'cle_privee_stripe',
        'montant_paiement_acompte_reservation',
      ],
      est_actif: true
    }
  });

  //  transformation propre key/value
  const config = Object.fromEntries(
    params.map(p => [p.type, p.valeur])
  );

  const stripe = Stripe(config.cle_privee_stripe);

  const montant = parseFloat(config.montant_paiement_acompte_reservation || 0);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Paiement de la réservation de ${final_reservation.client.nom} ${final_reservation.client.prenom} au restaurant "${restaurant.nom}"`,
          },
          unit_amount: Math.round(montant * 100), // 
        },
        quantity: 1,
      }
    ],
    success_url: `${STRIPE_SUCCESS_URL}`,
    cancel_url: `${STRIPE_FAILURE_URL}`,
    metadata: {
      id_final_reservation: final_reservation.id,
      type:'paiement_reservation',
      id_client: final_reservation.client.id,
      nom: final_reservation.client.nom,
      prenom: final_reservation.client.prenom,
      email: final_reservation.client.email,
      statut: final_reservation.statut,
      nombre_de_personnes: final_reservation.nombre_de_personnes,
      nb_couverts: final_reservation.nb_couverts,
      date_reservation: final_reservation.date_reservation,
      montant: montant
    }
  });

  const t = await db.sequelize.transaction();

  let notificationUser = await Notification.create({
      titre:`Lien de paiement pour votre réservation ${final_reservation.id}`,
      date_rappel:new Date(Date.now() + 60 * 60 * 1000),
      type:'rappel',
      canal:'site',
      texte:`Voici le lien de paiment de votre réservation ${final_reservation.id} : ${session.url}`,
      statut_lecture:'non lue',
      societe_id:final_reservation.societe_id,
      restaurant_id:final_reservation.restaurant_id,
      utilisateur_id:final_reservation.client_id,
      }, { transaction: t });

      

   
    await t.commit();

  return res.json({ url: session.url });
};



exports.createStripePaymentForCommande = async (req, res) => {

  const restaurantId = req.params.restaurantId;

  const final_commande = req.body;

  const restaurant = await Restaurant.findByPk(restaurantId);

  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurant non trouvé' });
  }

  const params = await Parametre.findAll({
    where: {
      restaurant_id: restaurantId,
      type: [
        'cle_publique_stripe',
        'cle_privee_stripe',
        'montant_paiement_acompte_click_and_collect',
      ],
      est_actif: true
    }
  });

  //  transformation propre key/value
  const config = Object.fromEntries(
    params.map(p => [p.type, p.valeur])
  );

  const stripe = Stripe(config.cle_privee_stripe);

  const montant = parseFloat(config.montant_paiement_acompte_click_and_collect || 0);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Paiement de la commande de ${final_commande.client.nom} ${final_commande.client.prenom} au restaurant "${restaurant.nom}"`,
          },
          unit_amount: Math.round(final_commande.totalPrice * 100), // 
        },
        quantity: 1,
      }
    ],
    success_url: `${STRIPE_SUCCESS_URL}`,
    cancel_url: `${STRIPE_FAILURE_URL}`,
    metadata: {
      type:'paiement_commande',
      id_final_commande: final_commande.id,
      id_client: final_commande.client.id,
      nom: final_commande.client.nom,
      prenom: final_commande.client.prenom,
      email: final_commande.client.email,
      statut: final_commande.statut,
      date_retrait: final_commande.date_retrait,
      montant: final_commande.totalPrice
    }
  });

  const t = await db.sequelize.transaction();

  let notificationUser = await Notification.create({
      titre:`Lien de paiement pour votre commande ${final_commande.id}`,
      date_rappel:new Date(Date.now() + 60 * 60 * 1000),
      type:'rappel',
      canal:'site',
      texte:`Voici le lien de paiment de votre commande ${final_commande.id} : ${session.url}`,
      statut_lecture:'non lue',
      societe_id:final_commande.societe_id,
      restaurant_id:final_commande.restaurant_id,
      utilisateur_id:final_commande.client_id,
      }, { transaction: t });

      

   
    await t.commit();

  return res.json({ url: session.url });
};