const db = require('../models');
const {  Commande,Reservation,Restaurant,Utilisateur,Avis,Societe,Panier } = db;
const { Op } = require('sequelize');

exports.getStatsHome = async (req, res) => {
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
    
    const societe = await Societe.findByPk(req.societe_id);

    const clients = await Utilisateur.findAll({
      where:{role_id:19,societe_id: req.societe_id}
    });


    const restaurants = await Restaurant.findAll({
      where:{societe_id: req.societe_id}
    });

    const paniers_payes = await Panier.findAll({
      where:{societe_id: req.societe_id,statut:'payé'}
    });

    const total_paniers = await Panier.findAll({
      where:{societe_id: req.societe_id,}
    });

    const reservations_total = await Reservation.findAll({
      where:{societe_id: req.societe_id}
    });

    const reservations_finies = await Reservation.findAll({
      where:{societe_id: req.societe_id,statut:'Terminée'}
    });

     const commandes_total = await Commande.findAll({
      where:{societe_id: req.societe_id}
    });

    const commandes_finies = await Commande.findAll({
      where:{societe_id: req.societe_id,statut:'Retirée'}
    });

    const avis = await Avis.findAll({
      where:{societe_id: req.societe_id}
    });

    res.json({
      totalClients: clients.length,
      totalCommandes: commandes_total.length,
      totalCommandesFinies: commandes_finies.length,
      totalRestaurants: restaurants.length,
      totalReservations: reservations_total.length,
      totalReservationsFinies: reservations_finies.length,
      totalpaniers: total_paniers.length,
      totalpaniersPayes: paniers_payes.length,
      totalAvis: avis.length,
      societe:societe
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
