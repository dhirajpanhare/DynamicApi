const StoredProcedureExecutor = require('./storedProcedureExecutor');

class DynamicApiService {
    constructor(pool, dbConnection, logger, metadataExtractor = null) {
        this.executor = new StoredProcedureExecutor(pool, logger);
        this.dbConnection = dbConnection;
        this.logger = logger;
        this.metadataExtractor = metadataExtractor;
    }

    /**
     * Execute a stored procedure with execution logging
     * @param {string} procedureName - Name of the stored procedure
     * @param {string} parameters - Parameters as string (key=value|key=value)
     * @param {string} parameterSeparator - Separator between parameters (default: |)
     * @param {string} keyValueSeparator - Separator between key and value (default: =)
     * @param {string} userEmail - User email for audit (default: anonymous)
     * @returns {Promise<object>} - { status, message, executionTime, cached, data }
     */
    async executeProcedureAsync(
        procedureName,
        parameters = '',
        parameterSeparator = '|',
        keyValueSeparator = '=',
        userEmail = 'anonymous'
    ) {
        const startTime = Date.now();

        try {
            this.logger.info(`Executing procedure: ${procedureName}`);

            // Execute the stored procedure
            const result = await this.executor.execute(
                procedureName,
                parameters,
                parameterSeparator,
                keyValueSeparator
            );

            const executionTime = Date.now() - startTime;

            // Log execution to database (non-blocking)
            this.logExecution({
                procedureName,
                parameters,
                status: result.success,
                message: result.message,
                executionTime,
                userEmail
            }).catch(err => {
                this.logger.error(`Failed to log execution: ${err.message}`);
            });

            this.logger.info(`Procedure ${procedureName} - Success: ${result.success} - Time: ${executionTime}ms`);

            return {
                status: result.success,
                message: result.message,
                executionTime: executionTime,
                cached: false,
                data: result.data || []
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Log full error server-side for debugging
            this.logger.error(`Error executing procedure ${procedureName}: ${error.message}`, error);

            // Log failed execution (non-blocking)
            this.logExecution({
                procedureName,
                parameters,
                status: false,
                message: error.message,  // Store full error for logs
                executionTime,
                userEmail
            }).catch(err => {
                this.logger.error(`Failed to log execution: ${err.message}`);
            });

            // Return generic error message to client (don't expose details)
            return {
                status: false,
                message: 'An error occurred executing the procedure. Please contact support if the problem persists.',
                executionTime: executionTime,
                cached: false,
                data: []
            };
        }
    }

    /**
     * Log execution to the ExecutionLogs table
     * @param {object} executionLog - Log details
     */
    async logExecution(executionLog) {
        try {
            const {
                procedureName,
                parameters,
                status,
                message,
                executionTime,
                userEmail = 'anonymous'
            } = executionLog;

            const query = `
                INSERT INTO ExecutionLogs 
                (ProcedureName, Parameters, Status, Message, ExecutionTime, UserEmail, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

            const values = [procedureName, parameters, status, message, executionTime, userEmail];

            await this.dbConnection.query(query, values);

            this.logger.debug(`Logged execution for procedure: ${procedureName}`);
        } catch (error) {
            // Log but don't fail the main operation if logging fails
            this.logger.error(`Failed to log execution: ${error.message}`);
        }
    }
}

module.exports = DynamicApiService;
