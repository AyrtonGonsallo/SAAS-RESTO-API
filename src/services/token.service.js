// services/jwt.service.js
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const REFRESH_EXPIRATION = process.env.REFRESH_EXPIRATION;
const ACCESS_EXPIRATION= process.env.ACCESS_EXPIRATION;

exports.generateAccessToken = (user) => {
  const restaurantIds = user.Restaurants?.map(r => r.id) || [];
  return jwt.sign(
    { id: user.id, email: user.email, role_id: user.role_id, role_type: user.Role.type,societe_id: user.societe_id,restos:restaurantIds },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRATION}
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRATION }
  );
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};