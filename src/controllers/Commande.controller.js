const db = require('../models');
const bcrypt = require('bcryptjs');
const {  Commande,Utilisateur,Restaurant,Role,Societe,Menu } = db;
const DEFAULT_PASS = process.env.DEFAULT_PASS;
const notificationService = require('../services/notifications.service');
const { Op } = require('sequelize');

exports.createCommande = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      date_retrait,
      heure_retrait,
      societe_id,
      restaurant_id,
      
      ...rest
    } = req.body;

     //  2. DATE
    const dateObj = new Date(
      date_retrait.year,
      date_retrait.month - 1,
      date_retrait.day,
      heure_retrait.hour,
      heure_retrait.minute,
      heure_retrait.second || 0
    );

    
    const dateOnly = `${date_retrait.year}-${String(date_retrait.month).padStart(2,'0')}-${String(date_retrait.day).padStart(2,'0')}`;

   
 

    //  1. CLIENT chercher ou creer
    let client = await Utilisateur.findOne({ where: { email }, transaction: t });

    if (!client) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASS, 10);

      const role = await Role.findOne({
        where: { type: 'client' },
        transaction: t
      });

      if (!role) {
        throw new Error('Rôle non trouvé');
      }

      client = await Utilisateur.create({
        nom,
        prenom,
        email,
        telephone,
        mot_de_passe: hashedPassword,
        role_id: role.id,
        societe_id,
      }, { transaction: t });

      await client.setRestaurants([restaurant_id], { transaction: t });
    }else{
      await client.addRestaurant(restaurant_id, { transaction: t });
    }

    


    //  7. CRÉATION RÉSERVATION
    const commande = await Commande.create({
      ...rest,
      societe_id,
      restaurant_id,
      date_retrait: dateObj,
      client_id: client.id
    }, { transaction: t });


    
    const dateRetrait = new Date(commande.date_retrait).toLocaleString('fr-FR');

    await notificationService.createNotification({
        commande,
        titre: `Nouvelle commande`,
        type:'info',
        texte: `Vous avez une nouvelle commande ${commande.id} : Client "${prenom} ${nom}" pour le "${dateRetrait}" dans le restaurant ${restaurant_id}`,
    });

    await notificationService.createNotification({
        commande,
        titre: `Nouvelle commande`,
        type:'rappel',
        texte: `N'oubliez pas votre commande ${commande.id} pour ${dateRetrait}`,
        utilisateur_id: commande.client_id
    });

    
    await t.commit();


    //  9. RELOAD (hors transaction → plus rapide)
    const commandeObjet = await Commande.findByPk(commande.id, {
      include: [
        { association: 'client' },
        { association: 'societe' },
      ]
    });

    res.json(commandeObjet);

  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCommandesDatasBySocieteID = async (req, res) => {
  try {

    const societeID = req.params.societeID;

    const societe = await Societe.findByPk(societeID);

    if (!societe) {
      return res.status(404).json({
        message: 'Societe non trouvée'
      });
    }
    restaurantFilter = {societe_id: societeID};


  
    const menus = await Menu.findAll({
      where: {
      ...restaurantFilter,
        actif: true
      },
      include: [
        {
          association: 'produits',
          through: { attributes: [] },
          include: [
            {
              association: 'categorie' // correspond à ton alias
            },
            {
              association: 'variations',
              include: [
                {
                  association: 'categorie' // ← ICI tu ajoutes la catégorie de variation
                }
              ]
            }
          ]
        }
        
      ],
      order: [['type', 'ASC'],['titre', 'ASC']]
    },
  );
    const restaurants = await Restaurant.findAll({
      where: restaurantFilter,
      include: [
        {
          association: 'parametres',
          where: { est_important: true },
          required: false
        },
        {
          association: 'types_de_cuisine',
          through: { attributes: [] }
        }

      ],
      order: [['created_at', 'DESC']]
    });
    

    res.json({
      societe:societe,
      menus:menus,
      restaurants:restaurants,

    });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};