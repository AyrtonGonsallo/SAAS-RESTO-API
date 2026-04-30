module.exports = (req, res, next) => {
const routes_prefix = process.env.PREFIX;
const publicRoutes = [
  '/login',
  '/mobile_login',
  '/refresh',
  '/get_change_password_code',
  '/resset_password',
  '/ajouter_societe',
  '/ajouter_reservation',
  '/ajouter_commande',
  '/check_change_password_code',
  '/get_stripe_payment_link_for_reservation',
  '/get_stripe_payment_link_for_commande',
  '/get_reservation_datas_by_societeID',
  '/get_commande_datas_by_societeID',
  '/get_avis_reservation_by_id',
  '/get_avis_commande_by_id',
  '/ajouter_avis',
  '/presentation',
  '/stripe_reservation_payment_webhook',
  '/update_reservations_statuts',
  '/watch_reservations_delais',
  '/send_queued_messages'
];

 let chemin = req.path.split(routes_prefix).filter(Boolean).pop();

  console.log("Middleware tenant : chemin ",chemin)
  if (publicRoutes.some(route => chemin.startsWith(route))) {
    console.log("autoriser quand meme");
    return next();
  }


  const user = req.user;

  //  SUPER ADMIN
  req.isSuperAdmin = user?.role_type === 'super-admin';

   req.role_priorite = user?.role_priorite;
  console.log("user?.Role?.type",user?.role_type)

  if (!req.isSuperAdmin) {
    req.societe_id = user.societe_id;
    req.restos = user.restos;
    req.user_id = user.id;
  }

  next();
};