/**
 * Dynamic API Service Layer
 * Contains core business logic for API operations
 * References: DynamicApi-Django services.py
 */

const logger = require('../utils/logger');
const MongoDBOperationExecutor = require('./mongodbOperationExecutor');
const OperationLog = require('../models/operationLog');

/**
 * Parameter Parser - Parse delimited parameter strings with validation
 */
class ParameterParser {
  static PARAM_NAME_PATTERN = /^[a-zA-Z_@][a-zA-Z0-9_]*$/;
  static MAX_PARAM_VALUE_LENGTH = 50000;

  /**
   * Parse delimited parameter string into dictionary with validation
   * @param {string} paramString - Delimited parameter string (e.g., "operationType=create|collectionName=users")
   * @param {string} paramSeparator - Separator between parameters (default: "|")
   * @param {string} keyValueSeparator - Separator between key and value (default: "=")
   * @returns {object} Dictionary of parsed parameters
   * @throws {Error} If parameter format is invalid
   */
  static parseParameters(paramString, paramSeparator = '|', keyValueSeparator = '=') {
    if (!paramString || !paramString.trim()) {
      return {};
    }

    // Validate separators are single characters
    if (paramSeparator.length !== 1) {
      throw new Error('Parameter separator must be a single character');
    }
    if (keyValueSeparator.length !== 1) {
      throw new Error('Key-value separator must be a single character');
    }

    // Same separators would cause parsing issues
    if (paramSeparator === keyValueSeparator) {
      throw new Error('Parameter separator and key-value separator must be different');
    }

    const parameters = {};

    try {
      // Split by parameter separator
      const paramPairs = paramString.split(paramSeparator);

      for (const pair of paramPairs) {
        if (!pair.trim()) continue;

        // Split by key-value separator
        if (!pair.includes(keyValueSeparator)) {
          logger.warn(`Invalid parameter format: ${pair}`);
          throw new Error(`Invalid parameter format: ${pair}`);
        }

        const [key, ...valueParts] = pair.split(keyValueSeparator);
        const cleanKey = key.trim();
        const value = valueParts.join(keyValueSeparator).trim();

        // Validate parameter name is not empty
        if (!cleanKey) {
          throw new Error('Parameter name cannot be empty');
        }

        // Validate parameter name format
        if (!ParameterParser.PARAM_NAME_PATTERN.test(cleanKey)) {
          throw new Error(
            `Invalid parameter name format: ${cleanKey}. Must start with letter or underscore, contain only alphanumeric and underscore`
          );
        }

        // Check for duplicate parameters
        if (cleanKey in parameters) {
          throw new Error(`Duplicate parameter: ${cleanKey}`);
        }

        // Validate value length
        if (value.length > ParameterParser.MAX_PARAM_VALUE_LENGTH) {
          throw new Error(`Parameter value exceeds maximum length for: ${cleanKey}`);
        }

        parameters[cleanKey] = value;
        logger.debug(`Parsed parameter: ${cleanKey}=${value.substring(0, 50)}...`);
      }

      return parameters;
    } catch (error) {
      if (error.message.startsWith('Parameter')) {
        throw error;
      }
      logger.error(`Error parsing parameters: ${error.message}`);
      throw new Error(`Parameter parsing error: ${error.message}`);
    }
  }

