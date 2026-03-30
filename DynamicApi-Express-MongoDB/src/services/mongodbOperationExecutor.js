/**
 * MongoDB Operation Executor
 * Executes dynamic operations on MongoDB collections
 * Supports CRUD, aggregations, transactions, and bulk operations
 */

const logger = require('../utils/logger');
const dynamicSchemaManager = require('../utils/dynamicSchemaManager');

class MongoDBOperationExecutor {
  constructor(mongooseConnection) {
    this.mongooseConnection = mongooseConnection;
  }

  /**
   * Execute operation on MongoDB
   * @param {string} operationType - Type: 'create', 'read', 'update', 'delete', 'aggregate', 'bulk', 'transaction'
   * @param {string} collectionName - Name of MongoDB collection
   * @param {object} parameters - Operation parameters
   * @param {string} userId - User executing operation (for logging)
   * @returns {Promise<{success: boolean, message: string, data: any}>}
   */
  async execute(operationType, collectionName, parameters, userId = 'anonymous') {
    const startTime = Date.now();

    try {
      // Validate operation type
      if (!this._isValidOperationType(operationType)) {
        throw new Error(
          `Invalid operation type: ${operationType}. Must be one of: create, read, update, delete, aggregate, bulk, transaction`
        );
      }

      // Validate collection name
      this._validateCollectionName(collectionName);

      // Get or create model for collection (dynamic schema)
      const Model = dynamicSchemaManager.getOrCreateModel(
        this.mongooseConnection,
        collectionName,
        operationType.toLowerCase() === 'create' ? parameters : null
      );

      logger.info(
        `Executing ${operationType} on collection ${collectionName} by user ${userId}`
      );

      // Route to appropriate handler
      let result;
      switch (operationType.toLowerCase()) {
        case 'create':
          result = await this._handleCreate(Model, parameters);
          break;
        case 'read':
          result = await this._handleRead(Model, parameters);
          break;
        case 'update':
          result = await this._handleUpdate(Model, parameters);
          break;
        case 'delete':
          result = await this._handleDelete(Model, parameters);
          break;
        case 'aggregate':
          result = await this._handleAggregate(Model, parameters);
          break;
        case 'bulk':
          result = await this._handleBulk(Model, parameters);
          break;
        case 'transaction':
          result = await this._handleTransaction(Model, parameters);
          break;
        default:
          throw new Error(`Operation type '${operationType}' not implemented`);
      }

      const duration = Date.now() - startTime;
      logger.info(
        `Operation ${operationType} on ${collectionName} completed in ${duration}ms`
      );

      return {
        success: true,
        message: `${operationType} operation completed successfully`,
        data: result,
        metadata: {
          operationType,
          collectionName,
          duration,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        `Error executing ${operationType} on collection ${collectionName}: ${error.message}`
      );
      logger.error(`Parameters: ${JSON.stringify(parameters)}`);

      return {
        success: false,
        message: `An error occurred executing the operation. Please contact support if the problem persists.`,
        data: null,
        metadata: {
          operationType,
          collectionName,
          duration,
          timestamp: new Date(),
          errorCode: this._getErrorCode(error),
        },
      };
    }
  }

  /**
   * Create: Insert one or multiple documents
   */
  async _handleCreate(Model, parameters) {
    // Support two formats:
    // 1. With explicit documents key: {documents: {...}, isMultiple: false}
    // 2. Direct format: {name: "...", email: "...", ...}
    
    let documents = parameters.documents;
    let isMultiple = parameters.isMultiple === true;

    // If no documents key, treat the entire parameters object as the document
    if (!documents) {
      // Check if isMultiple is true, which would indicate we're expecting an array
      if (isMultiple) {
        throw new Error('documents must be provided as an array when isMultiple is true');
      }
      
      // Filter out system keys and treat the rest as document data
      documents = {};
      for (const [key, value] of Object.entries(parameters)) {
        if (!['documents', 'isMultiple'].includes(key)) {
          documents[key] = value;
        }
      }

      // If no fields were extracted, throw error
      if (Object.keys(documents).length === 0) {
        throw new Error('No document data provided for create operation');
      }
    }

    if (isMultiple) {
      // Insert many
      if (!Array.isArray(documents)) {
        throw new Error('documents must be an array for bulk create');
      }

      if (documents.length === 0) {
        throw new Error('documents array cannot be empty');
      }

      if (documents.length > 1000) {
        throw new Error('Cannot create more than 1000 documents at once');
      }

      const result = await Model.insertMany(documents);
      return {
        insertedCount: result.length,
        insertedIds: result.map((doc) => doc._id),
        documents: result,
      };
    } else {
      // Insert one
      if (Array.isArray(documents)) {
        throw new Error('documents must be an object for single create');
      }

      const result = await Model.create(documents);
      return {
        insertedCount: 1,
        insertedId: result._id,
        document: result,
      };
    }
  }

  /**
   * Read: Query documents with filters, projection, sorting, pagination
   */
  async _handleRead(Model, parameters) {
    const {
      filter = {},
      projection = {},
      sort = {},
      skip = 0,
      limit = 100,
      countTotal = false,
    } = parameters;

    // Validate pagination parameters
    if (skip < 0 || limit < 0) {
      throw new Error('skip and limit must be non-negative');
    }

    if (limit > 10000) {
      throw new Error('limit cannot exceed 10000');
    }

    // Build query
    let query = Model.find(filter);

    // Apply projection
    if (Object.keys(projection).length > 0) {
      query = query.select(projection);
    }

    // Apply sorting
    if (Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }

    // Apply pagination
    query = query.skip(skip).limit(limit);

    // Execute query
    const documents = await query.lean().exec();

    // Get total count if requested
    let total = null;
    if (countTotal) {
      total = await Model.countDocuments(filter);
    }

    return {
      documents,
      count: documents.length,
      total,
      skip,
      limit,
      hasMore: countTotal && skip + limit < total,
    };
  }

  /**
   * Update: Update one or multiple documents
   */
  async _handleUpdate(Model, parameters) {
    const {
      filter = {},
      updateData = {},
      isMultiple = false,
      upsert = false,
      returnDocument = false,
    } = parameters;

    if (Object.keys(updateData).length === 0) {
      throw new Error('updateData parameter is required for update operation');
    }

    if (isMultiple) {
      // Update many
      const result = await Model.updateMany(filter, updateData, { upsert });
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedIds: result.upsertedIds,
      };
    } else {
      // Update one
      const result = returnDocument
        ? await Model.findOneAndUpdate(filter, updateData, {
            new: true,
            upsert,
          })
        : await Model.updateOne(filter, updateData, { upsert });

      if (returnDocument) {
        return {
          modifiedCount: result ? 1 : 0,
          document: result,
        };
      }

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    }
  }

