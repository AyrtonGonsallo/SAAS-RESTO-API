// middleware/auth.middleware.js
const { verifyAccessToken } = require('../services/jwt.service');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};