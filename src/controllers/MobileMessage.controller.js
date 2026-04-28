const db = require('../models');
const {  Message,Societe,Restaurant,Utilisateur } = db;

exports.createMessage = async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.json(message);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
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
    

    const messages = await Message.findAll({
         where:restaurantFilter,
          include: [
            {
                model: Restaurant,
                attributes: ['id', 'nom', ],
                required: false,
            },
            {
                model: Societe,
                attributes: ['id', 'titre', ],
                required: false,
            },
            {
              model: Utilisateur,
              as: 'employe',
              required: false
            },
            {
              model: Utilisateur,
              as: 'client',
              required: false
            },
        ],

    }
);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserMessages = async (req, res) => {
  try {
  

    console.log("recherche messages de ",req.user_id)
    
    const messages = await Message.findAll({
         where:{employe_id:req.user_id},
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
            {
              model: Utilisateur,
              as: 'employe',
              required: false
            },
            {
              model: Utilisateur,
              as: 'client',
              required: false
            },
        ],

    }
);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    await message.update(req.body);

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    await message.destroy();

    res.json({ message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};