const mysql = require('mysql2/promise');

class StoredProcedureExecutor {
    constructor(pool, logger) {
        this.pool = pool;
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
        let connection;
        const startTime = Date.now();
        try {
            connection = await this.pool.getConnection();

            // Parse parameters
            const parameters = this.parseParameters(parametersString, parameterSeparator, keyValueSeparator);

            // Build the procedure call with proper parameter handling
            const paramNames = Object.keys(parameters);
            const placeholders = paramNames.map(() => '?').join(',');
            const paramValues = paramNames.map(key => parameters[key]);
            
            const query = paramNames.length > 0 
                ? `CALL ${procedureName}(${placeholders})`
                : `CALL ${procedureName}()`;

            this.logger.info(`Executing stored procedure: ${procedureName}`);
            this.logger.debug(`Query: ${query}, Parameters: ${JSON.stringify(paramValues)}`);

            // Execute the procedure
            const [results] = await connection.query(query, paramValues);

            // Handle the result set
            // MySQL returns: [actual_rows[], metadata_object]
            // We only want the actual rows from the first result set
            let data = [];
            if (Array.isArray(results) && results.length > 0) {
                // For stored procedures, MySQL returns an array of result sets
                // The first element is the actual data, rest are metadata
                // Extract just the rows from the first result set
                data = Array.isArray(results[0]) ? results[0] : results;
            }

            const executionTime = Date.now() - startTime;
            this.logger.info(`Procedure ${procedureName} executed successfully in ${executeTime}ms`);

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
        } finally {
            if (connection) {
                await connection.release();
            }
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
