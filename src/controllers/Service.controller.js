const db = require('../models');
const {  Service,Societe,Restaurant } = db;

exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.json(service);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getServices = async (req, res) => {
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
    

    const services = await Service.findAll({
         where:restaurantFilter,
          include: [
            {
                model: Restaurant,
                attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'telephone'],
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

    res.json(services);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    await service.update(req.body);

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    await service.destroy();

    res.json({ message: 'Service supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};