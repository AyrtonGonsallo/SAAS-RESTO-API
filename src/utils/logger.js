// src/utils/logger.js
const { createLogger, format, transports } = require('winston');

const createCustomLogger = (filenamePrefix) => {
  const logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}] ${message}`;
      })
    ),
    transports: [
      new transports.File({ filename: `logs/${filenamePrefix}_error.log`, level: 'error' }),
      new transports.File({ filename: `logs/${filenamePrefix}_combined.log` })
    ]
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
      format: format.simple()
    }));
  }

  return logger;
};

// 👇 tes loggers
const logger = createCustomLogger('app');
const middlewareLogger = createCustomLogger('middleware');
const stripeLogger = createCustomLogger('stripe');

module.exports = {
  logger,
  middlewareLogger,
  stripeLogger
};