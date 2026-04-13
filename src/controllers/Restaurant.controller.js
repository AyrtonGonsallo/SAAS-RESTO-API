const db = require('../models');
const {  Societe, Restaurant,Utilisateur,Parametre  } = db;
const { Op } = require('sequelize');
exports.ajouterRestaurant = async (req, res,next) => {
  try {
    const {
      nom,
      coordonnees_google_maps,
      ville,
      adresse,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      telephone,
      societe_id,
      utilisateur_id
    } = req.body;



    const resto = await Restaurant.create({
      nom,
      coordonnees_google_maps,
      ville,
      adresse,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      telephone,
      societe_id,
      utilisateur_id
    });

    const types = [
      'tva',
      'coefficient',
      'max_commandes_par_minutes',
      'alerte_stocke_min',
      'max_couverts_par_jour',
      'delai_rappel_reservation',
      'cle_publique_stripe',
      'cle_privee_stripe',
      'etat_des_reservations',
      'etat_paiement_acompte_reservation',
      'montant_paiement_acompte_reservation',
      'etat_paiement_acompte_click_and_collect',
      'montant_paiement_acompte_click_and_collect'
    ];

    // valeurs par défaut (important)
    const defaultValues = {
      tva: 20,
      coefficient: 1,
      max_commandes_par_minutes: 10,
      alerte_stocke_min: 5,
      max_couverts_par_jour: 100,
      delai_rappel_reservation: 30,
      cle_publique_stripe: '',
      cle_privee_stripe: '',
      etat_des_reservations: 1,
      etat_paiement_acompte_reservation: 1,
      montant_paiement_acompte_reservation: 50,
      etat_paiement_acompte_click_and_collect: 1,
      montant_paiement_acompte_click_and_collect: 50,
    };

    const parametres = types.map(type => ({
      titre: type,
      type: type,
      valeur: defaultValues[type],
      description: '',
      est_actif: true,
      societe_id,
      restaurant_id: resto.id,
      utilisateur_id
    }));

    await Parametre.bulkCreate(parametres);

     const user = await Utilisateur.findByPk(utilisateur_id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    await user.addRestaurant(resto.id, {
      ignoreDuplicates: true
    });

    return res.status(201).json({
      success: true,
      data: resto
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.recreerParametresRestaurant = async (req, res,next) => {
  try {
    const id = req.params.id;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    const types = [
      'tva',
      'coefficient',
      'max_commandes_par_minutes',
      'alerte_stocke_min',
      'max_couverts_par_jour',
      'delai_rappel_reservation',
      'delai_annulation_reservation',
      'delai_invitation_avis',
      'cle_publique_stripe',
      'cle_privee_stripe',
      'etat_des_reservations',
      'etat_paiement_acompte_reservation',
      'montant_paiement_acompte_reservation',
      'etat_paiement_acompte_click_and_collect',
      'montant_paiement_acompte_click_and_collect'
    ];

    // valeurs par défaut (important)
    const defaultValues = {
      tva: 20,
      coefficient: 1,
      max_commandes_par_minutes: 10,
      alerte_stocke_min: 5,
      max_couverts_par_jour: 100,
      delai_rappel_reservation: 30,
      delai_annulation_reservation: 30,
      delai_invitation_avis: 30,
      cle_publique_stripe: '',
      cle_privee_stripe: '',
      etat_des_reservations: 1,
      etat_paiement_acompte_reservation: 1,
      montant_paiement_acompte_reservation: 50,
      etat_paiement_acompte_click_and_collect: 1,
      montant_paiement_acompte_click_and_collect: 50,
    };

    const parametres = types.map(type => ({
      titre: type,
      type: type,
      valeur: defaultValues[type],
      description: '',
      est_actif: true,
      est_important: false,
      societe_id:restaurant.societe_id,
      restaurant_id: restaurant.id,
      utilisateur_id:restaurant.utilisateur_id
    }));

    await Parametre.bulkCreate(parametres, {
      updateOnDuplicate: [ 'description', 'est_important']
    });

     

    return res.status(201).json({
      success: true,
      data: restaurant
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getRestaurants = async (req, res) => {
  try {

    let ishigh = req.role_priorite<4
    const selectedRestaurantId = req.query.restaurant_id;
    // construire le filtre restaurant
    let restaurantFilter = {};

    if (!ishigh) {
      if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
          id: selectedRestaurantId,
          societe_id: req.societe_id
        };
      } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
        restaurantFilter = {
          id: {
            [Op.in]: req.restos
          },
          societe_id: req.societe_id
        };
      }
    }else{
       if (req.isSuperAdmin) {
          restaurantFilter = {};
       }else{
          restaurantFilter = {societe_id: req.societe_id};
       }
      
    }
    const restaurants = await Restaurant.findAll({
      where: restaurantFilter,
      include: [
        {
          model: Utilisateur,
          as: 'gestionnaire',
          attributes: ['id', 'nom', 'prenom', 'email','telephone'],
          required: false
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status', ],
          required: false,
          
        },
        { association: 'types_de_cuisine' }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(restaurants);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};


exports.getRestaurantsWithParametres = async (req, res) => {
  try {

    let ishigh = req.role_priorite<4
    const selectedRestaurantId = req.query.restaurant_id;
    // construire le filtre restaurant
    let restaurantFilter = {};

    if (!ishigh) {
      if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
          id: selectedRestaurantId,
          societe_id: req.societe_id
        };
      } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
        restaurantFilter = {
          id: {
            [Op.in]: req.restos
          },
          societe_id: req.societe_id
        };
      }
    }else{
       if (req.isSuperAdmin) {
          restaurantFilter = {};
       }else{
          restaurantFilter = {societe_id: req.societe_id};
       }
      
    }
    const restaurants = await Restaurant.findAll({
      where: restaurantFilter,
      include: [
        {
          model: Utilisateur,
          as: 'gestionnaire',
          attributes: ['id', 'nom', 'prenom', 'email','telephone'],
          required: false
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status', ],
          required: false,
          
        },
        {
          association: 'parametres',
          where: { est_important: true },
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(restaurants);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};

exports.getRestaurantById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    return res.status(200).json(restaurant);

  } catch (error) {
    next(error);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { 
      nom,
      coordonnees_google_maps,
      ville,
      adresse,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      telephone,
      societe_id,
      utilisateur_id
     } = req.body;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    await restaurant.update({
      nom,
      coordonnees_google_maps,
      ville,
      adresse,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      telephone,
      societe_id,
      utilisateur_id
    });

    return res.status(200).json(restaurant);

  } catch (error) {
    next(error);
  }
};



exports.deleteRestaurant = async (req, res, next) => {
  try {
    const id = req.params.id;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    await Parametre.destroy({
      where: { restaurant_id: id }
    });
        
    await restaurant.destroy();

   

    return res.status(200).json({
      message: 'Restaurant supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};