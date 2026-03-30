/**
 * Operation Log Model
 * Tracks all operations executed on MongoDB collections
 */

const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema(
  {
    operationType: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'aggregate', 'bulk', 'transaction'],
      index: true,
    },
    collectionName: {
      type: String,
      required: true,
      index: true,
    },
    parameters: {
      type: String, // Stored as JSON string for flexibility
      default: '',
    },
    userEmail: {
      type: String,
      default: 'anonymous',
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // Duration in milliseconds
      required: true,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    errorCode: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      // Auto-delete logs older than 90 days
      expires: 7776000, // 90 days in seconds
    },
  },
  {
    timestamps: true,
  }
);

// Create index for querying logs by date range and user
operationLogSchema.index({ createdAt: -1, userEmail: 1 });
operationLogSchema.index({ success: 1, createdAt: -1 });

// Create text index for searching messages
operationLogSchema.index({ message: 'text', collectionName: 1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);
