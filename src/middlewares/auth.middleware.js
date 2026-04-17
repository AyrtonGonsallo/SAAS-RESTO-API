// middleware/auth.middleware.js
const { verifyAccessToken } = require('../services/token.service');
const {middlewareLogger} = require('../utils/logger');
const routes_prefix = process.env.PREFIX;
const publicRoutes = [
  '/login',
  '/refresh',
  '/get_change_password_code',
  '/resset_password',
  '/ajouter_reservation',
  '/check_change_password_code',
  '/ajouter_societe',
  '/get_stripe_payment_link_for_resto',
  '/get_reservation_data_by_societeID',
  '/get_commande_datas_by_societeID',
  '/presentation',
  '/stripe_reservation_payment_webhook',
  '/update_reservations_statuts',
  '/watch_reservations_delais'
];


module.exports = (req, res, next) => {

  let chemin = req.path.split(routes_prefix).filter(Boolean).pop();

  console.log("Middleware auth : chemin ",chemin)//Middleware auth : chemin  /get_reservation_data_by_societeID/8

  middlewareLogger.info(
      `Middleware auth : ${chemin} ${res.statusCode}`
    );


 if (publicRoutes.some(route => chemin.startsWith(route))) {
  console.log("autoriser quand meme");
  middlewareLogger.info(
      `autoriser quand meme`
    );
  return next();
}

  const authHeader = req.headers['authorization'];

  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    console.log("decoded",req.user)
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};