const db = require('../models');
const {  Panier,Societe,Restaurant,Paiement,Utilisateur } = db;
const { Op } = require('sequelize');
exports.createPanier = async (req, res) => {
  try {
    const panier = await Panier.create(req.body);
    res.json(panier);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getPaniers = async (req, res) => {
  try {
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
      if(req.role_priorite==8){//si client
        restaurantFilter = {client_id: req.user_id}
        console.log('eeee')
      }else{
        if (selectedRestaurantId) {
          //  filtre sur UN restaurant
          restaurantFilter = {
              restaurant_id: selectedRestaurantId,
              societe_id: req.societe_id
          };
        } else {
          //  filtre sur plusieurs restaurants autorisés
          restaurantFilter = {
              restaurant_id: {
              [Op.in]: req.restos
              },
              societe_id: req.societe_id
          };
        }
      }
    }else{
      if (req.isSuperAdmin) {
      restaurantFilter = {}
      }
      else{
      restaurantFilter = {societe_id: req.societe_id}
      }
    }
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const paniers = await Panier.findAll({
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
        {
          model: Paiement,
          as:'paiement'
        },
        {
            model: Utilisateur,
            as:'client'
        },
      ],
    });

    res.json(paniers);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getPanierById = async (req, res) => {
  try {
    const panier = await Panier.findByPk(req.params.id);

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    res.json(panier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePanier = async (req, res) => {
  try {
    const panier = await Panier.findByPk(req.params.id);

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    await panier.update(req.body);

    res.json(panier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePanier = async (req, res) => {
  try {
    const panier = await Panier.findByPk(req.params.id);

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    await panier.destroy();

    res.json({ message: 'Panier supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};