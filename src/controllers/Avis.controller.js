const db = require('../models');
const {  Avis,Societe,Restaurant,Reservation,Commande } = db;
const { Op } = require('sequelize');
exports.createAvis = async (req, res) => {
  try {
    const avis = await Avis.create(req.body);
    if(avis.objet=="Réservation"){
      const reservation = await Reservation.findByPk(avis.reservation_id);
      await reservation.update({
        avis_envoye: true
      });
    }else{
      const commande = await Commande.findByPk(avis.commande_id);
      await commande.update({
        avis_envoye: true
      });
    }
    res.json(avis);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getAvis = async (req, res) => {
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
    

    const avis = await Avis.findAll({
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
    });

    res.json(avis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvisById = async (req, res) => {
  try {
    const avis = await Avis.findByPk(req.params.id);

    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    res.json(avis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvisCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        },
        { association: 'client' },
        { association: 'societe' },
      ],
    });

    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvé' });
    }

    if (typeof commande.items === 'string') {
        commande.items = JSON.parse(commande.items);
      }


    res.json(commande);
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};

exports.getAvisReservationById  = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'table' },
      { association: 'service' },
      { association: 'creneau' },
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
});

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation non trouvé' });
    }

    res.json(reservation);
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};

exports.updateAvis = async (req, res) => {
  try {
    const avis = await Avis.findByPk(req.params.id);

    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    await avis.update(req.body);

    res.json(avis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAvis = async (req, res) => {
  try {
    const avis = await Avis.findByPk(req.params.id);

    if (!avis) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    await avis.destroy();

    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};