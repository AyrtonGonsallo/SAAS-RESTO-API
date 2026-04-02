// cat produits, variation produits
// routes/partie3.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');

const { Portefeuille, Abonnement, Societe, } = db;




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




module.exports = router;