class ProcedureMetadataExtractor {
    constructor(getPool, logger) {
        this.getPool = getPool;
        this.logger = logger;
    }

    /**
     * Extract parameter metadata for a stored procedure from MySQL
     * @param {string} procedureName - Name of the stored procedure
     * @returns {Promise<object>} - { procedureName, parameters, swaggerSchema }
     */
    async extractMetadata(procedureName) {
        try {
            if (!procedureName || typeof procedureName !== 'string') {
                throw new Error('Procedure name is required and must be a string');
            }

            const parameters = await this.extractProcedureParameters(procedureName);
            const swaggerSchema = this.generateSwaggerSchema(procedureName, parameters);

            return {
                procedureName,
                parameters,
                swaggerSchema
            };
        } catch (error) {
            this.logger.error(`Error extracting metadata for ${procedureName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extract parameters from MySQL information_schema.PARAMETERS
     * @param {string} procedureName - Name of the procedure
     * @returns {Promise<Array>} - Array of parameter definitions
     */
    async extractProcedureParameters(procedureName) {
        try {
            const pool = await this.getPool();
            
            // MySQL query to get procedure parameters
            const query = `
                SELECT 
                    PARAMETER_NAME,
                    PARAMETER_TYPE,
                    ORDINAL_POSITION,
                    PARAMETER_MODE
                FROM information_schema.PARAMETERS
                WHERE SPECIFIC_NAME = ?
                ORDER BY ORDINAL_POSITION
            `;

            const [rows] = await pool.query(query, [procedureName]);

            return rows.map(row => ({
                name: row.PARAMETER_NAME || '',
                type: row.PARAMETER_TYPE || 'VARCHAR',
                position: row.ORDINAL_POSITION || 0,
                mode: row.PARAMETER_MODE || 'IN'
            }));
        } catch (error) {
            this.logger.error(`Error extracting parameters: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate OpenAPI/Swagger schema for the procedure
     * @param {string} procedureName - Name of the procedure
     * @param {Array} parameters - Array of parameter definitions
     * @returns {object} - Swagger schema
     */
    generateSwaggerSchema(procedureName, parameters) {
        const parameterProperties = {};
        const requiredParams = [];

        for (const param of parameters) {
            const paramName = param.name || '';
            const paramType = (param.type || 'VARCHAR').toUpperCase();
            const paramMode = (param.mode || 'IN').toUpperCase();

            const openAPIType = this.mapMySQLToOpenAPIType(paramType);

            parameterProperties[paramName] = {
                type: openAPIType,
                description: `${paramMode} parameter`,
                example: this.getExampleValue(openAPIType)
            };

            // Only include input parameters in required list
            if (paramMode !== 'OUT') {
                requiredParams.push(paramName);
            }
        }

        return {
            type: 'object',
            properties: parameterProperties,
            required: requiredParams
        };
    }

    /**
     * Map MySQL data types to OpenAPI types
     * @param {string} mysqlType - MySQL data type
     * @returns {string} - OpenAPI type
     */
    mapMySQLToOpenAPIType(mysqlType) {
        const typeMapping = {
            'INT': 'integer',
            'BIGINT': 'integer',
            'SMALLINT': 'integer',
            'TINYINT': 'integer',
            'DECIMAL': 'number',
            'NUMERIC': 'number',
            'FLOAT': 'number',
            'DOUBLE': 'number',
            'VARCHAR': 'string',
            'CHAR': 'string',
            'TEXT': 'string',
            'LONGTEXT': 'string',
            'DATE': 'string',
            'DATETIME': 'string',
            'TIMESTAMP': 'string',
            'TIME': 'string',
            'BOOLEAN': 'boolean'
        };

        return typeMapping[mysqlType] || 'string';
    }

    /**
     * Get example value for OpenAPI type
     * @param {string} openAPIType - OpenAPI type
     * @returns {any} - Example value
     */
    getExampleValue(openAPIType) {
        const examples = {
            'integer': 1,
            'number': 1.5,
            'string': 'example',
            'boolean': true
        };

        return examples[openAPIType] || 'example';
    }

    /**
     * List all stored procedures in the database
     * @returns {Promise<Array>} - Array of procedure names
     */
    async listProcedures() {
        try {
            const pool = await this.getPool();

            const query = `
                SELECT ROUTINE_NAME
                FROM information_schema.ROUTINES
                WHERE ROUTINE_SCHEMA = DATABASE()
                AND ROUTINE_TYPE = 'PROCEDURE'
                ORDER BY ROUTINE_NAME
            `;

            const [rows] = await pool.query(query);
            return rows.map(row => row.ROUTINE_NAME);
        } catch (error) {
            this.logger.error(`Error listing procedures: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ProcedureMetadataExtractor;
