const logger = require('../utils/logger');
const dynamicSchemaManager = require('../utils/dynamicSchemaManager');

class ProcedureMetadataExtractor {
    constructor(mongooseConnection, logger) {
        this.mongooseConnection = mongooseConnection;
        this.logger = logger;
    }

    /**
     * Extract metadata for a MongoDB collection
     * For MongoDB, this extracts schema information from a sample document in the collection
     * @param {string} collectionName - Name of the MongoDB collection
     * @returns {Promise<object>} - { collectionName, parameters (schema fields), swaggerSchema }
     */
    async extractMetadata(collectionName) {
        try {
            if (!collectionName || typeof collectionName !== 'string') {
                throw new Error('Collection name is required and must be a string');
            }

            // Get collection schema from sample document
            const schemaFields = await this.extractCollectionSchema(collectionName);
            const swaggerSchema = this.generateSwaggerSchema(collectionName, schemaFields);

            return {
                collectionName,
                parameters: schemaFields,
                swaggerSchema
            };
        } catch (error) {
            this.logger.error(`Error extracting metadata for ${collectionName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extract schema information from a MongoDB collection
     * @param {string} collectionName - Name of the collection
     * @returns {Promise<Array>} - Array of field definitions with types
     */
    async extractCollectionSchema(collectionName) {
        try {
            // Get the native MongoDB collection
            const collection = this.mongooseConnection.collection(collectionName);
            
            // Find first document to infer schema
            const sampleDoc = await collection.findOne();

            if (!sampleDoc) {
                // If collection is empty, return empty schema
                return [];
            }

            // Extract fields and types from sample document
            const fields = [];
            this._extractFieldsRecursive(sampleDoc, '', fields);

            return fields;
        } catch (error) {
            this.logger.error(`Error extracting collection schema: ${error.message}`);
            throw error;
        }
    }

    /**
     * Recursively extract fields and their types from a document
     * @param {object} doc - Document to extract from
     * @param {string} prefix - Field prefix for nested fields
     * @param {Array} fields - Array to accumulate fields
     */
    _extractFieldsRecursive(doc, prefix = '', fields = []) {
        for (const [key, value] of Object.entries(doc)) {
            if (key === '_id' || key === '__v') continue; // Skip MongoDB metadata fields

            const fieldName = prefix ? `${prefix}.${key}` : key;
            const fieldType = this._inferType(value);

            fields.push({
                name: fieldName,
                type: fieldType,
                isNullable: value === null || value === undefined,
                mode: 'IN' // MongoDB documents are input parameters
            });

            // Recursively handle nested objects
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
                this._extractFieldsRecursive(value, fieldName, fields);
            }
        }

        return fields;
    }

    /**
     * Infer MongoDB field type
     * @param {any} value - Field value
     * @returns {string} - MongoDB type name
     */
    _inferType(value) {
        if (value === null || value === undefined) return 'Mixed';
        if (typeof value === 'string') return 'String';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'Int32' : 'Double';
        }
        if (typeof value === 'boolean') return 'Boolean';
        if (value instanceof Date) return 'Date';
        if (Array.isArray(value)) return 'Array';
        if (typeof value === 'object') return 'Object';
        return 'Mixed';
    }

    /**
     * Generate OpenAPI/Swagger schema for the collection
     * @param {string} collectionName - Name of the collection
     * @param {Array} schemaFields - Array of field definitions
     * @returns {object} - Swagger schema
     */
    generateSwaggerSchema(collectionName, schemaFields) {
        const parameterProperties = {};
        const requiredParams = [];

        for (const field of schemaFields) {
            const fieldName = field.name;
            const mongoType = field.type;

            const openAPIType = this.mapMongoToOpenAPIType(mongoType);

            parameterProperties[fieldName] = {
                type: openAPIType,
                description: `MongoDB ${mongoType} field`,
                example: this.getExampleValue(openAPIType)
            };

            // Consider non-nullable fields as required
            if (!field.isNullable) {
                requiredParams.push(fieldName);
            }
        }

        return {
            type: 'object',
            properties: parameterProperties,
            required: requiredParams
        };
    }

    /**
     * Map MongoDB data types to OpenAPI types
     * @param {string} mongoType - MongoDB type name
     * @returns {string} - OpenAPI type
     */
    mapMongoToOpenAPIType(mongoType) {
        const typeMapping = {
            'String': 'string',
            'Int32': 'integer',
            'Int64': 'integer',
            'Double': 'number',
            'Decimal': 'number',
            'Boolean': 'boolean',
            'Date': 'string',
            'Object': 'object',
            'Array': 'array',
            'Mixed': 'string'
        };

        return typeMapping[mongoType] || 'string';
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
            'boolean': true,
            'object': {},
            'array': []
        };

        return examples[openAPIType] || 'example';
    }

    /**
     * List all collections in the MongoDB database
     * @returns {Promise<Array>} - Array of collection names
     */
    async listProcedures() {
        try {
            const collections = await this.mongooseConnection.db.listCollections().toArray();
            return collections
                .map(col => col.name)
                .filter(name => !name.startsWith('system.')) // Exclude system collections
                .sort();
        } catch (error) {
            this.logger.error(`Error listing collections: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ProcedureMetadataExtractor;