  /**
   * Delete: Delete one or multiple documents
   */
  async _handleDelete(Model, parameters) {
    const { filter = {}, isMultiple = false } = parameters;

    if (isMultiple) {
      // Delete many
      const result = await Model.deleteMany(filter);
      return {
        deletedCount: result.deletedCount,
      };
    } else {
      // Delete one
      const result = await Model.deleteOne(filter);
      return {
        deletedCount: result.deletedCount,
      };
    }
  }

  /**
   * Aggregate: Execute aggregation pipeline
   */
  async _handleAggregate(Model, parameters) {
    const { pipeline = [] } = parameters;

    if (!Array.isArray(pipeline)) {
      throw new Error('pipeline must be an array');
    }

    if (pipeline.length === 0) {
      throw new Error('pipeline cannot be empty');
    }

    if (pipeline.length > 100) {
      throw new Error('pipeline cannot have more than 100 stages');
    }

    // Validate each stage
    for (const stage of pipeline) {
      if (typeof stage !== 'object' || stage === null) {
        throw new Error('Each pipeline stage must be an object');
      }
    }

    logger.debug(`Executing aggregation pipeline with ${pipeline.length} stages`);

    const results = await Model.aggregate(pipeline).exec();

    return {
      results,
      count: results.length,
    };
  }

