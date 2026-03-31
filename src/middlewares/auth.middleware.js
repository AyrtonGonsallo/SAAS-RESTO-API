// middleware/auth.middleware.js
const { verifyAccessToken } = require('../services/token.service');
const routes_prefix = process.env.PREFIX;
const publicRoutes = [
  '/login',
  '/refresh',
  '/get_change_password_code',
  '/resset_password',
  '/check_change_password_code',
  '/',
];

module.exports = (req, res, next) => {

  let chemin = req.path.split(routes_prefix).filter(Boolean).pop();

  console.log("Middleware auth : chemin ",chemin)
  if (publicRoutes.includes(chemin)) {
    console.log("autoriser quand meme")
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