const db = require('../models');
const {  Mail,Societe,Restaurant } = db;
const { Op } = require('sequelize');


exports.createMail = async (req, res) => {
  try {
    const mail = await Mail.create(req.body);
    res.json(mail);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getMails = async (req, res) => {
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
    

    const mails = await Mail.findAll({
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

    res.json(mails);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};


exports.getMailsByRestoId = async (req, res) => {
  try {
    
    const mails = await Mail.findAll({
         where:{
          restaurant_id:req.params.resto_id
         },
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

    res.json(mails);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getMailById = async (req, res) => {
  try {
    const mail = await Mail.findByPk(req.params.id);

    if (!mail) {
      return res.status(404).json({ message: 'Mail non trouvé' });
    }

    res.json(mail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMailByRestoSectionAndType = async (req, res) => {
  try {

    const restaurant_id = req.params.restaurant_id;
    const type = req.params.type;
    const section = req.params.section;

    const mail = await Mail.findOne({
      where: {
        restaurant_id: restaurant_id,
        type: type,
        section:section
      }
    });

    if (!mail) {
      return res.status(404).json({ message: 'Mail non trouvé' });
    }

    res.json(mail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMail = async (req, res) => {
  try {
    const mail = await Mail.findByPk(req.params.id);

    if (!mail) {
      return res.status(404).json({ message: 'Mail non trouvé' });
    }

    await mail.update(req.body);

    res.json(mail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMail = async (req, res) => {
  try {
    const mail = await Mail.findByPk(req.params.id);

    if (!mail) {
      return res.status(404).json({ message: 'Mail non trouvé' });
    }

    await mail.destroy();

    res.json({ message: 'Mail supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};