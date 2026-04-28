const db = require('../models');
const {  Societe,Restaurant,Role,Utilisateur,Commande,Reservation } = db;
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

  if (user.Role.priorite<3 || user.Role.priorite>7 ) return res.status(404).json({ message: `L'utilisateur existe mais son rôle (${user.Role.type}) ne fait pas partie des rôles admis.` });


  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // stocker refresh token en DB
  user.refresh_token = refreshToken;
    user.derniere_connexion = new Date();
  await user.save();

  res.json({ accessToken, refreshToken,user });
};



exports.getMobileDatas = async (req, res) => {
  

    const societeID = req.societe_id;

    const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

   
    restaurantFilter = {societe_id: societeID};

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
        { association: 'table' },
        { association: 'service' },
        { association: 'creneau' },
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
        { association: 'table' },
        { association: 'service' },
        { association: 'creneau' },
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
    
    

    res.json({
      societe:societeID,
      daily_bookings:daily_bookings,
      all_bookings:all_bookings,
      daily_orders:daily_orders,
      all_orders:all_orders,

    });

};