const db = require('../models');
const { Op } = require('sequelize');
const { Parametre,Restaurant  } = db;

exports.ajouterParametre = async (req, res,next) => {
  try {
    const {
      titre,
      type,
      valeur,
      description,
      est_actif,
      societe_id,
      restaurant_id,
      utilisateur_id,

    } = req.body;
    //console.log("file",req.file)

    const image = req.file ? req.file.filename : null;

    const parametre = await Parametre.create({
      titre,
      type,
      valeur: type === 'logo' ? image : valeur,
      description,
      est_actif,
      societe_id,
      restaurant_id,
      utilisateur_id,
    });

    return res.status(201).json({
      success: true,
      data: parametre
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getParametres =  async (req, res) => {
  try {

    const selectedRestaurantId = req.query.restaurant_id;
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
    const parametres = await Parametre.findAll({
      where: restaurantFilter,
      include: [
       {
          model: Restaurant,
          attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        
        },
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(parametres);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};

exports.getParametreByTypeAndRestaurant = async (req, res, next) => {
  try {
    const type = req.params.type;
    const restaurant_id = req.params.restaurant_id;
    

    const parametre = await Parametre.findOne({
      where: {
        type,
        restaurant_id
      }
    });

    if (!parametre) {
      return res.status(404).json({
        message: 'Parametre non trouvé'
      });
    }

    return res.status(200).json(parametre);

  } catch (error) {
    next(error);
  }
};

exports.getParametreById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const parametre = await Parametre.findByPk(id);

    if (!parametre) {
      return res.status(404).json({
        message: 'Parametre non trouvé'
      });
    }

    return res.status(200).json(parametre);

  } catch (error) {
    next(error);
  }
};

exports.updateParametre = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      titre,
      type,
      valeur,
      description,
      est_actif,
      societe_id,
      restaurant_id,
      utilisateur_id,
     } = req.body;

    const parametre = await Parametre.findByPk(id);

    if (!parametre) {
      return res.status(404).json({
        message: 'Parametre non trouvé'
      });
    }

    const image = req.file ? req.file.filename : null;

    await parametre.update({
      titre,
      type,
      valeur: type === 'logo' ? image : valeur,
      description,
      est_actif,
      societe_id,
      restaurant_id,
      utilisateur_id,
    });

    return res.status(200).json(parametre);

  } catch (error) {
    next(error);
  }
};



exports.deleteParametre = async (req, res, next) => {
  try {
    const id = req.params.id;

    const parametre = await Parametre.findByPk(id);

    if (!parametre) {
      return res.status(404).json({
        message: 'Parametre non trouvé'
      });
    }

     
    await parametre.destroy();

   

    return res.status(200).json({
      message: 'Parametre supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};