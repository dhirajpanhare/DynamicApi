/**
 * Error Handler Middleware
 * Centralized error handling for Express application
 */

const logger = require('../utils/logger');

/**
 * Error handling middleware - must be last
 */
const errorHandler = (error, req, res, next) => {
  logger.error(`Error: ${error.message}`);
  logger.error(`Stack: ${error.stack}`);

  // Determine HTTP status code
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // MongoDB validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  // MongoDB cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  }

  // Duplicate key error
  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Send error response
  res.status(statusCode).json({
    status: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An error occurred processing your request. Please contact support.'
        : message,
    data: null,
    ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
  });
};

module.exports = errorHandler;
