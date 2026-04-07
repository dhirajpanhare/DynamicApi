const logger = require('../utils/logger');

/**
 * MongoDB Transaction Executor
 * Executes multiple operations within a MongoDB transaction session
 * All operations succeed or all rollback on failure
 */
class MongoDBTransactionExecutor {
    constructor(mongooseConnection) {
        this.mongooseConnection = mongooseConnection;
        this.operationExecutor = null; // Will be set by caller
    }

    /**
     * Set the MongoDB operation executor
     * @param {MongoDBOperationExecutor} executor - The operation executor instance
     */
    setOperationExecutor(executor) {
        this.operationExecutor = executor;
    }

    /**
     * Execute multiple MongoDB operations within a transaction
     * All operations succeed or all rollback on failure
     * 
     * @param {Array} operations - Array of operation objects:
     *   { operationType, collectionName, parameters }
     *   operationType: 'create', 'read', 'update', 'delete', 'aggregate', 'bulk'
     *   collectionName: Name of the MongoDB collection
     *   parameters: Operation parameters (query, update, options, etc.)
     * @param {string} userEmail - Email of user executing transaction (optional)
     * @returns {Promise<object>} - { success, message, data, executionTime }
     */
    async execute(operations, userEmail = null) {
        const startTime = Date.now();

        if (!Array.isArray(operations) || operations.length === 0) {
            return {
                success: false,
                message: 'Operations array is required and must not be empty',
                data: {
                    operationCount: 0,
                    successfulOperations: 0,
                    failedOperations: 0,
                    operations: []
                },
                executionTime: Date.now() - startTime
            };
        }

        // Check if operation executor is set
        if (!this.operationExecutor) {
            return {
                success: false,
                message: 'Operation executor not initialized',
                data: {
                    operationCount: operations.length,
                    successfulOperations: 0,
                    failedOperations: operations.length,
                    operations: []
                },
                executionTime: Date.now() - startTime
            };
        }

        let session = null;
        let successfulOperations = 0;
        let failedOperations = 0;
        const operationResults = [];

        try {
            // Start a new MongoDB session
            session = await this.mongooseConnection.startSession();

            // Start the transaction with this session
            await session.withTransaction(async () => {
                // Execute each operation within the transaction
                for (let idx = 0; idx < operations.length; idx++) {
                    const operation = operations[idx];
                    const operationStartTime = Date.now();

                    try {
                        const operationType = operation.operationType || '';
                        const collectionName = operation.collectionName || '';
                        const parameters = operation.parameters || {};

                        // Validate operation
                        if (!operationType || typeof operationType !== 'string' || operationType.trim() === '') {
                            throw new Error('Operation type is required');
                        }

                        if (!collectionName || typeof collectionName !== 'string' || collectionName.trim() === '') {
                            throw new Error('Collection name is required');
                        }

                        // Validate collection name (alphanumeric and underscore only)
                        const collNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
                        if (!collNameRegex.test(collectionName.trim())) {
                            throw new Error('Invalid collection name format');
                        }

                        logger.debug(`Executing operation ${idx + 1}: ${operationType} on ${collectionName}`);

                        // Execute the operation
                        const result = await this.operationExecutor.execute(
                            operationType.trim(),
                            collectionName.trim(),
                            parameters,
                            userEmail || 'anonymous',
                            session // Pass session for transactional execution
                        );

                        const operationTime = Date.now() - operationStartTime;

                        operationResults.push({
                            operationIndex: idx,
                            operationType: operationType.trim(),
                            collectionName: collectionName.trim(),
                            success: result.success,
                            message: result.message,
                            executionTime: operationTime,
                            result: result.data
                        });

                        if (result.success) {
                            successfulOperations++;
                            logger.debug(`Operation ${idx + 1} completed successfully in ${operationTime}ms`);
                        } else {
                            throw new Error(result.message || `Operation ${idx} failed`);
                        }

                    } catch (operationError) {
                        const operationTime = Date.now() - operationStartTime;

                        logger.error(`Operation ${idx + 1} failed: ${operationError.message}`);

                        operationResults.push({
                            operationIndex: idx,
                            operationType: operation.operationType || 'Unknown',
                            collectionName: operation.collectionName || 'Unknown',
                            success: false,
                            message: `Operation execution failed: ${operationError.message}`,
                            executionTime: operationTime,
                            result: null
                        });

                        failedOperations++;

                        // Throw error to trigger transaction rollback
                        throw new Error(`Transaction failed at operation ${idx}: ${operationError.message}`);
                    }
                }
            }, {
                // Transaction options
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary',
                maxCommitTimeMS: 10000 // 10 second timeout for transaction commit
            });

            const totalTime = Date.now() - startTime;

            logger.info('MongoDB transaction committed successfully');

            return {
                success: true,
                message: 'All operations completed successfully',
                data: {
                    operationCount: operations.length,
                    successfulOperations: successfulOperations,
                    failedOperations: failedOperations,
                    operations: operationResults
                },
                executionTime: totalTime
            };

        } catch (transactionError) {
            logger.error(`Transaction error: ${transactionError.message}`);

            const totalTime = Date.now() - startTime;

            // If we have results before the error, include them
            if (operationResults.length > 0) {
                return {
                    success: false,
                    message: `Transaction rolled back: ${transactionError.message}`,
                    data: {
                        operationCount: operations.length,
                        successfulOperations: successfulOperations,
                        failedOperations: failedOperations + (operations.length - successfulOperations - failedOperations),
                        operations: operationResults
                    },
                    executionTime: totalTime
                };
            }

            return {
                success: false,
                message: `Transaction execution error: ${transactionError.message}`,
                data: {
                    operationCount: operations.length,
                    successfulOperations: 0,
                    failedOperations: operations.length,
                    operations: operationResults
                },
                executionTime: totalTime
            };

        } finally {
            // Always end the session
            if (session) {
                try {
                    await session.endSession();
                    logger.debug('MongoDB session ended');
                } catch (sessionError) {
                    logger.error(`Error ending session: ${sessionError.message}`);
                }
            }
        }
    }
}

module.exports = MongoDBTransactionExecutor;
