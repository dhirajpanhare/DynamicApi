/**
 * Logger utility for application-wide logging
 * Provides consistent logging across the application
 */

const logger = {
    /**
     * Log info level messages
     * @param {string} message - Message to log
     */
    info: (message) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    },

    /**
     * Log error level messages
     * @param {string} message - Message to log
     */
    error: (message) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    },

    /**
     * Log debug level messages
     * @param {string} message - Message to log
     */
    debug: (message) => {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    },

    /**
     * Log warning level messages
     * @param {string} message - Message to log
     */
    warn: (message) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
};

module.exports = logger;
