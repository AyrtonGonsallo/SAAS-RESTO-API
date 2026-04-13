const db = require('../models');
const {  ZoneTable,Societe,Restaurant } = db;

exports.createZoneTable = async (req, res) => {
  try {
    const zone = await ZoneTable.create(req.body);
    res.json(zone);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getZoneTables = async (req, res) => {
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
    

    const zones = await ZoneTable.findAll({
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

    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getZoneTableById = async (req, res) => {
  try {
    const zone = await ZoneTable.findByPk(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: 'ZoneTable non trouvé' });
    }

    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateZoneTable = async (req, res) => {
  try {
    const zone = await ZoneTable.findByPk(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: 'ZoneTable non trouvé' });
    }

    await zone.update(req.body);

    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteZoneTable = async (req, res) => {
  try {
    const zone = await ZoneTable.findByPk(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: 'ZoneTable non trouvé' });
    }

    await zone.destroy();

    res.json({ message: 'ZoneTable supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};