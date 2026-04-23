//societe, restaurants, utilisateurs, roles
// routes/partie1.routes.js
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const db = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/token.service');
const { Societe, Utilisateur, Restaurant, Role, Parametre } = db;
const emailService = require('../services/mailer.service'); 
const MAILS_ENABLED = process.env.MAILS_ENABLED;

router.post('/login', async (req, res) => {
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
          include: [
            {
              model: Parametre,
              as: 'parametres'
            }
          ]
        },
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          through: { attributes: [] }, // supprime les infos de la table pivot
          required: false,
        },
      ] 
  });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const valid = await bcrypt.compare(password, user.mot_de_passe);
  if (!valid) return res.status(401).json({ message: 'Invalid password' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // stocker refresh token en DB
  user.refresh_token = refreshToken;
   user.derniere_connexion = new Date();
  await user.save();

  res.json({ accessToken, refreshToken,user });
});


router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await Utilisateur.findByPk(decoded.id,
      {
        include: [
          {
            model: Role,
            required: false,
          },
          {
            model: Societe,
            attributes: ['id', 'titre', 'status'],
            required: false,
            include: [
              {
                model: Parametre,
                as: 'parametres'
              }
            ]
          },
          {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
            through: { attributes: [] }, // supprime les infos de la table pivot
            required: false,
          },
        ] 
      }
    );
    console.log("!user",!user)
    console.log("user.refresh_token !== refreshToken",user.refresh_token !== refreshToken)
    if (!user || user.refresh_token !== refreshToken) {
      return res.sendStatus(403);
    }

    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.log("err",err)
    res.sendStatus(403);
  }
});


router.post('/get_change_password_code', async (req, res) => {
  const { email } = req.body;
  console.log("email",email)
  const user = await Utilisateur.findOne({ where: { email:email } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Générer un code à 6 chiffres
  const code = Math.floor(100000 + Math.random() * 900000).toString();
console.log("code",code)
  // Stocker le code dans verification_token + expiration
  user.verification_token = code;
  user.reset_password_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  console.log("MAILS_ENABLED",MAILS_ENABLED)
  if(MAILS_ENABLED=== 'true'){
    console.log("tentative de mails")
    // Envoyer mail (template ejs)
    await emailService.sendMail({
      to: email,
      subject: 'Code de réinitialisation de mot de passe',
      template: 'reset-password.ejs',
      context: { code } // variable à injecter dans ejs
    });
  }else{
    console.log("pas de mails")
  }
  
  

  res.json({ message: 'Code envoyé par mail' });
});


router.post('/check_change_password_code', async (req, res) => {
  const { email, code } = req.body;

  const user = await Utilisateur.findOne({ where: { email:email } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Vérifier si le code correspond et n'a pas expiré
  if (
    user.verification_token !== code ||
    !user.reset_password_expires ||
    new Date() > user.reset_password_expires
  ) {
    return res.status(400).json({ message: 'Code invalide ou expiré' });
  }

  res.json({ message: 'Code valide' });
});


router.post('/resset_password', async (req, res,next) => {
  try {
    const {
      email,
      mot_de_passe,
    } = req.body;

    console.log(email,mot_de_passe,)

    const utilisateur = await Utilisateur.findOne({ where: { email:email } });
    if (!utilisateur) return res.status(404).json({ message: 'User not found' });

    //  hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    await utilisateur.update({ mot_de_passe: hashedPassword, });

    
    return res.status(201).json({
      success: true,
      data: utilisateur
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;