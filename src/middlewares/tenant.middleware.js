module.exports = (req, res, next) => {
const publicRoutes = [
  'login',
  'refresh',
  'get_change_password_code',
  'resset_password',
  'check_change_password_code',
];

 let chemin = req.path.split('/').filter(Boolean).pop();

  console.log("chemin ",chemin)
  if (publicRoutes.includes(chemin)) {
    console.log("autoriser quand meme")
    return next();
  }


  const user = req.user;

  // 👑 SUPER ADMIN
  req.isSuperAdmin = user?.role_type === 'super-admin';
  console.log("user?.Role?.type",user?.role_type)

  if (!req.isSuperAdmin) {
    req.societe_id = user.societe_id;
    req.restos = user.restos;
  }

  next();
};