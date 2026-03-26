//societe, restaurants, utilisateurs, roles
// routes/partie1.routes.js
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const db = require('../models');

const { Societe, Utilisateur, Restaurant, Role, RestaurantTable } = db;

router.post('/ajouter_societe', async (req, res) => {
  try {
    const {
      titre,
      email,
      mot_de_passe,
      nom,
      prenom,
      telephone
    } = req.body;

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const role  = await Role.findOne({
      where: { type:'gestionnaire-societe' }
    });
    //console.log(role)

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    // 👤 1. Créer le gestionnaire
    const gestionnaire = await Utilisateur.create({
      nom,
      prenom,
      email,
      telephone,
      mot_de_passe: hashedPassword,
      role_id: role.id // gestionnaire
    });

    // 🏢 2. Créer la société
    const societe = await db.Societe.create({
      titre,
      date_creation: new Date(),
      status: 'active',
      abonnement_id: null,
      portefeuille_id: null,
      gestionnaire_id: gestionnaire.id // 👈 relation
    });

    // 🔗 3. Mettre à jour l'utilisateur avec la société
    await gestionnaire.update({
      societe_id: societe.id
    });

    return res.status(201).json({
      success: true,
      data: societe
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});


router.get('/get_all_societes', async (req, res) => {
  try {

    const societes = await Societe.findAll({
      
      include: [
        {
          model: Utilisateur,
           as: 'gestionnaire',
          attributes: ['id', 'nom', 'prenom', 'email','telephone'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(societes);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});



router.get('/get_societe_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const societe = await Societe.findByPk(id);

    if (!societe) {
      return res.status(404).json({
        message: 'Societe non trouvée'
      });
    }

    return res.status(200).json(societe);

  } catch (error) {
    next(error);
  }
});


router.put('/update_societe/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { titre,status } = req.body;

    const societe = await Societe.findByPk(id);

    if (!societe) {
      return res.status(404).json({
        message: 'Societe non trouvée'
      });
    }

    await societe.update({
      titre,
      status
    });

    return res.status(200).json(societe);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_societe/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const societe = await Societe.findByPk(id);

    if (!societe) {
      return res.status(404).json({
        message: 'Société non trouvée'
      });
    }

     await Utilisateur.destroy({ where: { societe_id: id } });
    await societe.destroy();

   

    return res.status(200).json({
      message: 'Société supprimée avec succès'
    });

  } catch (error) {
    next(error);
  }
});

router.post('/ajouter_role', async (req, res,next) => {
  try {
    const { titre, type } = req.body;

    const role = await Role.create({
      titre,
      type
    });

    return res.status(201).json({
      success: true,
      data: role
    });

  } catch (error) {
    next(error); // 👈 envoie au middleware
  }
});


router.get('/get_all_roles', async (req, res) => {
  try {

    const roles = await Role.findAll({
      
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(roles);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});

router.get('/get_role_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    return res.status(200).json(role);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_role/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    await role.destroy();

    return res.status(200).json({
      message: 'Rôle supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
});

router.put('/update_role/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { titre, type } = req.body;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    await role.update({
      titre,
      type
    });

    return res.status(200).json(role);

  } catch (error) {
    next(error);
  }
});


router.post('/ajouter_utilisateur', async (req, res,next) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      mot_de_passe,
      role_id,
      societe_id,
    } = req.body;

    // 🔐 hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const user = await Utilisateur.create({
      nom,
      prenom,
      email,
      telephone,
      mot_de_passe: hashedPassword,
      role_id,
      societe_id,
    });

    return res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/get_all_utilisateurs', async (req, res) => {
  try {

    const utilisateurs = await Utilisateur.findAll({
      
      include: [
        {
          model: Role,
          required: false,
          
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'commandes_par_minutes'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: false,
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status', ],
          required: false,
          
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(utilisateurs);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
});


router.get('/get_utilisateur_by_id/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    return res.status(200).json(utilisateur);

  } catch (error) {
    next(error);
  }
});




router.get('/get_all_utilisateurs_by_role/:role_type', async (req, res, next) => {
  try {
    const role_type = req.params.role_type;

    const role  = await Role.findOne({
      where: { type:role_type }
    });

    const utilisateurs = await Utilisateur.findAll({
      where: {
        role_id: role.id
      },
      include: [
        {
          model: Role,
          required: false,
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'commandes_par_minutes'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: false,
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status'],
          required: false,
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(utilisateurs);

  } catch (error) {
    next(error);
  }
});


router.put('/update_utilisateur/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { nom, prenom, email, telephone, role_id, societe_id, restaurant_id } = req.body;

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    //  Mise à jour des champs simples
    await utilisateur.update({ nom, prenom, email, telephone, role_id, societe_id });

    //  Mise à jour des restaurants (Many-to-Many)
    if (Array.isArray(restaurant_id)) {
      // `setRestaurants` remplace les associations existantes
      await utilisateur.setRestaurants(restaurant_id);
    }

    //  Recharger l'utilisateur avec les relations
    const updatedUser = await Utilisateur.findByPk(id, {
      include: [
        { model: Role },
        { model: Societe },
        { model: Restaurant } // tous les restaurants liés
      ]
    });

    return res.status(200).json(updatedUser);

  } catch (error) {
    next(error);
  }
});

router.delete('/delete_utilisateur/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    const utilisateur = await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

     
    await utilisateur.destroy();

   

    return res.status(200).json({
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
});



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




module.exports = router;