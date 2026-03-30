//restaurant, tables, produits, cat produits, variation produits
// routes/partie2.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');

const { CategorieProduit,RestaurantTable, Societe, Restaurant,Utilisateur } = db;




router.post('/ajouter_restaurant', async (req, res,next) => {
  try {
    const {
      nom,
      lieu,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      commandes_par_minutes,
      societe_id,
      utilisateur_id
    } = req.body;



    const resto = await Restaurant.create({
      nom,
      lieu,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      commandes_par_minutes,
      societe_id,
      utilisateur_id
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


router.get('/get_all_restaurants', async (req, res) => {
  try {

    const restaurants = await Restaurant.findAll({
       where: req.isSuperAdmin ? {} : {
        societe_id: req.societe_id
      },
      include: [
        {
          model: Utilisateur,
          as: 'gestionnaire',
          attributes: ['id', 'nom', 'prenom', 'email','telephone'],
          required: false
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status', ],
          required: false,
          
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(restaurants);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});



router.get('/get_restaurant_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    return res.status(200).json(restaurant);

  } catch (error) {
    next(error);
  }
});


router.put('/update_restaurant/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      nom,
      lieu,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      commandes_par_minutes,
      societe_id,
      utilisateur_id
     } = req.body;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    await restaurant.update({
      nom,
      lieu,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      commandes_par_minutes,
      societe_id,
      utilisateur_id
    });

    return res.status(200).json(restaurant);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_restaurant/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

     
    await restaurant.destroy();

   

    return res.status(200).json({
      message: 'Restaurant supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
});


router.post('/ajouter_table', async (req, res,next) => {
  try {
    const {
      numero,
      nb_places,
      statut,
      restaurant_id,
      societe_id,
    } = req.body;



    const resto = await RestaurantTable.create({
      numero,
      nb_places,
      statut,
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

    const tables = await RestaurantTable.findAll({
       where: req.isSuperAdmin ? {} : {
        societe_id: req.societe_id
      },
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'commandes_par_minutes'],
          required: false
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status', ],
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
      societe_id,
      restaurant_id,
      utilisateur_id,
    } = req.body;



    const categorie = await CategorieProduit.create({
      titre,
      description,
      est_actif,
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

    const categories = await CategorieProduit.findAll({
       where: req.isSuperAdmin ? {} : {
        societe_id: req.societe_id
      },
      include: [
        
      ],
      order: [['created_at', 'DESC']]
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