const StoredProcedureExecutor = require('./storedProcedureExecutor');

class DynamicApiService {
    constructor(getPool, logger) {
        this.executor = new StoredProcedureExecutor(getPool, logger);
        this.getPool = getPool;
        this.logger = logger;
    }

    /**
     * Execute a stored procedure with execution logging
     * @param {string} procedureName - Name of the stored procedure
     * @param {string} parameters - Parameters as string (key=value|key=value)
     * @param {string} parameterSeparator - Separator between parameters (default: |)
     * @param {string} keyValueSeparator - Separator between key and value (default: =)
     * @param {string} userEmail - User email for audit (default: anonymous)
     * @returns {Promise<object>} - { status, message, data }
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
                message: error.message,
                executionTime,
                userEmail
            }).catch(err => {
                this.logger.error(`Failed to log execution: ${err.message}`);
            });

            // Return generic error message to client (don't expose details)
            return {
                status: false,
                message: 'An error occurred executing the procedure. Please contact support if the problem persists.',
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

            const pool = await this.getPool();
            const request = pool.request();

            request.input('ProcedureName', procedureName);
            request.input('Parameters', parameters);
            request.input('Status', status ? 1 : 0);
            request.input('Message', message ? message.substring(0, 500) : null);
            request.input('ExecutionTime', executionTime);
            request.input('UserEmail', userEmail);

            await request.query(`
                INSERT INTO ExecutionLogs
                    (ProcedureName, Parameters, Status, Message, ExecutionTime, UserEmail, CreatedAt)
                VALUES
                    (@ProcedureName, @Parameters, @Status, @Message, @ExecutionTime, @UserEmail, GETDATE())
            `);

            this.logger.debug(`Logged execution for procedure: ${procedureName}`);
        } catch (error) {
            // Log but don't fail the main operation if logging fails
            this.logger.error(`Failed to log execution: ${error.message}`);
        }
    }
}

module.exports = DynamicApiService;
