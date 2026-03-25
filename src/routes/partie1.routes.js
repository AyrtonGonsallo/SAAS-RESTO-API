//societe, restaurants, utilisateurs, roles
// routes/partie1.routes.js
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const db = require('../models');

const { Societe, Utilisateur, Restaurant, Role } = db;

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

    // 👤 1. Créer le gestionnaire
    const gestionnaire = await Utilisateur.create({
      nom,
      prenom,
      email,
      telephone,
      mot_de_passe: hashedPassword,
      role_id: 1 // gestionnaire
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
      /*
      include: [
        {
          model: Utilisateur,
          attributes: ['id', 'nom', 'prenom', 'email'],
          required: false
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom'],
          required: false
        }
      ],*/
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
      societe_id,
      restaurant_id
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










module.exports = router;