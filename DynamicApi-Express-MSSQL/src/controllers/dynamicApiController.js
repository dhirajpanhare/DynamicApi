/**
 * Dynamic API Controller
 * Handles HTTP requests for dynamic stored procedure execution
 */

const logger = require('../utils/logger');

class DynamicApiController {
    /**
     * Initialize controller with service dependencies
     * @param {DynamicApiService} dynamicApiService - Service for executing procedures
     */
    constructor(dynamicApiService) {
        this.dynamicApiService = dynamicApiService;
    }

    /**
     * Execute a stored procedure dynamically
     * POST /api/v1.0/DynamicApi/DynamicApiExecute
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {void} Sends JSON response
     */
    async executeProcedure(req, res) {
        try {
            // Extract parameters from request body
            const { 
                stringOne = '', 
                stringTwo = '|', 
                stringThree = '=', 
                stringFour 
            } = req.body;

            // Validate required parameter
            if (!stringFour || typeof stringFour !== 'string' || stringFour.trim() === '') {
                return res.status(400).json({
                    status: false,
                    message: 'Procedure name is required',
                    data: null
                });
            }
            
            // Validate procedure name format - alphanumeric, underscore only
            const procNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
            if (!procNameRegex.test(stringFour.trim())) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid procedure name format',
                    data: null
                });
            }
            
            // Validate separators are single characters
            if (stringTwo && stringTwo.length > 1) {
                return res.status(400).json({
                    status: false,
                    message: 'Parameter separator must be single character',
                    data: null
                });
            }
            
            if (stringThree && stringThree.length > 1) {
                return res.status(400).json({
                    status: false,
                    message: 'Key-value separator must be single character',
                    data: null
                });
            }
            
            // Validate parameters string doesn't exceed reasonable length
            if (stringOne && stringOne.length > 10000) {
                return res.status(400).json({
                    status: false,
                    message: 'Parameters string exceeds maximum length',
                    data: null
                });
            }

            // Log procedure execution
            logger.info(`Executing stored procedure: ${stringFour}`);
            logger.debug(`Parameters - stringOne: ${stringOne}, separator: ${stringTwo}, keyValueSep: ${stringThree}`);

            // Execute procedure through service
            const result = await this.dynamicApiService.executeProcedureAsync(
                stringFour.trim(),
                stringOne || '',
                stringTwo || '|',
                stringThree || '=',
                req.user?.email || 'anonymous'  // Support authenticated users in future
            );

            // Return response
            return res.status(result.status ? 200 : 400).json({
                status: result.status,
                message: result.message,
                data: result.data || []
            });

        } catch (error) {
            logger.error(`Unexpected error in executeProcedure: ${error.message}`);
            return res.status(500).json({
                status: false,
                message: 'Internal server error',
                data: null
            });
        }
    }

    /**
     * Health check endpoint
     * GET /health
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {void} Sends JSON response with health status
     */
    healthCheck(req, res) {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    }
}

module.exports = DynamicApiController;
