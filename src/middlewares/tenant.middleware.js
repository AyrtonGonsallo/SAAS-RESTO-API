module.exports = (req, res, next) => {
const routes_prefix = process.env.PREFIX;
const publicRoutes = [
  '/login',
  '/refresh',
  '/get_change_password_code',
  '/resset_password',
  '/ajouter_societe',
  '/ajouter_reservation',
  '/check_change_password_code',
  '/',
];

 let chemin = req.path.split(routes_prefix).filter(Boolean).pop();

  console.log("Middleware tenant : chemin ",chemin)
  if (publicRoutes.includes(chemin)) {
    console.log("autoriser quand meme")
    return next();
  }


  const user = req.user;

  // 👑 SUPER ADMIN
  req.isSuperAdmin = user?.role_type === 'super-admin';

   req.role_priorite = user?.role_priorite;
  console.log("user?.Role?.type",user?.role_type)

  if (!req.isSuperAdmin) {
    req.societe_id = user.societe_id;
    req.restos = user.restos;
  }

  next();
};