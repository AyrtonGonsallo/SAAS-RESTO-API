//restaurant, tables, produits, cat produits, variation produits
// routes/partie2.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
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
const { CategorieProduit,RestaurantTable, Societe, Restaurant,ZoneTable,Parametre } = db;

const {
  ajouterRestaurant,
  getRestaurants, 
  getRestaurantsWithParametres,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  recreerParametresRestaurant
} = require('../controllers/Restaurant.controller');


router.post('/ajouter_restaurant', ajouterRestaurant);

router.get('/get_all_restaurants_with_parametres', getRestaurantsWithParametres);

router.get('/get_all_restaurants', getRestaurants);

router.get('/get_restaurant_by_id/:id', getRestaurantById);

router.get('/recreate_parametres_restaurant/:id', recreerParametresRestaurant);


router.put('/update_restaurant/:id',upload.single('image'), updateRestaurant);

router.delete('/delete_restaurant/:id', deleteRestaurant);


router.post('/ajouter_table', async (req, res,next) => {
  try {
    const {
      numero,
      nb_places,
      statut,
      zone_id,
      restaurant_id,
      societe_id,
    } = req.body;



    const resto = await RestaurantTable.create({
      numero,
      nb_places,
      statut,
      zone_id,
      restaurant_id,
      societe_id,
    });

    return res.status(201).json({
      success: true,
      data: resto
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/get_all_tables', async (req, res) => {
  try {

    const selectedRestaurantId = req.query.restaurant_id;
    // construire le filtre restaurant
    let restaurantFilter = {};
    let ishigh = req.role_priorite<4

    if (!ishigh) {
      if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
          restaurant_id: selectedRestaurantId,
          societe_id: req.societe_id
        };
      } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
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
    const tables = await RestaurantTable.findAll({
      where: restaurantFilter,
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status', ],
          required: false,
          
        },
        {
          model: ZoneTable,
          attributes: ['id', 'titre',  ],
          required: false,
          
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(tables);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});



router.get('/get_table_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const table = await RestaurantTable.findByPk(id);

    if (!table) {
      return res.status(404).json({
        message: 'Table non trouvée'
      });
    }

    return res.status(200).json(table);

  } catch (error) {
    next(error);
  }
});


router.put('/update_table/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      numero,
      nb_places,
      statut,
      restaurant_id,
      zone_id,
      societe_id,
     } = req.body;

    const table = await RestaurantTable.findByPk(id);

    if (!table) {
      return res.status(404).json({
        message: 'Table non trouvée'
      });
    }

    await table.update({
      numero,
      nb_places,
      statut,
      zone_id,
      restaurant_id,
      societe_id,
    });

    return res.status(200).json(table);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_table/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const table = await RestaurantTable.findByPk(id);

    if (!table) {
      return res.status(404).json({
        message: 'Table non trouvée'
      });
    }

     
    await table.destroy();

   

    return res.status(200).json({
      message: 'RestaurantTable supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
});

router.post('/ajouter_categorie_produit', async (req, res,next) => {
  try {
    const {
      titre,
      description,
      est_actif,
      ordre,
      societe_id,
      restaurant_id,
      utilisateur_id,
    } = req.body;



    const categorie = await CategorieProduit.create({
      titre,
      description,
      est_actif,
      ordre,
      societe_id,
      restaurant_id,
      utilisateur_id,
    });

    return res.status(201).json({
      success: true,
      data: categorie
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/get_all_categories_produit', async (req, res) => {
  try {

    const selectedRestaurantId = req.query.restaurant_id;
    // construire le filtre restaurant
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
      if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
          restaurant_id: selectedRestaurantId,
          societe_id: req.societe_id
        };
      } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
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
    const categories = await CategorieProduit.findAll({
       where: restaurantFilter,
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        
        },
      ],
      order: [['restaurant_id', 'DESC'],['ordre', 'ASC'],['created_at', 'DESC']]
    });

    return res.status(200).json(categories);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});



router.get('/get_categorie_produit_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const categorie_produit = await CategorieProduit.findByPk(id);

    if (!categorie_produit) {
      return res.status(404).json({
        message: 'categorie_produit non trouvée'
      });
    }

    return res.status(200).json(categorie_produit);

  } catch (error) {
    next(error);
  }
});


router.put('/update_categorie_produit/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      titre,
      description,
      est_actif,
      ordre,
      societe_id,
      restaurant_id,
      utilisateur_id,
     } = req.body;

    const categorie_produit = await CategorieProduit.findByPk(id);

    if (!categorie_produit) {
      return res.status(404).json({
        message: 'categorie_produit non trouvée'
      });
    }

    await categorie_produit.update({
      titre,
      description,
      est_actif,
      ordre,
      societe_id,
      restaurant_id,
      utilisateur_id,
    });

    return res.status(200).json(categorie_produit);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_categorie_produit/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const categorie_produit = await CategorieProduit.findByPk(id);

    if (!categorie_produit) {
      return res.status(404).json({
        message: 'categorie_produit non trouvée'
      });
    }

     
    await categorie_produit.destroy();

   

    return res.status(200).json({
      message: 'categorie_produit supprimée avec succès'
    });

  } catch (error) {
    next(error);
  }
});








module.exports = router;