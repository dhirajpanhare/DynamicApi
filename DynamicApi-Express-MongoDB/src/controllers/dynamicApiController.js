/**
 * Dynamic API Controllers
 * Handle HTTP requests for dynamic operations on MongoDB
 * References: DynamicApi-Django views.py
 */

const logger = require('../utils/logger');
const { DynamicApiService } = require('../services/dynamicApiService');
const ProcedureMetadataExtractor = require('../services/procedureMetadataExtractor');
const MongoDBTransactionExecutor = require('../services/mongodbTransactionExecutor');

/**
 * Initialize service with mongoose connection
 */
let apiService;
let metadataExtractor;

const initializeController = (mongooseConnection) => {
  apiService = new DynamicApiService(mongooseConnection);
  metadataExtractor = new ProcedureMetadataExtractor(mongooseConnection, logger);
  
  // Initialize transaction executor and attach to service
  const transactionExecutor = new MongoDBTransactionExecutor(mongooseConnection);
  apiService.transactionExecutor = transactionExecutor;
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
    else if (body.stringOne !== undefined && body.stringFour !== undefined) {
      // stringOne contains delimited parameter string (e.g., "operationType=read|param2=value2")
      // stringFour is the collection name (fallback if not in stringOne)
      // stringTwo is parameter separator, stringThree is key-value separator
      
      collectionName = body.stringFour;
      parameters = body.stringOne;  // Pass full parameter string to be parsed
      paramSeparator = body.stringTwo || '|';
      keyValueSeparator = body.stringThree || '=';
      
      // Extract operationType from the parameter string if present
      // If stringOne contains "operationType=read|...", extract "read"
      // Otherwise use "read" as default operation type for backward compatibility
      const paramStr = String(body.stringOne || '');
      const opTypeMatch = paramStr.split(paramSeparator || '|')[0];
      
      if (opTypeMatch && opTypeMatch.includes('=')) {
        const [key, val] = opTypeMatch.split(keyValueSeparator || '=');
        if (key === 'operationType') {
          operationType = val;
        } else {
          // If operationType is not in parameters, use first parameter as operation type for backward compatibility
          operationType = 'read'; // Default to read
        }
      } else {
        // If no key=value format, assume it's an operation type directly for backward compatibility
        operationType = paramStr || 'read';
      }
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
      status: result.status,
      message: result.message,
      data: result.data || null,
    };

    if (result.metadata) {
      responseData.metadata = result.metadata;
    }

    if (result.executionTime !== undefined) {
      responseData.executionTime = result.executionTime;
    }

    if (result.cached !== undefined) {
      responseData.cached = result.cached;
    }

    const statusCode = result.status ? 200 : 400;
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

/**
 * GET /api/v1.0/DynamicApi/metadata/:collectionName
 * Get collection metadata (schema information)
 */
const getCollectionMetadata = async (req, res) => {
  try {
    const { collectionName } = req.params;

    if (!collectionName || typeof collectionName !== 'string' || collectionName.trim() === '') {
      return res.status(400).json({
        status: false,
        message: 'Collection name is required',
        data: null,
      });
    }

    logger.info(`Getting metadata for collection: ${collectionName}`);

    const metadata = await metadataExtractor.extractMetadata(collectionName.trim());

    return res.status(200).json({
      status: true,
      message: 'Metadata retrieved successfully',
      data: metadata,
    });
  } catch (error) {
    logger.error(`Error getting metadata: ${error.message}`);
    return res.status(400).json({
      status: false,
      message: error.message,
      data: null,
    });
  }
};

/**
 * GET /api/v1.0/DynamicApi/procedures
 * List all collections (equivalent to procedures for MongoDB)
 */
const listProcedures = async (req, res) => {
  try {
    logger.info('Listing all collections');

    const collections = await metadataExtractor.listProcedures();

    return res.status(200).json({
      status: true,
      message: 'Collections listed successfully',
      data: collections,
    });
  } catch (error) {
    logger.error(`Error listing collections: ${error.message}`);
    return res.status(400).json({
      status: false,
      message: error.message,
      data: null,
    });
  }
};

/**
 * POST /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute
 * Execute multiple MongoDB operations in a transaction
 */
const executeTransaction = async (req, res) => {
  try {
    // Extract transaction data from request body
    const { transaction = false, operations = [] } = req.body;
    const userEmail = req.user?.email || 'anonymous';

    // Validate transaction flag
    if (!transaction) {
      return res.status(400).json({
        status: false,
        message: 'Transaction must be set to true',
        data: null,
      });
    }

    // Validate operations array
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Operations array is required and must not be empty',
        data: null,
      });
    }

    // Validate each operation
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      // Validate operation type
      const validTypes = ['create', 'read', 'update', 'delete', 'aggregate', 'bulk'];
      if (!op.operationType || !validTypes.includes(op.operationType.toLowerCase())) {
        return res.status(400).json({
          status: false,
          message: `Operation ${i}: Invalid or missing operation type. Must be one of: ${validTypes.join(', ')}`,
          data: null,
        });
      }

      // Validate collection name
      if (!op.collectionName || typeof op.collectionName !== 'string' || op.collectionName.trim() === '') {
        return res.status(400).json({
          status: false,
          message: `Operation ${i}: Collection name is required`,
          data: null,
        });
      }

      // Validate collection name format
      const collNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      if (!collNameRegex.test(op.collectionName.trim())) {
        return res.status(400).json({
          status: false,
          message: `Operation ${i}: Invalid collection name format`,
          data: null,
        });
      }
    }

    logger.info(`Executing transaction with ${operations.length} operations by ${userEmail}`);

    // Execute transaction
    const result = await apiService.executeTransaction(operations, userEmail);

    // Prepare response
    const responseData = {
      status: result.status,
      message: result.message,
      executionTime: result.executionTime,
      cached: false,
      data: result.data || null,
    };

    const statusCode = result.status ? 200 : 400;
    return res.status(statusCode).json(responseData);

  } catch (error) {
    logger.error(`Error in executeTransaction controller: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);

    return res.status(500).json({
      status: false,
      message: 'An error occurred processing your transaction. Please contact support.',
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
  getCollectionMetadata,
  listProcedures,
  executeTransaction,
};
