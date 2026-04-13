//societe, utilisateurs, roles, portefeuille, abonnement
// routes/partie1.routes.js
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Societe, Utilisateur, Restaurant, Role, } = db;
const {
  ajouterSociete,
  getSocietes, 
  getSocieteById,
  updateSociete,
  deleteSociete
} = require('../controllers/Societe.controller');

const {
  ajouterRole,
  getRoles, 
  getRoleById,
  updateRole,
  deleteRole
} = require('../controllers/Role.controller');

router.post('/ajouter_societe', ajouterSociete);


router.get('/get_all_societes', getSocietes);



router.get('/get_societe_by_id/:id', getSocieteById);


router.put('/update_societe/:id', updateSociete);

router.delete('/delete_societe/:id', deleteSociete);

router.post('/ajouter_role', ajouterRole);


router.get('/get_all_roles', getRoles);

router.get('/get_role_by_id/:id', getRoleById);

router.delete('/delete_role/:id', deleteRole);

router.put('/update_role/:id', updateRole);


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
      restaurant_id
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
      societe_id:(societe_id>0)?societe_id:null,
    });

    //  Mise à jour des restaurants (Many-to-Many)
    if (Array.isArray(restaurant_id)) {
      console.log("restaurant_id",restaurant_id)
      // `setRestaurants` remplace les associations existantes
      await user.setRestaurants(restaurant_id);
    }

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

    const selectedRestaurantId = req.query.restaurant_id;
    console.log("req.societe_id,",req.societe_id);
    console.log("req.isSuperAdmin,",req.isSuperAdmin);
    console.log("req.restos,",req.restos);
    console.log("req.role_priorite", req.role_priorite);
    console.log("selectedRestaurantId", selectedRestaurantId);
    
   let ishigh = req.role_priorite<4

    // construire le filtre restaurant
    let restaurantFilter = {};

    if (!ishigh) {//pas sadm,gessos,adm,
      if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
          id: selectedRestaurantId
        };
      } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
        restaurantFilter = {
          id: {
            [Op.in]: req.restos
          }
        };
      }
    }

    const utilisateurs = await Utilisateur.findAll({
      where: req.isSuperAdmin ? {} : {
        societe_id: req.societe_id
      },
      include: [
        {
          model: Role,
          required: false,
          
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: !ishigh,
          ...(ishigh ? {} : {
            where: restaurantFilter
          })
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

    const utilisateur = await Utilisateur.findByPk(id,{
      include: [
         {
          model: Role,
          required: false,
          
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: false,
        },
      ]
    } );

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

    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};
    let userFilter = {};

    if (!req.isSuperAdmin) {
      if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
          restaurant_id: selectedRestaurantId,
          societe_id: req.societe_id,
          role_id: role.id
        };
         userFilter = {
          societe_id: req.societe_id,
          role_id: role.id
        };
      } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
        restaurantFilter = {
          restaurant_id: {
            [Op.in]: req.restos
          },
          societe_id: req.societe_id,
          role_id: role.id
        };
        userFilter = {
          societe_id: req.societe_id,
          role_id: role.id
        };
      }
    }else{
       restaurantFilter = {role_id: role.id}
       userFilter = {role_id: role.id}
    }

    const utilisateurs = await Utilisateur.findAll({
      where: userFilter,
      include: [
        {
          model: Role,
          required: false,
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
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







module.exports = router;