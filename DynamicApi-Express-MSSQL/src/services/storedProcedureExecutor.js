const { sql } = require('../config/database');

class StoredProcedureExecutor {
    constructor(getPool, logger) {
        this.getPool = getPool;
        this.logger = logger;
    }

    /**
     * Execute a stored procedure with parameters
     * @param {string} procedureName - Name of the stored procedure
     * @param {string} parametersString - Parameters in key=value format
     * @param {string} parameterSeparator - Separator between parameters (default: |)
     * @param {string} keyValueSeparator - Separator between key and value (default: =)
     * @returns {Promise<object>} - { success, message, data, executionTime }
     */
    async execute(procedureName, parametersString = '', parameterSeparator = '|', keyValueSeparator = '=') {
        const startTime = Date.now();
        try {
            const pool = await this.getPool();
            const request = pool.request();

            // Parse parameters
            const parameters = this.parseParameters(parametersString, parameterSeparator, keyValueSeparator);

            // Add each parameter to the MSSQL request
            for (const [key, value] of Object.entries(parameters)) {
                request.input(key, value);
            }

            this.logger.info(`Executing stored procedure: ${procedureName}`);
            this.logger.debug(`Parameters: ${JSON.stringify(Object.keys(parameters))}`);

            // Execute the stored procedure
            const result = await request.execute(procedureName);

            // result.recordset contains the first result set rows
            const data = result.recordset || [];
            const executionTime = Date.now() - startTime;

            this.logger.info(`Procedure ${procedureName} executed successfully in ${executionTime}ms`);

            return {
                success: true,
                message: 'Success',
                data: data,
                executionTime: executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`Error executing procedure ${procedureName}: ${error.message}`);
            return {
                success: false,
                message: `Error: ${error.message}`,
                data: null,
                executionTime: executionTime
            };
        }
    }

    /**
     * Parse parameters from string format with validation
     * @param {string} parametersString - Parameters string (e.g., "p_Id=1|p_Name=Test")
     * @param {string} parameterSeparator - Separator between parameters
     * @param {string} keyValueSeparator - Separator between key and value
     * @returns {object} - Parsed parameters as key-value pairs
     * @throws {Error} - If parameter format is invalid
     */
    parseParameters(parametersString, parameterSeparator = '|', keyValueSeparator = '=') {
        const parameters = {};

        if (!parametersString || typeof parametersString !== 'string') {
            return parameters;
        }

        try {
            const pairs = parametersString.split(parameterSeparator);

            for (const pair of pairs) {
                if (!pair.trim()) continue;

                const [key, ...valueParts] = pair.split(keyValueSeparator);

                if (key && valueParts.length > 0) {
                    const paramKey = key.trim();
                    const paramValue = valueParts.join(keyValueSeparator).trim();

                    // Validate parameter name format - alphanumeric, underscore, @ only
                    const paramNameRegex = /^[a-zA-Z_@][a-zA-Z0-9_]*$/;
                    if (!paramNameRegex.test(paramKey)) {
                        throw new Error(`Invalid parameter name format: ${paramKey}`);
                    }

                    // Prevent duplicate parameters
                    if (parameters.hasOwnProperty(paramKey)) {
                        throw new Error(`Duplicate parameter: ${paramKey}`);
                    }

                    parameters[paramKey] = paramValue;
                }
            }
        } catch (error) {
            throw new Error(`Error parsing parameters: ${error.message}`);
        }

        return parameters;
    }
}

module.exports = StoredProcedureExecutor;
