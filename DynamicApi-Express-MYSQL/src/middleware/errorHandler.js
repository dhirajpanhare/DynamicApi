/**
 * Error handling middleware
 * Handles uncaught errors and provides standardized error responses
 */

const logger = require('../utils/logger');

/**
 * 404 Not Found handler middleware
 * Called when no route matches the request
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: false,
        message: 'Endpoint not found',
        data: null
    });
};

/**
 * Global error handler middleware
 * Catches all errors and returns standardized response
 * Must be registered last in the middleware chain
 */
const errorHandler = (error, req, res, next) => {
    // Log full error with stack trace server-side
    logger.error(`Unhandled error: ${error.message}`, error.stack);
    
    const statusCode = error.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Return standardized error response
    const response = {
        status: false,
        message: isDevelopment 
            ? error.message 
            : 'An unexpected error occurred. Please contact support if the problem persists.',
        data: null
    };
    
    // Only include stack trace in development
    if (isDevelopment) {
        response.debug = {
            error: error.message,
            stack: error.stack
        };
    }
    
    res.status(statusCode).json(response);
};

module.exports = {
    notFoundHandler,
    errorHandler
};
