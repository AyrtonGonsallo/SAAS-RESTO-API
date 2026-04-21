// cat produits, variation produits
// routes/partie3.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const {
  createCreneau,
  getCreneaux, 
  getCreneauById,
  updateCreneau,
  deleteCreneau
} = require('../controllers/Creneau.contoller');
const {
  createService,
  getServices, 
  getServiceById,
  updateService,
  deleteService
} = require('../controllers/Service.controller');
const {
  createTag,
  getTags, 
  getTagById,
  updateTag,
  deleteTag
} = require('../controllers/Tag.controller');

const {
  createReservation,
  getReservations, 
  getReservationById,
  updateReservation,
  deleteReservation,
  getReservationDatasBySocieteID
} = require('../controllers/Reservation.controller');

const {
  createCommande,
  getCommandes, 
  getCommandeById,
  updateCommande,
  deleteCommande,
  getCommandesDatasBySocieteID
} = require('../controllers/Commande.controller');

const {
  createPaiement,
  getPaiements, 
  getPaiementById,
  updatePaiement,
  deletePaiement,
  createStripePaymentForCommande,
  createStripePaymentForReservation
} = require('../controllers/Paiement.controller');

const { Portefeuille, Abonnement, } = db;



router.get('/get_portefeuille_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const portefeuille = await Portefeuille.findByPk(id);

    if (!portefeuille) {
      return res.status(404).json({
        message: 'portefeuille non trouvé'
      });
    }

    return res.status(200).json(portefeuille);

  } catch (error) {
    next(error);
  }
});


router.get('/get_abonnement_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const abonnement = await Abonnement.findByPk(id);

    if (!abonnement) {
      return res.status(404).json({
        message: 'abonnement non trouvé'
      });
    }

    return res.status(200).json(abonnement);

  } catch (error) {
    next(error);
  }
});


router.put('/update_portefeuille/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      solde_sms,
      solde_ia,
      historique_id,
      alert_seuil_sms,
      alert_seuil_ia,
      societe_id,
     } = req.body;

    const portefeuille = await Portefeuille.findByPk(id);

    if (!portefeuille) {
      return res.status(404).json({
        message: 'Portefeuille non trouvé'
      });
    }

   

    await portefeuille.update({
      solde_sms,
      solde_ia,
      historique_id,
      alert_seuil_sms,
      alert_seuil_ia,
      societe_id,
    });

    

    return res.status(200).json(portefeuille);

  } catch (error) {
    next(error);
  }
});

function fromNgbDate(date) {
  if (!date) return null;

  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');

  return `${date.year}-${month}-${day}`;
}

router.put('/update_abonnement/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      formule,
      cout,
      date_debut,
      date_expiration,
      dernier_renouvellement,
      statut,
      renouvellement_auto,
      societe_id,
     } = req.body;

     const dateDebutFormatted = fromNgbDate(date_debut);
      const dateExpirationFormatted = fromNgbDate(date_expiration);
      const dateRenouvellementFormatted = fromNgbDate(dernier_renouvellement);

      console.log('update abb format', dateDebutFormatted, dateExpirationFormatted);

    const abonnement = await Abonnement.findByPk(id);

    if (!abonnement) {
      return res.status(404).json({
        message: 'Abonnement non trouvé'
      });
    }

   
    await abonnement.update({
      formule,
      cout,
      date_debut:dateDebutFormatted,
      date_expiration:dateExpirationFormatted,
      dernier_renouvellement:dateRenouvellementFormatted,
      statut,
      renouvellement_auto,
      societe_id,
    });


    return res.status(200).json(abonnement);

  } catch (error) {
    next(error);
  }
});

// CREATE
router.post('/ajouter_creneau', createCreneau);

// READ ALL
router.get('/get_all_creneaux', getCreneaux);

// READ BY ID
router.get('/get_creneau_by_id/:id', getCreneauById);

// UPDATE
router.put('/update_creneau/:id', updateCreneau);

// DELETE
router.delete('/delete_creneau/:id', deleteCreneau);

// CREATE
router.post('/ajouter_service', createService);

// READ ALL
router.get('/get_all_services', getServices);

// READ BY ID
router.get('/get_service_by_id/:id', getServiceById);

// UPDATE
router.put('/update_service/:id', updateService);

// DELETE
router.delete('/delete_service/:id', deleteService);


// CREATE
router.post('/ajouter_tag', createTag);

// READ ALL
router.get('/get_all_tags', getTags);

// READ BY ID
router.get('/get_tag_by_id/:id', getTagById);

// UPDATE
router.put('/update_tag/:id', updateTag);

// DELETE
router.delete('/delete_tag/:id', deleteTag);


// CREATE
router.post('/ajouter_reservation', createReservation);

// READ ALL
router.get('/get_all_reservations', getReservations);

// READ BY ID
router.get('/get_reservation_by_id/:id', getReservationById);

// UPDATE
router.put('/update_reservation/:id', updateReservation);

// DELETE
router.delete('/delete_reservation/:id', deleteReservation);

router.get('/get_reservation_datas_by_societeID/:societeID', getReservationDatasBySocieteID);

router.post('/get_stripe_payment_link_for_reservation/:restaurantId', createStripePaymentForReservation);


// CREATE
router.post('/ajouter_paiement', createPaiement);

// READ ALL
router.get('/get_all_paiements', getPaiements);

// READ BY ID
router.get('/get_paiement_by_id/:id', getPaiementById);

// UPDATE
router.put('/update_paiement/:id', updatePaiement);

// DELETE
router.delete('/delete_paiement/:id', deletePaiement);

// CREATE
router.post('/ajouter_commande', createCommande);

// READ ALL
router.get('/get_all_commandes', getCommandes);

// READ BY ID
router.get('/get_commande_by_id/:id', getCommandeById);

// UPDATE
router.put('/update_commande/:id', updateCommande);

// DELETE
router.delete('/delete_commande/:id', deleteCommande);

router.get('/get_commande_datas_by_societeID/:societeID', getCommandesDatasBySocieteID);

router.post('/get_stripe_payment_link_for_commande/:restaurantId', createStripePaymentForCommande);



module.exports = router;