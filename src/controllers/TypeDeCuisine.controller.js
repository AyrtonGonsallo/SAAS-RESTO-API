const db = require('../models');
const {  TypeDeCuisine,Societe,Restaurant } = db;
const { Op } = require('sequelize');
exports.createTypeDeCuisine = async (req, res) => {
  try {
    const { restaurant_id, ...data } = req.body;

    const type_de_cuisine = await TypeDeCuisine.create(req.body);

    //ajouter ou mettre a jour la relation
    await type_de_cuisine.setRestaurants([restaurant_id]);

    res.json(type_de_cuisine);

    
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getTypeDeCuisines = async (req, res) => {
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
    

    const type_de_cuisines = await TypeDeCuisine.findAll({
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

    res.json(type_de_cuisines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTypeDeCuisineById = async (req, res) => {
  try {
    const type_de_cuisine = await TypeDeCuisine.findByPk(req.params.id);

    if (!type_de_cuisine) {
      return res.status(404).json({ message: 'TypeDeCuisine non trouvé' });
    }

    res.json(type_de_cuisine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTypeDeCuisine = async (req, res) => {
  try {
    const type_de_cuisine = await TypeDeCuisine.findByPk(req.params.id);

    if (!type_de_cuisine) {
      return res.status(404).json({ message: 'TypeDeCuisine non trouvé' });
    }

    const { restaurant_id, ...data } = req.body;
    await type_de_cuisine.update(req.body);
    if (restaurant_id) {
      await type_de_cuisine.setRestaurants([restaurant_id]);
    }

    res.json(type_de_cuisine);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTypeDeCuisine = async (req, res) => {
  try {
    const type_de_cuisine = await TypeDeCuisine.findByPk(req.params.id);

    if (!type_de_cuisine) {
      return res.status(404).json({ message: 'TypeDeCuisine non trouvé' });
    }

    await type_de_cuisine.destroy();

    res.json({ message: 'TypeDeCuisine supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};