  /**
   * Bulk: Execute bulkWrite operations
   */
  async _handleBulk(Model, parameters) {
    const { operations = [] } = parameters;

    if (!Array.isArray(operations)) {
      throw new Error('operations must be an array');
    }

    if (operations.length === 0) {
      throw new Error('operations array cannot be empty');
    }

    if (operations.length > 10000) {
      throw new Error('Cannot perform more than 10000 operations at once');
    }

    // Validate and transform operations
    const bulkOps = operations.map((op) => {
      if (
        !op.operationType ||
        !['insertOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(
          op.operationType
        )
      ) {
        throw new Error(
          `Invalid bulk operation type: ${op.operationType}. Must be one of: insertOne, updateOne, updateMany, deleteOne, deleteMany`
        );
      }

      return {
        [op.operationType]: op.data,
      };
    });

    logger.debug(`Executing bulk write with ${bulkOps.length} operations`);

    const result = await Model.bulkWrite(bulkOps);

    return {
      insertedCount: result.insertedCount,
      modifiedCount: result.modifiedCount,
      deletedCount: result.deletedCount,
      matchedCount: result.matchedCount,
      upsertedCount: result.upsertedCount,
    };
  }

  /**
   * Transaction: Execute multi-document transaction
   */
  async _handleTransaction(Model, parameters) {
    const { operations = [] } = parameters;

    if (!Array.isArray(operations)) {
      throw new Error('operations must be an array');
    }

    if (operations.length === 0) {
      throw new Error('operations array cannot be empty');
    }

    if (operations.length > 100) {
      throw new Error('Cannot execute more than 100 operations in a transaction');
    }

    const session = await this.mongooseConnection.startSession();
    session.startTransaction();

    try {
      const results = [];

      for (const op of operations) {
        const { operationType, collectionName, data } = op;

        const Model = this.mongooseConnection.model(collectionName);

        let result;
        switch (operationType.toLowerCase()) {
          case 'create':
            result = await Model.create([data], { session });
            results.push({ operationType, result });
            break;
          case 'update':
            result = await Model.findOneAndUpdate(data.filter, data.updateData, {
              new: true,
              session,
            });
            results.push({ operationType, result });
            break;
          case 'delete':
            result = await Model.deleteOne(data.filter, { session });
            results.push({ operationType, result });
            break;
          default:
            throw new Error(`Unsupported operation type in transaction: ${operationType}`);
        }
      }

      await session.commitTransaction();
      session.endSession();

      return {
        transactionId: session.id,
        operationsCount: operations.length,
        results,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Validate operation type
   */
  _isValidOperationType(operationType) {
    const validTypes = [
      'create',
      'read',
      'update',
      'delete',
      'aggregate',
      'bulk',
      'transaction',
    ];
    return validTypes.includes(operationType.toLowerCase());
  }

  /**
   * Validate collection name (prevent injection)
   */
  _validateCollectionName(collectionName) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('Collection name must be a non-empty string');
    }

    // Allow only alphanumeric, underscore, and hyphen
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(collectionName)) {
      throw new Error(
        'Invalid collection name. Must start with letter or underscore, contain only alphanumeric, underscore, and hyphen'
      );
    }

    if (collectionName.length > 255) {
      throw new Error('Collection name cannot exceed 255 characters');
    }
  }

  /**
   * Get error code for response
   */
  _getErrorCode(error) {
    if (error.name === 'ValidationError') {
      return 'VALIDATION_ERROR';
    }
    if (error.name === 'CastError') {
      return 'INVALID_DATA_TYPE';
    }
    if (error.code === 11000) {
      return 'DUPLICATE_KEY';
    }
    if (error.message.includes('not found')) {
      return 'NOT_FOUND';
    }
    return 'DATABASE_ERROR';
  }
}

module.exports = MongoDBOperationExecutor;
