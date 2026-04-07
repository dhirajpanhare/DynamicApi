const { sql } = require('../config/database');

class ProcedureMetadataExtractor {
    constructor(getPool, logger) {
        this.getPool = getPool;
        this.logger = logger;
    }

    /**
     * Extract parameter metadata for a stored procedure from MSSQL
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
     * Extract parameters from MSSQL INFORMATION_SCHEMA.PARAMETERS
     * @param {string} procedureName - Name of the procedure
     * @returns {Promise<Array>} - Array of parameter definitions
     */
    async extractProcedureParameters(procedureName) {
        try {
            const pool = await this.getPool();
            const request = pool.request();

            // MSSQL query to get procedure parameters
            const query = `
                SELECT 
                    PARAMETER_NAME,
                    DATA_TYPE,
                    IS_RESULT,
                    PARAMETER_MODE
                FROM INFORMATION_SCHEMA.PARAMETERS
                WHERE SPECIFIC_NAME = @procedureName
                AND PARAMETER_NAME <> ''  -- Exclude return value
                ORDER BY ORDINAL_POSITION
            `;

            request.input('procedureName', sql.VarChar, procedureName);
            const result = await request.query(query);

            return result.recordset.map(row => ({
                name: row.PARAMETER_NAME || '',
                type: row.DATA_TYPE || 'VARCHAR',
                isResult: row.IS_RESULT || false,
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

            const openAPIType = this.mapMSSQLToOpenAPIType(paramType);

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
     * Map MSSQL data types to OpenAPI types
     * @param {string} mssqlType - MSSQL data type
     * @returns {string} - OpenAPI type
     */
    mapMSSQLToOpenAPIType(mssqlType) {
        const typeMapping = {
            'INT': 'integer',
            'BIGINT': 'integer',
            'SMALLINT': 'integer',
            'TINYINT': 'integer',
            'DECIMAL': 'number',
            'NUMERIC': 'number',
            'FLOAT': 'number',
            'REAL': 'number',
            'VARCHAR': 'string',
            'CHAR': 'string',
            'NVARCHAR': 'string',
            'NCHAR': 'string',
            'TEXT': 'string',
            'NTEXT': 'string',
            'DATE': 'string',
            'DATETIME': 'string',
            'DATETIME2': 'string',
            'DATETIMEOFFSET': 'string',
            'TIME': 'string',
            'TIMESTAMP': 'string',
            'BIT': 'boolean'
        };

        return typeMapping[mssqlType] || 'string';
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
            const request = pool.request();

            const query = `
                SELECT ROUTINE_NAME
                FROM INFORMATION_SCHEMA.ROUTINES
                WHERE ROUTINE_TYPE = 'PROCEDURE'
                ORDER BY ROUTINE_NAME
            `;

            const result = await request.query(query);
            return result.recordset.map(row => row.ROUTINE_NAME);
        } catch (error) {
            this.logger.error(`Error listing procedures: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ProcedureMetadataExtractor;
