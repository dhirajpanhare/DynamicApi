/**
 * Dynamic Schema Manager
 * Auto-generates and registers flexible Mongoose schemas for any collection
 */

const mongoose = require('mongoose');
const logger = require('./logger');

class DynamicSchemaManager {
  constructor() {
    this.registeredSchemas = new Map();
  }

  /**
   * Get or create a flexible schema for a collection
   * @param {object} mongooseConnection - Mongoose connection instance
   * @param {string} collectionName - Name of the collection
   * @param {object} sampleData - Optional sample document to infer structure
   * @returns {object} Mongoose model
   */
  getOrCreateModel(mongooseConnection, collectionName, sampleData = null) {
    try {
      // Check if model already registered
      const cacheKey = `${mongooseConnection.name}:${collectionName}`;
      if (this.registeredSchemas.has(cacheKey)) {
        return mongooseConnection.model(collectionName);
      }

      // Check if model exists in connection
      try {
        return mongooseConnection.model(collectionName);
      } catch (error) {
        // Model doesn't exist, create it
        logger.info(`Creating dynamic schema for collection: ${collectionName}`);
      }

      // Create flexible schema that allows any fields
      const schemaDefinition = this._createFlexibleSchema(sampleData);
      const schema = new mongoose.Schema(schemaDefinition, {
        strict: false, // Allow any fields not defined in schema
        collection: collectionName,
        timestamps: true, // Auto-add createdAt and updatedAt
      });

      // Add useful indexes
      schema.index({ createdAt: -1 });
      schema.index({ updatedAt: -1 });

      // Register and cache the model
      const Model = mongooseConnection.model(collectionName, schema);
      this.registeredSchemas.set(cacheKey, Model);

      logger.info(`✅ Dynamic schema registered for collection: ${collectionName}`);
      return Model;
    } catch (error) {
      logger.error(`Error creating model for collection ${collectionName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a flexible schema based on sample data
   * @private
   * @param {object} sampleData - Sample document
   * @returns {object} Schema definition
   */
  _createFlexibleSchema(sampleData) {
    if (!sampleData || Object.keys(sampleData).length === 0) {
      // Return basic flexible schema
      return {
        _id: mongoose.Schema.Types.ObjectId,
      };
    }

    const schemaDefinition = {};

    // Infer types from sample data
    for (const [key, value] of Object.entries(sampleData)) {
      if (key === '_id' || key === 'id') continue; // Skip ID fields

      const type = this._inferType(value);
      schemaDefinition[key] = type;
    }

    return schemaDefinition;
  }

  /**
   * Infer Mongoose schema type from value
   * @private
   * @param {any} value - Value to infer type from
   * @returns {object} Mongoose type definition
   */
  _inferType(value) {
    if (value === null || value === undefined) {
      return { type: mongoose.Schema.Types.Mixed, default: null };
    }

    if (typeof value === 'string') {
      return { type: String, default: '' };
    }

    if (typeof value === 'number') {
      return { type: Number, default: 0 };
    }

    if (typeof value === 'boolean') {
      return { type: Boolean, default: false };
    }

    if (value instanceof Date) {
      return { type: Date, default: Date.now };
    }

    if (Array.isArray(value)) {
      return { type: [mongoose.Schema.Types.Mixed], default: [] };
    }

    if (typeof value === 'object') {
      return { type: mongoose.Schema.Types.Mixed, default: {} };
    }

    // Default to Mixed type
    return { type: mongoose.Schema.Types.Mixed };
  }

  /**
   * List all registered models for a connection
   * @param {object} mongooseConnection - Mongoose connection instance
   * @returns {array} Array of model names
   */
  getRegisteredModels(mongooseConnection) {
    return Object.keys(mongooseConnection.models);
  }

  /**
   * Check if model is registered
   * @param {object} mongooseConnection - Mongoose connection instance
   * @param {string} collectionName - Collection name
   * @returns {boolean} Whether model is registered
   */
  isModelRegistered(mongooseConnection, collectionName) {
    return !!mongooseConnection.models[collectionName];
  }
}

// Export singleton instance
module.exports = new DynamicSchemaManager();
