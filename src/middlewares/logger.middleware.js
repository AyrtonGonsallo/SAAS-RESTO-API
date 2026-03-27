const logger = require('../utils/logger');

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  if(!req.originalUrl.includes('api/v1')){
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

module.exports = loggerMiddleware;