  /**
   * Parse JSON parameter string
   * @param {string} jsonString - JSON string of parameters
   * @returns {object} Parsed parameters
   */
  static parseJsonParameters(jsonString) {
    try {
      if (!jsonString || !jsonString.trim()) {
        return {};
      }
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON parameters: ${error.message}`);
    }
  }
}

/**
 * Dynamic API Service
 */
class DynamicApiService {
  constructor(mongooseConnection) {
    this.mongooseConnection = mongooseConnection;
    this.executor = new MongoDBOperationExecutor(mongooseConnection);
  }

  /**
   * Execute operation on MongoDB collection
   * @param {string} operationType - Type of operation
   * @param {string} collectionName - Name of collection
   * @param {string} parameters - Delimited parameter string
   * @param {string} paramSeparator - Parameter separator
   * @param {string} keyValueSeparator - Key-value separator
   * @param {string} userEmail - Email of user executing operation
   * @returns {Promise<{success: boolean, message: string, data: any}>}
   */
  async executeOperation(
    operationType,
    collectionName,
    parameters,
    paramSeparator = '|',
    keyValueSeparator = '=',
    userEmail = 'anonymous'
  ) {
    const startTime = Date.now();
    const executionData = {
      operationType,
      collectionName,
      parameters,
      userEmail,
    };

    try {
      // Validate operation type
      if (!operationType || !operationType.trim()) {
        const message = 'Operation type cannot be empty';
        logger.warn(message);
        await this._logOperation(false, message, executionData, startTime);
        return { success: false, message, data: null };
      }

      // Validate collection name
      if (!collectionName || !collectionName.trim()) {
        const message = 'Collection name cannot be empty';
        logger.warn(message);
        await this._logOperation(false, message, executionData, startTime);
        return { success: false, message, data: null };
      }

      // Parse parameters
      let parsedParams = {};
      try {
        parsedParams = ParameterParser.parseParameters(
          parameters,
          paramSeparator,
          keyValueSeparator
        );
      } catch (error) {
        const message = `Invalid parameters: ${error.message}`;
        logger.warn(message);
        await this._logOperation(false, message, executionData, startTime);
        return { success: false, message, data: null };
      }

      // Execute operation
      logger.info(
        `Executing ${operationType} on collection ${collectionName} for user ${userEmail}`
      );

      const result = await this.executor.execute(
        operationType,
        collectionName,
        parsedParams,
        userEmail
      );

      if (result.success) {
        await this._logOperation(true, result.message, executionData, startTime, result.data);
      }

      const executionTime = Date.now() - startTime;

      return {
        status: result.success,
        message: result.message,
        executionTime: executionTime,
        cached: false,
        data: result.data || null
      };
    } catch (error) {
      const message = 'An error occurred executing the operation. Please contact support if the problem persists.';
      logger.error(
        `Error executing ${operationType} on collection ${collectionName}: ${error.message}`
      );
      logger.error(`Parameters: ${JSON.stringify(executionData)}`);

      const executionTime = Date.now() - startTime;
      await this._logOperation(false, message, executionData, startTime);

      return {
        status: false,
        message,
        executionTime: executionTime,
        cached: false,
        data: null,
      };
    }
  }

  /**
   * Execute operation with JSON parameters
   * @param {string} operationType - Type of operation
   * @param {string} collectionName - Name of collection
   * @param {object} operationData - Operation data as object
   * @param {string} userEmail - Email of user executing operation
   * @returns {Promise<{success: boolean, message: string, data: any}>}
   */
  async executeJsonOperation(
    operationType,
    collectionName,
    operationData,
    userEmail = 'anonymous'
  ) {
    const startTime = Date.now();
    const executionData = {
      operationType,
      collectionName,
      userEmail,
    };

    try {
      // Validate inputs
      if (!operationType || !operationType.trim()) {
        throw new Error('Operation type cannot be empty');
      }

      if (!collectionName || !collectionName.trim()) {
        throw new Error('Collection name cannot be empty');
      }

      logger.info(
        `Executing JSON operation ${operationType} on collection ${collectionName} for user ${userEmail}`
      );

      const result = await this.executor.execute(
        operationType,
        collectionName,
        operationData,
        userEmail
      );

      if (result.success) {
        await this._logOperation(true, result.message, executionData, startTime, result.data);
      }

      return result;
    } catch (error) {
      const message = 'An error occurred executing the operation. Please contact support if the problem persists.';
      logger.error(
        `Error executing JSON operation ${operationType} on collection ${collectionName}: ${error.message}`
      );

      await this._logOperation(false, message, executionData, startTime);

      return {
        success: false,
        message,
        data: null,
      };
    }
  }

  /**
   * Get list of available collections
   * @returns {Promise<{collections: string[]}>}
   */
  async getAvailableCollections() {
    try {
      // Get registered models from Mongoose
      const modelNames = Object.keys(this.mongooseConnection.models);
      
      // Also try to get actual collections from database
      let dbCollections = [];
      try {
        if (this.mongooseConnection.db && this.mongooseConnection.db.listCollections) {
          const collections = await this.mongooseConnection.db.listCollections().toArray();
          dbCollections = collections.map((c) => c.name);
        }
      } catch (error) {
        logger.warn(`Could not list collections from database: ${error.message}`);
      }
      
      // Combine both sources, remove system collections
      const allCollections = [...new Set([...modelNames, ...dbCollections])].filter(
        (name) => !name.startsWith('system.')
      );
      
      return {
        collections: allCollections,
        count: allCollections.length,
      };
    } catch (error) {
      logger.error(`Error listing collections: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection schema information
   * @param {string} collectionName - Name of collection
   * @returns {Promise<{schema: object}>}
   */
  async getCollectionSchema(collectionName) {
    try {
      // Get or create model with dynamic schema
      const dynamicSchemaManager = require('../utils/dynamicSchemaManager');
      const Model = dynamicSchemaManager.getOrCreateModel(this.mongooseConnection, collectionName);

      const schema = Model.schema;
      const fields = {};

      for (const path in schema.paths) {
        const field = schema.paths[path];
        fields[path] = {
          type: field.instance,
          required: field.required || false,
          description: field.options?.description || '',
        };
      }

      return {
        collectionName,
        fields,
      };
    } catch (error) {
      logger.error(`Error getting collection schema: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log operation to database
   * @private
   */
  async _logOperation(success, message, executionData, startTime, resultData = null) {
    try {
      const duration = Date.now() - startTime;

      await OperationLog.create({
        operationType: executionData.operationType,
        collectionName: executionData.collectionName,
        parameters: executionData.parameters,
        userEmail: executionData.userEmail,
        success,
        message,
        duration,
        resultCount: resultData ? (Array.isArray(resultData) ? resultData.length : 1) : 0,
      });
    } catch (error) {
      logger.error(`Failed to log operation: ${error.message}`);
      // Don't throw - logging errors shouldn't break the main flow
    }
  }

  /**
   * Execute multiple operations within a MongoDB transaction
   * @param {Array} operations - Array of {operationType, collectionName, parameters}
   * @param {string} userEmail - User email for audit
   * @returns {Promise<{success, message, data, executionTime}>}
   */
  async executeTransaction(operations, userEmail = 'anonymous') {
    const startTime = Date.now();

    try {
      if (!this.transactionExecutor) {
        throw new Error('Transaction executor not initialized');
      }

      // Set the operation executor on the transaction executor if not already set
      if (!this.transactionExecutor.operationExecutor) {
        this.transactionExecutor.setOperationExecutor(this.operationExecutor);
      }

      logger.info(`Executing transaction with ${operations.length} operations by ${userEmail}`);

      // Execute the transaction
      const result = await this.transactionExecutor.execute(operations, userEmail);

      // Log the transaction (non-blocking)
      this._logTransaction(
        result.success,
        result.message,
        {
          operationCount: operations.length,
          operationsCompleted: result.data.successfulOperations,
          operationsFailed: result.data.failedOperations,
          userEmail,
        },
        startTime
      ).catch((err) => {
        logger.error(`Failed to log transaction: ${err.message}`);
      });

      return result;
    } catch (error) {
      logger.error(`Transaction execution error: ${error.message}`);

      const duration = Date.now() - startTime;

      return {
        success: false,
        message: `Transaction error: ${error.message}`,
        data: {
          operationCount: operations.length,
          successfulOperations: 0,
          failedOperations: operations.length,
          operations: [],
        },
        executionTime: duration,
      };
    }
  }

  /**
   * Log transaction to database
   * @private
   */
  async _logTransaction(success, message, transactionData, startTime) {
    try {
      const duration = Date.now() - startTime;

      await OperationLog.create({
        operationType: 'transaction',
        collectionName: 'N/A',
        parameters: transactionData,
        userEmail: transactionData.userEmail,
        success,
        message,
        duration,
        resultCount: transactionData.operationsCompleted || 0,
      });
    } catch (error) {
      logger.error(`Failed to log transaction: ${error.message}`);
      // Don't throw - logging errors shouldn't break the main flow
    }
  }
}

module.exports = {
  DynamicApiService,
  ParameterParser,
};
