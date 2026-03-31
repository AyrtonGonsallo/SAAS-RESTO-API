//societe, utilisateurs, roles, portefeuille, abonnement
// routes/partie1.routes.js
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Societe, Utilisateur, Restaurant, Role,Portefeuille,Abonnement,Parametre } = db;

router.post('/ajouter_societe', async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      titre,
      email,
      mot_de_passe,
      nom,
      prenom,
      telephone
    } = req.body;

    // Vérifier si email existe déjà
    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email déjà utilisé'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Récupérer rôle
    const role = await Role.findOne({
      where: { type: 'gestionnaire-societe' },
      transaction: t
    });

    if (!role) {
      await t.rollback();
      return res.status(404).json({ message: 'Rôle non trouvé' });
    }

    // 1. Créer utilisateur
    const gestionnaire = await Utilisateur.create({
      nom,
      prenom,
      email,
      telephone,
      mot_de_passe: hashedPassword,
      role_id: role.id
    }, { transaction: t });

    // Dates abonnement
    const now = new Date();
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1); // +1 an

    

    // 3. Créer société
    const societe = await db.Societe.create({
      titre,
      date_creation: now,
      status: 'active',
      abonnement_id: null,
      gestionnaire_id: gestionnaire.id
    }, { transaction: t });

    // 2. Créer abonnement
    const abonnement = await db.Abonnement.create({
      formule: 'free',
      cout: 0,
      date_debut: now,
      date_expiration: expiration,
      societe_id: societe.id
    }, { transaction: t });

    // 4. Créer portefeuille
    const portefeuille = await db.Portefeuille.create({
      solde_sms: 0,
      solde_ia: 0,
      alert_seuil_sms: 10,
      alert_seuil_ia: 10,
      societe_id: societe.id
    }, { transaction: t });

    // 5. Mise à jour relations
    await societe.update({
      portefeuille_id: portefeuille.id,
      abonnement_id: abonnement.id,
    }, { transaction: t });

    await abonnement.update({
      societe_id: societe.id
    }, { transaction: t });

    await gestionnaire.update({
      societe_id: societe.id
    }, { transaction: t });

    // Commit final
    await t.commit();

    return res.status(201).json({
      success: true,
      data: societe
    });

  } catch (error) {
    // rollback total
    await t.rollback();

    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
});


router.get('/get_all_societes', async (req, res) => {
  try {

    console.log("req.societe_id,",req.societe_id,)
  console.log("req.isSuperAdmin,",req.isSuperAdmin,)
  console.log("req.restos,",req.restos,)
    const societes = await Societe.findAll({
       where: req.isSuperAdmin ? {} : {
        id: req.societe_id
      },
      include: [
        {
          model: Utilisateur,
          as: 'gestionnaire',
          attributes: ['id', 'nom', 'prenom', 'email','telephone'],
          required: false
        },
        {
          model: Portefeuille,
          as: 'portefeuille',
          required: false
        },
        {
          model: Abonnement,
          as: 'abonnement',
          required: false
        },
        {
          model: Parametre,
          as: 'parametres'
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
    console.log("selectedRestaurantId", selectedRestaurantId);

    // construire le filtre restaurant
    let restaurantFilter = {};

    if (!req.isSuperAdmin) {
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
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'telephone'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: !req.isSuperAdmin,
          ...(req.isSuperAdmin ? {} : {
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
          model: Restaurant,
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'telephone'],
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
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'telephone'],
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