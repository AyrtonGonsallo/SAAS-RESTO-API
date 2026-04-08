const db = require('../models');
const bcrypt = require('bcryptjs');
const {  Societe, Utilisateur, Role,Portefeuille,Abonnement,Parametre } = db;

exports.ajouterSociete = async (req, res) => {
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
};

exports.getSocietes = async (req, res) => {
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
};

exports.getSocieteById = async (req, res, next) => {
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
};

exports.updateSociete = async (req, res, next) => {
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
};



exports.deleteSociete = async (req, res, next) => {
  try {
    const id = req.params.id;

    const societe = await Societe.findByPk(id);

    if (!societe) {
      return res.status(404).json({
        message: 'Société non trouvée'
      });
    }

    await Abonnement.destroy({ where: { societe_id: id } });
    await Portefeuille.destroy({ where: { societe_id: id } });
    await Utilisateur.destroy({ where: { societe_id: id } });
    await societe.destroy();

   

    return res.status(200).json({
      message: 'Société supprimée avec succès'
    });

  } catch (error) {
    next(error);
  }
};