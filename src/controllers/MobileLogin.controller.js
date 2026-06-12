const db = require('../models');
const {  Societe,Restaurant,Role,Utilisateur,Commande,Reservation,ZoneTable } = db;
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken,  } = require('../services/token.service');
const { Op } = require('sequelize');

exports.mobileLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await Utilisateur.findOne({ 
    where: { email },
    include: [
        {
          model: Role,
          required: false,
        },
        {
          model: Societe,
          attributes: ['id', 'titre', 'status'],
          required: false,
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: false,
        },
      ] 
  });
  if (!user) return res.status(401).json({ message: 'User not found' });


  const valid = await bcrypt.compare(password, user.mot_de_passe);
  if (!valid) return res.status(401).json({ message: 'Invalid password' });
const notallowed = [1, 2, 8, 10];
  if (notallowed.includes(user.Role.priorite) ) return res.status(404).json({ message: `L'utilisateur existe mais son rôle (${user.Role.type}) ne fait pas partie des rôles admis.` });


  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // stocker refresh token en DB
  user.refresh_token = refreshToken;
    user.derniere_connexion = new Date();
  await user.save();

  res.json({ accessToken, refreshToken,user });
};



exports.getMobileDatas = async (req, res) => {
  
  const userID = req.user_id;
  const priorite =req.role_priorite
  const societeID = req.societe_id;

  console.log(userID,priorite,societeID)


  const utilisateur = await Utilisateur.findByPk(userID,{
    include: [
        {
        model: Role,
        required: false,
        
      },
      {
        model: Restaurant,
        attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
        through: { attributes: [] }, // supprime les infos de la table pivot
        required: false,
      },
    ]
  } );

  //console.log(utilisateur)

  let restaurantID = utilisateur.Restaurants[0].id

console.log('priorite',priorite)
  if(priorite==9){//livreur
    res.json({
      societe:societeID,
      daily_bookings:[],
      all_bookings:[],
      daily_orders:[],
      all_orders:[],

    });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if(priorite==7){//employé
    restaurantFilter = {societe_id: societeID,restaurant_id: restaurantID};
  }else{
    restaurantFilter = {societe_id: societeID};
  }
  
  

  const daily_bookings = await Reservation.findAll({
    where:{
      ...restaurantFilter,
      date_reservation: {
          [Op.between]: [todayStart, todayEnd]
      }},//today
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'tables',
        include: [
          {
            model: ZoneTable,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ]
        },
      { association: 'service' },
      
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
    order: [['date_reservation', 'DESC']]
  });

  const daily_bookings_now = await Reservation.findAll({
    where:{
      ...restaurantFilter,
      statut: {
        [Op.in]: ['En cours']
      },
      date_reservation: {
          [Op.between]: [todayStart, todayEnd]
      }},//today
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'tables',
        include: [
          {
            model: ZoneTable,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ]
        },
      { association: 'service' },
      
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
    order: [['date_reservation', 'DESC']]
  });


  const daily_bookings_to_come = await Reservation.findAll({
    where:{
      ...restaurantFilter,
      statut: {
        [Op.in]: ['En attente', 'Confirmée']
      },
      date_reservation: {
          [Op.between]: [todayStart, todayEnd]
      }},//today
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'tables',
        include: [
          {
            model: ZoneTable,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ]
        },
      { association: 'service' },
      
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
    order: [['date_reservation', 'DESC']]
  });


  const daily_bookings_end = await Reservation.findAll({
    where:{
      ...restaurantFilter,
      statut: {
        [Op.in]: ['Annulée','Terminée']
      },
      date_reservation: {
          [Op.between]: [todayStart, todayEnd]
      }},//today
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'tables',
        include: [
          {
            model: ZoneTable,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ]
        },
      { association: 'service' },
      
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
    order: [['date_reservation', 'DESC']]
  });


  const daily_bookings_no_show = await Reservation.findAll({
    where:{
      ...restaurantFilter,
      statut: {
        [Op.in]: ['No-show']
      },
      date_reservation: {
          [Op.between]: [todayStart, todayEnd]
      }},//today
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'tables',
        include: [
          {
            model: ZoneTable,
            attributes: ['id', 'titre',  ],
            required: false,
          }
        ]
        },
      { association: 'service' },
      
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
    order: [['date_reservation', 'DESC']]
  });

  const all_bookings = await Reservation.findAll({
    where:restaurantFilter,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
      },
      { association: 'client' },
      { association: 'tables',
        include: [
        {
          model: ZoneTable,
          attributes: ['id', 'titre',  ],
          required: false,
        }
      ],
        },
      { association: 'service' },
      
      { association: 'societe' },
      { association: 'paiements' },
      { association: 'tags' },
    ],
    order: [['date_reservation', 'DESC']]
  });

  const daily_orders = await Commande.findAll({
    where:{
      ...restaurantFilter,
      date_retrait: {
          [Op.between]: [todayStart, todayEnd]
      }},//today,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
          required: false,
      },
      { association: 'client' },
      { association: 'societe' },
    ],
    order: [['date_retrait', 'DESC']]
  });

  daily_orders.forEach(cmd => {
    if (typeof cmd.items === 'string') {
      cmd.items = JSON.parse(cmd.items);
    }
  });

  const daily_orders_coming = await Commande.findAll({
    where:{
      ...restaurantFilter,
       statut: {
        [Op.in]: ['Nouvelle', 'En préparation']
      },
      date_retrait: {
          [Op.between]: [todayStart, todayEnd]
      }},//today,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
          required: false,
      },
      { association: 'client' },
      { association: 'societe' },
    ],
    order: [['date_retrait', 'DESC']]
  });

  daily_orders_coming.forEach(cmd => {
    if (typeof cmd.items === 'string') {
      cmd.items = JSON.parse(cmd.items);
    }
  });

  const daily_orders_ready = await Commande.findAll({
    where:{
      ...restaurantFilter,
       statut: {
        [Op.in]: ['Prête']
      },
      date_retrait: {
          [Op.between]: [todayStart, todayEnd]
      }},//today,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
          required: false,
      },
      { association: 'client' },
      { association: 'societe' },
    ],
    order: [['date_retrait', 'DESC']]
  });

  daily_orders_ready.forEach(cmd => {
    if (typeof cmd.items === 'string') {
      cmd.items = JSON.parse(cmd.items);
    }
  });

  const daily_orders_took = await Commande.findAll({
    where:{
      ...restaurantFilter,
       statut: {
        [Op.in]: ['Retirée']
      },
      date_retrait: {
          [Op.between]: [todayStart, todayEnd]
      }},//today,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
          required: false,
      },
      { association: 'client' },
      { association: 'societe' },
    ],
    order: [['date_retrait', 'DESC']]
  });

  daily_orders_took.forEach(cmd => {
    if (typeof cmd.items === 'string') {
      cmd.items = JSON.parse(cmd.items);
    }
  });

  const daily_orders_cancelled = await Commande.findAll({
    where:{
      ...restaurantFilter,
      statut: {
        [Op.in]: ['Annulée']
      },
      date_retrait: {
          [Op.between]: [todayStart, todayEnd]
      }},//today,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
          required: false,
      },
      { association: 'client' },
      { association: 'societe' },
    ],
    order: [['date_retrait', 'DESC']]
  });

  daily_orders_cancelled.forEach(cmd => {
    if (typeof cmd.items === 'string') {
      cmd.items = JSON.parse(cmd.items);
    }
  });


  const all_orders = await Commande.findAll({
    where:restaurantFilter,
    include: [
      {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
          required: false,
      },
      { association: 'client' },
      { association: 'societe' },
    ],
    order: [['date_retrait', 'DESC']]
  });

  all_orders.forEach(cmd => {
    if (typeof cmd.items === 'string') {
      cmd.items = JSON.parse(cmd.items);
    }
  });
  
  console.log("envoyés",daily_bookings.length)

  res.json({
    societe:societeID,
    daily_bookings:daily_bookings,
    daily_bookings_no_show:daily_bookings_no_show,
    daily_bookings_end:daily_bookings_end,
    daily_bookings_to_come:daily_bookings_to_come,
    daily_bookings_now:daily_bookings_now,
    all_bookings:all_bookings,
    daily_orders:daily_orders,
    daily_orders_coming:daily_orders_coming,
    daily_orders_ready:daily_orders_ready,
    daily_orders_took:daily_orders_took,
    daily_orders_cancelled:daily_orders_cancelled,
    all_orders:all_orders,

  });

};