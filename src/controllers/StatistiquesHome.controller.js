const db = require('../models');
const {  Commande,Reservation,Restaurant,Utilisateur,Avis,Societe,Panier,Role,Paiement } = db;
const { Op } = require('sequelize');

exports.getStatsHome = async (req, res) => {
  try {
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
            titre: restautrant?.titre || null,
            total: 0,
            paiements: []
          };
        }

        acc[restautrantId].total += Number(p.montant || 0);
        acc[restautrantId].paiements.push(p);

        return acc;
      }, {});

      

      //je veux un objet societe total (champ montant groupes par societes )
      


    

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
      societe:societe?societe:null,
      totalSocietes:societes?societes.length:null,
      lastusers:lastusers?lastusers:null,
      ca_par_societes:ca_par_societes,
      ca_par_restaurants:ca_par_restaurants
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
