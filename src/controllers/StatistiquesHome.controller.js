const db = require('../models');
const {  Commande,Reservation,Restaurant,Utilisateur,Avis,Societe,Panier,Role,Paiement,Livraison } = db;
const { Op } = require('sequelize');

exports.getStatsHome = async (req, res) => {
  try {

    const userID = req.user_id;
    const priorite =req.role_priorite
    const societe_id =req.societe_id

    console.log(userID,priorite,societe_id)

    let societe = null
    let societes = null
    if(req.role_priorite==1){
      societeFilter = {};
      societes = await Societe.findAll({});
      
    }else{
      societeFilter = {societe_id: req.societe_id};
       societe = await Societe.findByPk(req.societe_id);
    }


      const lastusers = await Utilisateur.findAll({
        where:{
          ...societeFilter,
          derniere_connexion: {
            [Op.ne]: null
          }
        },
        include: [
          {
            model: Role,
            required: false,
          },
          {
            model: Restaurant,
            attributes: ['id', 'nom',],
          },
          {
            model: Societe,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ],
        order: [['derniere_connexion', 'DESC']],
        limit:5
      });

      const clients = await Utilisateur.findAll({
        where:{role_id:19,...societeFilter}
      });

      
      const restaurants = await Restaurant.findAll({
        where:{...societeFilter}
      });

      const paniers_payes = await Panier.findAll({
        where:{...societeFilter,statut:'payé'}
      });

      const total_paniers = await Panier.findAll({
        where:{...societeFilter,}
      });

      const reservations_total = await Reservation.findAll({
        where:{...societeFilter}
      });

      const reservations_finies = await Reservation.findAll({
        where:{...societeFilter,statut:'Terminée'}
      });

      const commandes_total = await Commande.findAll({
        where:{...societeFilter}
      });

      const commandes_finies = await Commande.findAll({
        where:{...societeFilter,statut:'Retirée'}
      });

      const avis = await Avis.findAll({
        where:{...societeFilter}
      });

      const paiements = await Paiement.findAll({
        where:{...societeFilter},
          include: [
            {
                model: Societe,
                attributes: ['id', 'titre', ],
                required: false,
            },
            {
              model: Restaurant,
              attributes: ['id', 'nom', ],
              required: false,
            },
          ],
      });

      const ca_par_societes = paiements.reduce((acc, p) => {
        const societeId = p.societe_id;
        const societe = p.Societe; // include Sequelize

        if (!acc[societeId]) {
          acc[societeId] = {
            societe_id: societeId,
            titre: societe?.titre || null,
            total: 0,
            paiements: []
          };
        }

        acc[societeId].total += Number(p.montant || 0);
        acc[societeId].paiements.push(p);

        return acc;
      }, {});


      const ca_par_restaurants = paiements.reduce((acc, p) => {
        const restautrantId = p.restaurant_id;
        const restautrant = p.Restaurant; // include Sequelize

        if (!acc[restautrantId]) {
          acc[restautrantId] = {
            restaurant_id: restautrantId,
            nom: restautrant?.nom || null,
            total: 0,
            paiements: []
          };
        }

        acc[restautrantId].total += Number(p.montant || 0);
        acc[restautrantId].paiements.push(p);

        return acc;
      }, {});

       const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      
      if(priorite<8 && priorite>2){// 3 a 7
        userFilter = {societe_id: societe_id}
      }else if(priorite==9){
        userFilter = {societe_id: societe_id,livreur_id:userID}
      }

      const daily_shippings = await Livraison.findAll({
        where:{
        ...userFilter,
        date_livraison: {
            [Op.between]: [todayStart, todayEnd]
        }},//today
        include: [
          {
              model: Restaurant,
              attributes: ['id', 'nom',],
              required: false,
          },
          {
            model: Utilisateur,
            as: 'client',
            required: false
          },
          {
            model: Utilisateur,
            as: 'livreur',
            required: false
          },
          {
            model: Commande,
            as: 'commande',
            required: false
          },
        ],
        order: [['date_livraison', 'DESC']]
      });

      const livraisons_total = await Livraison.findAll({
        where:{...societeFilter}
      });

      const livraisons_finies = await Livraison.findAll({
        where:{...societeFilter,statut:'Terminée'}
      });

      

    //je veux un objet societe total (champ montant groupes par societes )
      

    res.json({
      totalClients: clients.length,
      totalLivraisons: livraisons_total.length,
      totalLivraisonsFinies: livraisons_finies.length,
      totalCommandes: commandes_total.length,
      totalCommandesFinies: commandes_finies.length,
      totalRestaurants: restaurants.length,
      totalReservations: reservations_total.length,
      totalReservationsFinies: reservations_finies.length,
      totalpaniers: total_paniers.length,
      totalpaniersPayes: paniers_payes.length,
      totalAvis: avis.length,
      societe:societe?societe:null,
      totalSocietes:societes?societes.length:null,
      lastusers:lastusers?lastusers:null,
      ca_par_societes:ca_par_societes,
      ca_par_restaurants:ca_par_restaurants,
      daily_shippings:daily_shippings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
