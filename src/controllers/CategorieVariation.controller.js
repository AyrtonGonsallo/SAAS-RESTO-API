const db = require('../models');
const {  CategorieVariation,Societe,Restaurant } = db;
const { Op } = require('sequelize');
exports.createCategorieVariation = async (req, res) => {
  try {
    const categorieVariation = await CategorieVariation.create(req.body);
    res.json(categorieVariation);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getCategorieVariations = async (req, res) => {
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
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const categorieVariations = await CategorieVariation.findAll({
         where:restaurantFilter,
          include: [
            {
                model: Restaurant,
                attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
                required: false,
            },
            {
                model: Societe,
                attributes: ['id', 'titre', ],
                required: false,
            },
        ],

    }
);

    res.json(categorieVariations);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getCategorieVariationById = async (req, res) => {
  try {
    const categorieVariation = await CategorieVariation.findByPk(req.params.id);

    if (!categorieVariation) {
      return res.status(404).json({ message: 'CategorieVariation non trouvé' });
    }

    res.json(categorieVariation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategorieVariation = async (req, res) => {
  try {
    const categorieVariation = await CategorieVariation.findByPk(req.params.id);

    if (!categorieVariation) {
      return res.status(404).json({ message: 'CategorieVariation non trouvé' });
    }

    await categorieVariation.update(req.body);

    res.json(categorieVariation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategorieVariation = async (req, res) => {
  try {
    const categorieVariation = await CategorieVariation.findByPk(req.params.id);

    if (!categorieVariation) {
      return res.status(404).json({ message: 'CategorieVariation non trouvé' });
    }

    await categorieVariation.destroy();

    res.json({ message: 'CategorieVariation supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};