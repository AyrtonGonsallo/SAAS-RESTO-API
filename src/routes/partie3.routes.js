// cat produits, variation produits
// routes/partie3.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const { Produit, CategorieProduit, VariationProduit,RestaurantTable, Societe, Restaurant,Utilisateur } = db;



router.post('/ajouter_produit', upload.single('image'),async (req, res,next) => {
  try {
    const {
      statut,
      titre,
      description,
      categorie_id,
      actif,
      prix_ht,
      tva,
      allergenes,
      stock,
      societe_id,
      restaurant_id,

    } = req.body;
    //console.log("file",req.file)

    const image = req.file ? req.file.filename : null;

    const produit = await Produit.create({
      statut,
      titre,
      image,
      description,
      categorie_id,
      actif,
      prix_ht,
      tva,
      allergenes,
      stock,
      societe_id,
      restaurant_id,
    });

    return res.status(201).json({
      success: true,
      data: produit
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/get_all_produits', async (req, res) => {
  try {

    const produits = await Produit.findAll({
      
      include: [
        {
          model: CategorieProduit,
          as: 'categorie',
          attributes: ['id', 'titre', 'est_actif'],
          required: false
        },
        {
          model: VariationProduit,
          as: 'variations',
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(produits);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});



router.get('/get_produit_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const produit = await Produit.findByPk(id);

    if (!produit) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    return res.status(200).json(produit);

  } catch (error) {
    next(error);
  }
});


router.put('/update_produit/:id', upload.single('image'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      statut,
      titre,
      description,
      categorie_id,
      actif,
      prix_ht,
      tva,
      allergenes,
      stock,
      societe_id,
      restaurant_id,
     } = req.body;

    const produit = await Produit.findByPk(id);

    if (!produit) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    const image = req.file ? req.file.filename : null;

    await produit.update({
      statut,
      titre,
      image,
      description,
      categorie_id,
      actif,
      prix_ht,
      tva,
      allergenes,
      stock,
      societe_id,
      restaurant_id,
    });

    return res.status(200).json(produit);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_produit/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const produit = await Produit.findByPk(id);

    if (!produit) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

     
    await produit.destroy();

   

    return res.status(200).json({
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
});




router.post('/ajouter_variation_produit', async (req, res,next) => {
  try {
    const {
      produit_id,
      titre,
      description,
      obligatoire,
      supplement_prix,
      stock,
      societe_id,
      restaurant_id,
      

    } = req.body;



    const variation_produit = await VariationProduit.create({
      produit_id,
      titre,
      description,
      obligatoire,
      supplement_prix,
      stock,
      societe_id,
      restaurant_id,
    });

    return res.status(201).json({
      success: true,
      data: variation_produit
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/get_all_variations_produit', async (req, res) => {
  try {

    const variation_produits = await VariationProduit.findAll({
      
      include: [
         {
          model: Produit,
          as: 'produit'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(variation_produits);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});



router.get('/get_variation_produit_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const variation_produit = await VariationProduit.findByPk(id);

    if (!variation_produit) {
      return res.status(404).json({
        message: 'VariationProduit non trouvé'
      });
    }

    return res.status(200).json(variation_produit);

  } catch (error) {
    next(error);
  }
});


router.put('/update_variation_produit/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      produit_id,
      titre,
      description,
      obligatoire,
      supplement_prix,
      stock,
      societe_id,
      restaurant_id,
     } = req.body;

    const variation_produit = await VariationProduit.findByPk(id);

    if (!variation_produit) {
      return res.status(404).json({
        message: 'VariationProduit non trouvé'
      });
    }

    await variation_produit.update({
      produit_id,
      titre,
      description,
      obligatoire,
      supplement_prix,
      stock,
      societe_id,
      restaurant_id,
    });

    return res.status(200).json(variation_produit);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_variation_produit/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const variation_produit = await VariationProduit.findByPk(id);

    if (!variation_produit) {
      return res.status(404).json({
        message: 'VariationProduit non trouvé'
      });
    }

     
    await variation_produit.destroy();

   

    return res.status(200).json({
      message: 'VariationProduit supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
});







module.exports = router;