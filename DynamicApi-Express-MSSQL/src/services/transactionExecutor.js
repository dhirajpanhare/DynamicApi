const { ConnectionPool } = require('mssql');

class TransactionExecutor {
    constructor(getPool, logger) {
        this.getPool = getPool;
        this.logger = logger;
    }

    /**
     * Execute multiple stored procedures within a transaction
     * All procedures succeed or all rollback on failure
     * 
     * @param {Array} operations - Array of operation objects:
     *   { procedureName, stringOne, stringTwo, stringThree }
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

        let connection = null;
        let successfulOperations = 0;
        let failedOperations = 0;
        const operationResults = [];

        try {
            const pool = await this.getPool();
            connection = await pool.connect();

            // Start transaction with ReadCommitted isolation level
            const transaction = new ConnectionPool().transaction();
            await connection.transaction().begin();

            this.logger.info(`Starting transaction with ${operations.length} operations`);

            // Execute each operation
            for (let idx = 0; idx < operations.length; idx++) {
                const operation = operations[idx];
                const operationStartTime = Date.now();

                try {
                    const procedureName = operation.procedureName || '';
                    const stringOne = operation.stringOne || '';
                    const stringTwo = operation.stringTwo || '';
                    const stringThree = operation.stringThree || '';

                    // Validate operation
                    if (!procedureName || typeof procedureName !== 'string' || procedureName.trim() === '') {
                        throw new Error('Procedure name is required');
                    }

                    // Procedure name validation (alphanumeric and underscore only)
                    const procNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
                    if (!procNameRegex.test(procedureName.trim())) {
                        throw new Error('Invalid procedure name format');
                    }

                    // Parse procedure name if it contains schema prefix
                    let parsedProcName = procedureName.trim();
                    if (parsedProcName.includes('.')) {
                        parsedProcName = parsedProcName.split('.')[1];
                    }

                    this.logger.debug(`Executing operation ${idx + 1}: ${parsedProcName}`);

                    // Create request for this procedure
                    const request = connection.request();

                    // Add transaction to request
                    request.transaction = await connection.transaction();

                    // Add parameters
                    request.input('stringOne', stringOne);
                    request.input('stringTwo', stringTwo);
                    request.input('stringThree', stringThree);

                    // Execute the stored procedure
                    const result = await request.execute(parsedProcName);

                    const operationTime = Date.now() - operationStartTime;
                    const resultData = result.recordset || [];

                    operationResults.push({
                        operationIndex: idx,
                        procedureName: parsedProcName,
                        success: true,
                        message: 'Procedure executed successfully',
                        executionTime: operationTime,
                        result: resultData
                    });

                    successfulOperations++;
                    this.logger.debug(`Operation ${idx + 1} completed successfully in ${operationTime}ms`);

                } catch (operationError) {
                    const operationTime = Date.now() - operationStartTime;

                    this.logger.error(`Operation ${idx + 1} failed: ${operationError.message}`);

                    operationResults.push({
                        operationIndex: idx,
                        procedureName: operation.procedureName || 'Unknown',
                        success: false,
                        message: `Procedure execution failed: ${operationError.message}`,
                        executionTime: operationTime,
                        result: null
                    });

                    failedOperations++;

                    // Rollback entire transaction on first failure
                    try {
                        await connection.transaction().rollback();
                        this.logger.error(`Transaction rolled back due to operation ${idx + 1} failure`);
                    } catch (rollbackError) {
                        this.logger.error(`Error rolling back transaction: ${rollbackError.message}`);
                    }

                    const totalTime = Date.now() - startTime;

                    return {
                        success: false,
                        message: `Transaction failed: Operation ${idx} failed. All operations rolled back.`,
                        data: {
                            operationCount: operations.length,
                            successfulOperations: successfulOperations,
                            failedOperations: failedOperations,
                            operations: operationResults
                        },
                        executionTime: totalTime
                    };
                }
            }

            // All operations succeeded, commit transaction
            try {
                await connection.transaction().commit();
                this.logger.info('Transaction committed successfully');
            } catch (commitError) {
                this.logger.error(`Error committing transaction: ${commitError.message}`);

                try {
                    await connection.transaction().rollback();
                } catch (rollbackError) {
                    this.logger.error(`Error rolling back on commit failure: ${rollbackError.message}`);
                }

                const totalTime = Date.now() - startTime;

                return {
                    success: false,
                    message: `Error committing transaction: ${commitError.message}`,
                    data: {
                        operationCount: operations.length,
                        successfulOperations: successfulOperations,
                        failedOperations: failedOperations,
                        operations: operationResults
                    },
                    executionTime: totalTime
                };
            }

            const totalTime = Date.now() - startTime;

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

        } catch (error) {
            this.logger.error(`Transaction execution error: ${error.message}`);

            // Try to rollback if connection exists
            if (connection) {
                try {
                    await connection.transaction().rollback();
                } catch (rollbackError) {
                    this.logger.error(`Error rolling back on exception: ${rollbackError.message}`);
                }
            }

            const totalTime = Date.now() - startTime;

            return {
                success: false,
                message: `Transaction execution error: ${error.message}`,
                data: {
                    operationCount: operations.length,
                    successfulOperations: successfulOperations,
                    failedOperations: failedOperations,
                    operations: operationResults
                },
                executionTime: totalTime
            };

        } finally {
            // Clean up connection (disconnect it from pool)
            if (connection) {
                try {
                    await connection.close();
                } catch (closeError) {
                    this.logger.error(`Error closing connection: ${closeError.message}`);
                }
            }
        }
    }
}

module.exports = TransactionExecutor;
