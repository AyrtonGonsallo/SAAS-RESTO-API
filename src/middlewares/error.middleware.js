const {logger} = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(`
❌ ERROR ${req.method} ${req.originalUrl}
Message: ${err.message}
Stack: ${err.stack}
Body: ${JSON.stringify(req.body)}
  `);

  res.status(500).json({
    message: err.message || 'Erreur serveur'
  });
};

module.exports = errorMiddleware;