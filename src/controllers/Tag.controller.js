const db = require('../models');
const {  Tag,Societe,Restaurant } = db;

exports.createTag = async (req, res) => {
  try {
    const tag = await Tag.create(req.body);
    res.json(tag);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getTags = async (req, res) => {
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
    

    const tags = await Tag.findAll({
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

    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag non trouvé' });
    }

    res.json(tag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag non trouvé' });
    }

    await tag.update(req.body);

    res.json(tag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag non trouvé' });
    }

    await tag.destroy();

    res.json({ message: 'Tag supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};