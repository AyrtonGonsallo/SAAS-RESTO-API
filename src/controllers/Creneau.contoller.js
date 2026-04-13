const db = require('../models');
const {  Creneau,Societe,Restaurant } = db;

exports.createCreneau = async (req, res) => {
  try {
    const creneau = await Creneau.create(req.body);
    res.json(creneau);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getCreneaux = async (req, res) => {
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
    

    const creneaux = await Creneau.findAll({
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

    res.json(creneaux);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCreneauById = async (req, res) => {
  try {
    const creneau = await Creneau.findByPk(req.params.id);

    if (!creneau) {
      return res.status(404).json({ message: 'Creneau non trouvé' });
    }

    res.json(creneau);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCreneau = async (req, res) => {
  try {
    const creneau = await Creneau.findByPk(req.params.id);

    if (!creneau) {
      return res.status(404).json({ message: 'Creneau non trouvé' });
    }

    await creneau.update(req.body);

    res.json(creneau);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCreneau = async (req, res) => {
  try {
    const creneau = await Creneau.findByPk(req.params.id);

    if (!creneau) {
      return res.status(404).json({ message: 'Creneau non trouvé' });
    }

    await creneau.destroy();

    res.json({ message: 'Creneau supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};