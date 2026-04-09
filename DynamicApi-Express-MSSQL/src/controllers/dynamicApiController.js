/**
 * Dynamic API Controller
 * Handles HTTP requests for dynamic stored procedure execution
 */

const logger = require('../utils/logger');
const { generatePayload } = require('../utils/procedurePayloadGenerator');

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

    /**
     * Get metadata for a stored procedure
     * GET /api/v1.0/DynamicApi/metadata/:procedureName
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {void} Sends JSON response with metadata
     */
    async getProcedureMetadata(req, res) {
        try {
            const { procedureName } = req.params;

            if (!procedureName || typeof procedureName !== 'string' || procedureName.trim() === '') {
                return res.status(400).json({
                    status: false,
                    message: 'Procedure name is required',
                    data: null
                });
            }

            logger.info(`Getting metadata for procedure: ${procedureName}`);

            const metadata = await this.dynamicApiService.metadataExtractor.extractMetadata(procedureName.trim());

            return res.status(200).json({
                status: true,
                message: 'Metadata retrieved successfully',
                data: metadata
            });

        } catch (error) {
            logger.error(`Error getting metadata: ${error.message}`);
            return res.status(400).json({
                status: false,
                message: error.message,
                data: null
            });
        }
    }

    /**
     * List all stored procedures
     * GET /api/v1.0/DynamicApi/procedures
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {void} Sends JSON response with procedure list
     */
    async listProcedures(req, res) {
        try {
            logger.info('Listing all procedures');

            const procedures = await this.dynamicApiService.metadataExtractor.listProcedures();

            return res.status(200).json({
                status: true,
                message: 'Procedures listed successfully',
                data: procedures
            });

        } catch (error) {
            logger.error(`Error listing procedures: ${error.message}`);
            return res.status(400).json({
                status: false,
                message: error.message,
                data: null
            });
        }
    }

    /**
     * Execute multiple stored procedures within a transaction
     * POST /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {void} Sends JSON response with transaction result
     */
    async executeTransaction(req, res) {
        try {
            // Extract transaction data from request body
            const { transaction = false, operations = [] } = req.body;

            // Validate transaction flag
            if (!transaction) {
                return res.status(400).json({
                    status: false,
                    message: 'Transaction must be set to true',
                    data: null
                });
            }

            // Validate operations array
            if (!Array.isArray(operations) || operations.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Operations array is required and must not be empty',
                    data: null
                });
            }

            // Validate each operation
            for (let i = 0; i < operations.length; i++) {
                const op = operations[i];
                if (!op.procedureName || typeof op.procedureName !== 'string' || op.procedureName.trim() === '') {
                    return res.status(400).json({
                        status: false,
                        message: `Operation ${i}: Procedure name is required`,
                        data: null
                    });
                }

                // Validate procedure name format
                const procNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
                if (!procNameRegex.test(op.procedureName.trim())) {
                    return res.status(400).json({
                        status: false,
                        message: `Operation ${i}: Invalid procedure name format`,
                        data: null
                    });
                }
            }

            logger.info(`Executing transaction with ${operations.length} operations`);

            // Execute transaction
            const result = await this.dynamicApiService.transactionExecutor.execute(operations, req.user?.email || null);

            if (result.success) {
                return res.status(200).json({
                    status: result.success,
                    message: result.message,
                    executionTime: result.executionTime,
                    cached: false,
                    data: result.data
                });
            } else {
                return res.status(500).json({
                    status: result.success,
                    message: result.message,
                    executionTime: result.executionTime,
                    cached: false,
                    data: result.data
                });
            }

        } catch (error) {
            logger.error(`Unexpected error in executeTransaction: ${error.message}`);
            return res.status(500).json({
                status: false,
                message: 'Internal server error',
                data: null
            });
        }
    }

    /**
     * Generate a DynamicApiExecute payload from a CREATE PROCEDURE definition
     * POST /api/v1.0/DynamicApi/GeneratePayload
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    generatePayload(req, res) {
        try {
            const { procedureDefinition } = req.body;

            if (!procedureDefinition || typeof procedureDefinition !== 'string' || procedureDefinition.trim() === '') {
                return res.status(400).json({
                    status: false,
                    message: 'procedureDefinition is required in the request body',
                    data: null
                });
            }

            const payload = generatePayload(procedureDefinition);

            return res.status(200).json({
                status: true,
                message: 'Payload generated successfully',
                data: payload
            });

        } catch (error) {
            logger.error(`Error generating payload: ${error.message}`);
            return res.status(400).json({
                status: false,
                message: error.message,
                data: null
            });
        }
    }
}

module.exports = DynamicApiController;
