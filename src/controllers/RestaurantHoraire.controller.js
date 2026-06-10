const db = require('../models');
const {  Societe, RestaurantHoraire,Utilisateur,Restaurant,Service  } = db;
const { Op } = require('sequelize');


exports.ajouterRestaurantHoraire = async (req, res, next) => {
  try {
    const {
      jour,
      type,
      ferme,
      heure_debut,
      heure_fin,
      service_id,
      restaurant_id,
      societe_id,
      utilisateur_id
    } = req.body;

    const restaurant = await Restaurant.findByPk(restaurant_id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'restaurant non trouvé'
      });
    }

    const horaire = await RestaurantHoraire.create({
      jour,
      type,
      ferme,
      heure_debut,
      heure_fin,
      service_id,
      restaurant_id,
      societe_id,
      utilisateur_id
    });

    return res.status(201).json({
      success: true,
      data: horaire
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getRestaurantHoraires = async (req, res) => {
  try {

    let ishigh = req.role_priorite<4
    const selectedRestaurantId = req.query.restaurant_id;
    // construire le filtre restaurant
    let restaurantFilter = {};

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
          restaurantFilter = {};
       }else{
          restaurantFilter = {societe_id: req.societe_id};
       }
      
    }
    const horaires = await RestaurantHoraire.findAll({
      where: restaurantFilter,
      include: [
        {
          model: Restaurant,
          required: false
        },
        {
          model: Service,
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

    return res.status(200).json(horaires);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};


exports.getRestaurantHoraireById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const horaire = await RestaurantHoraire.findByPk(id);

    if (!horaire) {
      return res.status(404).json({
        message: 'RestaurantHoraire non trouvé'
      });
    }

    return res.status(200).json(horaire);

  } catch (error) {
    next(error);
  }
};

exports.updateRestaurantHoraire = async (req, res, next) => {
  try {
    const id = req.params.id;
    const image = req.file ? req.file.filename : null;
    const { 
      jour,
      ferme,
      type,
      heure_debut,
      heure_fin,
      service_id,
      restaurant_id,
      societe_id,
      utilisateur_id
     } = req.body;

    const horaire = await RestaurantHoraire.findByPk(id);

    if (!horaire) {
      return res.status(404).json({
        message: 'RestaurantHoraire non trouvé'
      });
    }

    await horaire.update({
      jour,
      ferme,
      type,
      heure_debut,
      heure_fin,
      service_id,
      restaurant_id,
      societe_id,
      utilisateur_id
    });


    return res.status(200).json(horaire);

  } catch (error) {
    next(error);
  }
};



exports.deleteRestaurantHoraire = async (req, res, next) => {
  try {
    const id = req.params.id;

    const horaire = await RestaurantHoraire.findByPk(id);

    if (!horaire) {
      return res.status(404).json({
        message: 'RestaurantHoraire non trouvé'
      });
    }

    await horaire.destroy();

    return res.status(200).json({
      message: 'RestaurantHoraire supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};