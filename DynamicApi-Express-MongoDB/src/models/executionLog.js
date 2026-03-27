const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema({
    procedureName: String,
    parameters: String,
    status: Boolean,
    message: String,
    executionTime: Number,
    userEmail: { type: String, default: 'anonymous' },
    createdAt: { type: Date, default: Date.now, index: true }
});

executionLogSchema.index({ procedureName: 1, createdAt: -1 });
executionLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ExecutionLog', executionLogSchema);
