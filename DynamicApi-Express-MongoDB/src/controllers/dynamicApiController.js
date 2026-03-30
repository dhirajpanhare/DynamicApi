/**
 * Dynamic API Controllers
 * Handle HTTP requests for dynamic operations on MongoDB
 * References: DynamicApi-Django views.py
 */

const logger = require('../utils/logger');
const { DynamicApiService } = require('../services/dynamicApiService');

/**
 * Initialize service with mongoose connection
 */
let apiService;

const initializeController = (mongooseConnection) => {
  apiService = new DynamicApiService(mongooseConnection);
};

/**
 * POST /api/v1.0/DynamicApi/DynamicApiExecute
 * Execute operation with string-delimited parameters
 * 
 * Expected POST body:
 * {
 *   "stringOne": "operationType=create|collectionName=users|documents={...}",
 *   "stringTwo": "|",
 *   "stringThree": "=",
 *   "stringFour": "users"  // fallback collection name (if needed)
 * }
 * 
 * OR for MongoDB v2 format:
 * {
 *   "operationType": "create",
 *   "collectionName": "users",
 *   "parameters": {
 *     "documents": {...}
 *   }
 * }
 */
const executeOperation = async (req, res) => {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return res.status(405).json({
        status: false,
        message: 'Method not allowed. Use POST.',
        data: null,
      });
    }

    const { body } = req;

    // Support two formats: legacy (stringOne/stringTwo/etc) and new (operationType/collectionName/parameters)
    let operationType, collectionName, parameters, paramSeparator, keyValueSeparator;

    // New format (v2 - JSON based)
    if (body.operationType && body.collectionName) {
      operationType = body.operationType;
      collectionName = body.collectionName;
      parameters = body.parameters || {};
      paramSeparator = body.paramSeparator || '|';
      keyValueSeparator = body.keyValueSeparator || '=';
    }
    // Legacy format (v1 - string delimited)
    else if (body.stringOne && body.stringFour) {
      operationType = body.stringOne;
      collectionName = body.stringFour;
      parameters = '';
      paramSeparator = body.stringTwo || '|';
      keyValueSeparator = body.stringThree || '=';
    } else {
      return res.status(400).json({
        status: false,
        message: 'Invalid request format. Provide either (operationType, collectionName, parameters) or (stringOne, stringTwo, stringThree, stringFour)',
        data: null,
      });
    }

    // Get user email from JWT token if available
    let userEmail = 'anonymous';
    if (req.user && req.user.email) {
      userEmail = req.user.email;
    }

    logger.info(
      `API request: operationType=${operationType}, collection=${collectionName}, user=${userEmail}`
    );

    // Handle JSON vs string parameters
    let result;
    if (typeof parameters === 'object' && parameters !== null) {
      // JSON parameters
      result = await apiService.executeJsonOperation(
        operationType,
        collectionName,
        parameters,
        userEmail
      );
    } else {
      // String-delimited parameters
      result = await apiService.executeOperation(
        operationType,
        collectionName,
        parameters,
        paramSeparator,
        keyValueSeparator,
        userEmail
      );
    }

    // Prepare response
    const responseData = {
      status: result.success,
      message: result.message,
      data: result.data || null,
    };

    if (result.metadata) {
      responseData.metadata = result.metadata;
    }

    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(responseData);
  } catch (error) {
    logger.error(`Error in executeOperation controller: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);

    return res.status(500).json({
      status: false,
      message: 'An error occurred processing your request. Please contact support.',
      data: null,
    });
  }
};

/**
 * GET /api/v1.0/DynamicApi/Collections
 * Get list of available collections
 */
const getAvailableCollections = async (req, res) => {
  try {
    const result = await apiService.getAvailableCollections();

    return res.status(200).json({
      status: true,
      message: 'Collections retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`Error in getAvailableCollections: ${error.message}`);

    return res.status(500).json({
      status: false,
      message: 'An error occurred retrieving collections.',
      data: null,
    });
  }
};

/**
 * GET /api/v1.0/DynamicApi/Collections/:collectionName/Schema
 * Get schema information for a collection
 */
const getCollectionSchema = async (req, res) => {
  try {
    const { collectionName } = req.params;

    if (!collectionName) {
      return res.status(400).json({
        status: false,
        message: 'Collection name is required',
        data: null,
      });
    }

    const result = await apiService.getCollectionSchema(collectionName);

    return res.status(200).json({
      status: true,
      message: 'Schema retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`Error in getCollectionSchema: ${error.message}`);

    return res.status(500).json({
      status: false,
      message: 'An error occurred retrieving schema.',
      data: null,
    });
  }
};

/**
 * POST /api/v1.0/DynamicApi/ValidateOperation
 * Validate operation without executing it
 */
const validateOperation = async (req, res) => {
  try {
    const { operationType, collectionName, parameters } = req.body;

    // Validate operation type
    const validTypes = [
      'create',
      'read',
      'update',
      'delete',
      'aggregate',
      'bulk',
      'transaction',
    ];
    if (!validTypes.includes(operationType?.toLowerCase())) {
      return res.status(400).json({
        status: false,
        message: `Invalid operation type: ${operationType}. Must be one of: ${validTypes.join(', ')}`,
        data: null,
      });
    }

    // Validate collection name format
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(collectionName)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid collection name format',
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Operation validation passed',
      data: {
        operationType,
        collectionName,
        parametersValid: parameters !== undefined,
      },
    });
  } catch (error) {
    logger.error(`Error in validateOperation: ${error.message}`);

    return res.status(500).json({
      status: false,
      message: 'An error occurred validating operation.',
      data: null,
    });
  }
};

module.exports = {
  initializeController,
  executeOperation,
  getAvailableCollections,
  getCollectionSchema,
  validateOperation,
};
