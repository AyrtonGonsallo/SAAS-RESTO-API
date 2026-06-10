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
      adresse_email,
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
      adresse_email,
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
      'max_commandes_par_minute',
      'stock_min_avant_alerte',
      'max_couverts_par_jour',
      'delai_rappel_reservation',
      'delai_invitation_avis',
      'cle_publique_stripe',
      'cle_privee_stripe',
      'etat_des_reservations',
      'etat_du_click_and_collect',
      'etat_paiement_acompte_reservation',
      'montant_paiement_acompte_reservation',
      'etat_paiement_acompte_click_and_collect',
      'montant_paiement_acompte_click_and_collect',
      'montant_livraison_click_and_collect',
      'envoi_de_mail_recap_reservation',
      'envoi_de_mail_recap_click_and_collect',
      'livraison_click_and_collect',
      'ecart_entre_heure_actuelle_et_heure_reservation',
      'commande_a_l_avance',
      'delai_avant_fermetture_commandes',
      'delai_avant_fermetture_reservations',
      'delai_de_preparation',
      'moyen_notification',
      'max_commandes_par_jour',
      'delai_annulation_automatique_de_reservation',
      'delai_annulation_gratuite_de_reservation',
      'delai_annulation_automatique_de_commande',
      'delai_annulation_gratuite_de_commande',
      'duree_blocage_table'
    ];

    // valeurs par défaut (important)
    const defaultValues = {
      tva: { description: 'la tva globale du restaurant', unite_de_temps: '', type_de_valeur: 'pourcentage', valeur: 20, est_actif: true, est_important: false },
      coefficient: { description: 'la marge gagnée sur les produits du click and collect', unite_de_temps: '', type_de_valeur: 'coefficient', valeur: 1, est_actif: true, est_important: false },
      max_commandes_par_minute: { description: 'si dépasseé plus de commandes pendant cette minute', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 10, est_actif: true, est_important: false },
      stock_min_avant_alerte: { description: 'si des produits on leur stock inférieur a cette valeur ils apparaissent sur la home avec acces rapide pour modifier le stock', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 5, est_actif: true, est_important: true },
      max_couverts_par_jour: { description: 'si depasse ce jour ne prend plus de reservations', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 100, est_actif: true, est_important: false },
      delai_rappel_reservation: { description: 'le nombre de temps avant la date de la reservation du client ou en lui envoi un message de rappel', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 30, est_actif: true, est_important: false },
      delai_invitation_avis: { description: 'le nombre de temps apres la date de la reservation/commande du client ou en lui envoi un message de rappel', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 30, est_actif: true, est_important: false },
      cle_publique_stripe: { description: 'pour chaque resto permet de faire le paiement sur stripe', unite_de_temps: '', type_de_valeur: 'jeton', valeur: '', est_actif: true, est_important: false },
      cle_privee_stripe: { description: 'pour chaque resto permet de faire le paiement sur stripe', unite_de_temps: '', type_de_valeur: 'jeton', valeur: '', est_actif: true, est_important: false },

      etat_des_reservations: { description: 'si non actif les reservations sont bloquées', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      etat_du_click_and_collect: { description: 'si non actif les commandes sont bloquées', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      etat_paiement_acompte_reservation: { description: 'si actif il faut payer un acompte pour reserver', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      montant_paiement_acompte_reservation: { description: 'pour faire payer tout mettez 100% sinon moins', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 50, est_actif: true, est_important: false },
      etat_paiement_acompte_click_and_collect: { description: 'si actif il faut payer un acompte pour commander', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      montant_paiement_acompte_click_and_collect: { description: 'pour faire payer tout mettez 100% sinon moins', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 50, est_actif: true, est_important: false },
      montant_livraison_click_and_collect: { description: 'le montant fixe de la livraison du restaurant', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 15, est_actif: true, est_important: true },
      envoi_de_mail_recap_reservation: { description: 'si actif le client a la fin du formulaire de reservation recoit un mail', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: false, est_important: true },
      envoi_de_mail_recap_click_and_collect: { description: 'si actif le client a la fin du formulaire de commande recoit un mail', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: false, est_important: true },
      livraison_click_and_collect: { description: 'si actif la livraison sera faite et a la fin du formulaire on demande l\'adresse du client', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: false, est_important: true },


      ecart_entre_heure_actuelle_et_heure_reservation: { description: 'si la reservation est pour aujourd\'hui et cette valeur est de 2h, s\'il est 15h au moment ou le client reserve il devra choisir au moins 17h', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      commande_a_l_avance: { description: 'si cette valeur est de 2j le 15 mai le client peux commander jusqu\'au 17 mai', unite_de_temps: 'jours', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      delai_avant_fermetture_commandes: { description: 'si les horaires de commande pour le service du soir le lundi sont de 15h a 19h et cette valeur est de 40min le client ne peux plus commander a partir de 18h20 ', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      delai_avant_fermetture_reservations: { description: 'si les horaires de reservation pour le service du soir le lundi sont de 15h a 19h et cette valeur est de 40min le client ne peux plus reserver a partir de 18h20 ', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      delai_de_preparation: { description: 'si la commande est pour aujourd\'hui et cette valeur est de 30min, s\'il est 15h au moment ou le client commande il devra choisir au moins 15h30', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      moyen_notification: { description: '3 choix possibles email, sms, email + sms', unite_de_temps: '', type_de_valeur: 'choix_d_options', valeur: 'email', est_actif: true, est_important: true },
      max_commandes_par_jour: { description: 'si dépasseé plus de commandes pendant ce jour', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 30, est_actif: true, est_important: true },
      delai_annulation_automatique_de_reservation: { description: 'si cette valeur est de 2h, 2h apres la date de creation de la reservation si le paiement est requis et elle est pas payée on l\'annule et libere les tables, services, couverts avec un cron', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      delai_annulation_gratuite_de_reservation: { description: 'si cette valeur est de 1h, le client peux annuler la reservation 1h apres la date de creation de la reservation si il a pas payé', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      delai_annulation_automatique_de_commande: { description: 'si cette valeur est de 1h, 1h apres la date de creation de la commande si le paiement est requis et elle est pas payée on l\'annule et libere les stocks avec un cron', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      delai_annulation_gratuite_de_commande: { description: 'si cette valeur est de 2h, le client peux annuler la commande 2h apres la date de creation de la commande si il a pas payé', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      duree_blocage_table: { description: 'si cette valeur est de 90 minutes on libere la table avec un cron 1h30 apres le debut de la reservation', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
    };

    const parametres = types.map(type => {
      const config = defaultValues[type] || {
        valeur: null,
        est_actif: true,
        est_important: false,
        description: '',
        unite_de_temps: 'secondes',
        type_de_valeur: 'montant',
      };

      return {
        titre: type,
        type: type,
        unite_de_temps: config.unite_de_temps,
        type_de_valeur: config.type_de_valeur,
        valeur: config.valeur,
        valeurs_options: (type=='moyen_notification')?config.valeur:'',
        description: config.description,
        est_actif: config.est_actif,
        est_important: config.est_important,
        societe_id,
        restaurant_id: resto.id,
        utilisateur_id
      };
    });

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
      total:parametres.length,
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
      'max_commandes_par_minute',
      'stock_min_avant_alerte',
      'max_couverts_par_jour',
      'delai_rappel_reservation',
      'delai_invitation_avis',
      'cle_publique_stripe',
      'cle_privee_stripe',
      'etat_des_reservations',
      'etat_du_click_and_collect',
      'etat_paiement_acompte_reservation',
      'montant_paiement_acompte_reservation',
      'etat_paiement_acompte_click_and_collect',
      'montant_paiement_acompte_click_and_collect',
      'montant_livraison_click_and_collect',
      'envoi_de_mail_recap_reservation',
      'envoi_de_mail_recap_click_and_collect',
      'livraison_click_and_collect',
      'ecart_entre_heure_actuelle_et_heure_reservation',
      'commande_a_l_avance',
      'delai_avant_fermetture_commandes',
      'delai_avant_fermetture_reservations',
      'delai_de_preparation',
      'moyen_notification',
      'max_commandes_par_jour',
      'delai_annulation_automatique_de_reservation',
      'delai_annulation_gratuite_de_reservation',
      'delai_annulation_automatique_de_commande',
      'delai_annulation_gratuite_de_commande',
      'duree_blocage_table'
    ];

    // valeurs par défaut (important)
    const defaultValues = {
      tva: { description: 'la tva globale du restaurant', unite_de_temps: '', type_de_valeur: 'pourcentage', valeur: 20, est_actif: true, est_important: false },
      coefficient: { description: 'la marge gagnée sur les produits du click and collect', unite_de_temps: '', type_de_valeur: 'coefficient', valeur: 1, est_actif: true, est_important: false },
      max_commandes_par_minute: { description: 'si dépasseé plus de commandes pendant cette minute', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 10, est_actif: true, est_important: false },
      stock_min_avant_alerte: { description: 'si des produits on leur stock inférieur a cette valeur ils apparaissent sur la home avec acces rapide pour modifier le stock', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 5, est_actif: true, est_important: true },
      max_couverts_par_jour: { description: 'si depasse ce jour ne prend plus de reservations', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 100, est_actif: true, est_important: false },
      delai_rappel_reservation: { description: 'le nombre de temps avant la date de la reservation du client ou en lui envoi un message de rappel', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 30, est_actif: true, est_important: false },
      delai_invitation_avis: { description: 'le nombre de temps apres la date de la reservation/commande du client ou en lui envoi un message de rappel', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 30, est_actif: true, est_important: false },
      cle_publique_stripe: { description: 'pour chaque resto permet de faire le paiement sur stripe', unite_de_temps: '', type_de_valeur: 'jeton', valeur: '', est_actif: true, est_important: false },
      cle_privee_stripe: { description: 'pour chaque resto permet de faire le paiement sur stripe', unite_de_temps: '', type_de_valeur: 'jeton', valeur: '', est_actif: true, est_important: false },

      etat_des_reservations: { description: 'si non actif les reservations sont bloquées', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      etat_du_click_and_collect: { description: 'si non actif les commandes sont bloquées', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      etat_paiement_acompte_reservation: { description: 'si actif il faut payer un acompte pour reserver', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      montant_paiement_acompte_reservation: { description: 'pour faire payer tout mettez 100% sinon moins', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 50, est_actif: true, est_important: false },
      etat_paiement_acompte_click_and_collect: { description: 'si actif il faut payer un acompte pour commander', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: true, est_important: true },
      montant_paiement_acompte_click_and_collect: { description: 'pour faire payer tout mettez 100% sinon moins', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 50, est_actif: true, est_important: false },
      montant_livraison_click_and_collect: { description: 'le montant fixe de la livraison du restaurant', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 15, est_actif: true, est_important: true },
      envoi_de_mail_recap_reservation: { description: 'si actif le client a la fin du formulaire de reservation recoit un mail', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: false, est_important: true },
      envoi_de_mail_recap_click_and_collect: { description: 'si actif le client a la fin du formulaire de commande recoit un mail', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: false, est_important: true },
      livraison_click_and_collect: { description: 'si actif la livraison sera faite et a la fin du formulaire on demande l\'adresse du client', unite_de_temps: '', type_de_valeur: 'statut', valeur: '', est_actif: false, est_important: true },


      ecart_entre_heure_actuelle_et_heure_reservation: { description: 'si la reservation est pour aujourd\'hui et cette valeur est de 2h, s\'il est 15h au moment ou le client reserve il devra choisir au moins 17h', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      commande_a_l_avance: { description: 'si cette valeur est de 2j le 15 mai le client peux commander jusqu\'au 17 mai', unite_de_temps: 'jours', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      delai_avant_fermetture_commandes: { description: 'si les horaires de commande pour le service du soir le lundi sont de 15h a 19h et cette valeur est de 40min le client ne peux plus commander a partir de 18h20 ', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      delai_avant_fermetture_reservations: { description: 'si les horaires de reservation pour le service du soir le lundi sont de 15h a 19h et cette valeur est de 40min le client ne peux plus reserver a partir de 18h20 ', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      delai_de_preparation: { description: 'si la commande est pour aujourd\'hui et cette valeur est de 30min, s\'il est 15h au moment ou le client commande il devra choisir au moins 15h30', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
      moyen_notification: { description: '3 choix possibles email, sms, email + sms', unite_de_temps: '', type_de_valeur: 'choix_d_options', valeur: 'email', est_actif: true, est_important: true },
      max_commandes_par_jour: { description: 'si dépasseé plus de commandes pendant ce jour', unite_de_temps: '', type_de_valeur: 'numerique', valeur: 30, est_actif: true, est_important: true },
      delai_annulation_automatique_de_reservation: { description: 'si cette valeur est de 2h, 2h apres la date de creation de la reservation si le paiement est requis et elle est pas payée on l\'annule et libere les tables, services, couverts avec un cron', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      delai_annulation_gratuite_de_reservation: { description: 'si cette valeur est de 1h, le client peux annuler la reservation 1h apres la date de creation de la reservation si il a pas payé', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      delai_annulation_automatique_de_commande: { description: 'si cette valeur est de 1h, 1h apres la date de creation de la commande si le paiement est requis et elle est pas payée on l\'annule et libere les stocks avec un cron', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      delai_annulation_gratuite_de_commande: { description: 'si cette valeur est de 2h, le client peux annuler la commande 2h apres la date de creation de la commande si il a pas payé', unite_de_temps: 'heures', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: false, est_important: true },
      duree_blocage_table: { description: 'si cette valeur est de 90 minutes on libere la table avec un cron 1h30 apres le debut de la reservation', unite_de_temps: 'minutes', type_de_valeur: 'unite_temporelle', valeur: 2, est_actif: true, est_important: true },
    };

    const parametres = types.map(type => {
      const config = defaultValues[type] || {
        valeur: null,
        est_actif: true,
        est_important: false,
        description: '',
        unite_de_temps: 'secondes',
        type_de_valeur: 'montant',
      };

      return {
        titre: type,
        type: type,
        unite_de_temps: config.unite_de_temps,
        type_de_valeur: config.type_de_valeur,
        valeur: config.valeur,
        valeurs_options: (type=='moyen_notification')?config.valeur:'',
        description: config.description,
        est_actif: config.est_actif,
        est_important: config.est_important,
        societe_id:restaurant.societe_id,
        restaurant_id: restaurant.id,
        utilisateur_id:restaurant.utilisateur_id
      };
    });

  

    await Parametre.bulkCreate(parametres, {
      updateOnDuplicate: [ 'description', 'est_important']
    });

     

    return res.status(201).json({
      success: true,
      total:parametres.length,
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
    const image = req.file ? req.file.filename : null;
    const { 
      nom,
      coordonnees_google_maps,
      ville,
      adresse,
      adresse_email,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      jours_de_fermeture,
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

    let jours_de_fermeture_splited = jours_de_fermeture.split(',');
    console.log('jours_de_fermeture',jours_de_fermeture_splited)
    console.log('jours_de_fermeture string',JSON.stringify(jours_de_fermeture_splited))

    await restaurant.update({
      nom,
      coordonnees_google_maps,
      ville,
      adresse,
      adresse_email,
      heure_debut,
      heure_fin,
      heure_cc_debut,
      heure_cc_fin,
      jours_de_fermeture:JSON.stringify(jours_de_fermeture_splited),
      telephone,
      societe_id,
      utilisateur_id
    });

    if(image){
      await restaurant.update({
        image,
      });
    }

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