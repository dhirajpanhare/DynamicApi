/**
 * Logging Middleware
 * Logs all incoming HTTP requests
 */

const logger = require('../utils/logger');

/**
 * Middleware to log HTTP requests
 */
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Log request
  logger.debug(
    `${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('user-agent')}`
  );

  // Override res.send to log response
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.debug(
      `${req.method} ${req.path} - ${statusCode} - ${duration}ms`
    );

    // Only warn about slow requests in production
    if (process.env.NODE_ENV === 'production' && duration > 5000) {
      logger.warn(
        `Slow request: ${req.method} ${req.path} - ${duration}ms`
      );
    }

    // Send response
    return originalSend.call(this, data);
  };

  next();
};

module.exports = loggingMiddleware;
