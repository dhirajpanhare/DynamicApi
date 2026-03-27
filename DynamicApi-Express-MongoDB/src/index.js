const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Logger utility
const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    debug: (msg) => console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`)
};

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamicapi';
mongoose.connect(mongoUri)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// ExecutionLog Schema
const executionLogSchema = new mongoose.Schema({
    procedureName: String,
    parameters: String,
    status: Boolean,
    message: String,
    executionTime: Number,
    createdAt: { type: Date, default: Date.now, index: true }
});

executionLogSchema.index({ procedureName: 1, createdAt: -1 });
executionLogSchema.index({ status: 1, createdAt: -1 });

const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);

// Mock procedure executor for MongoDB (since MongoDB doesn't have stored procedures)
async function executeProcedure(procedureName, parameters) {
    try {
        logger.info(`Executing procedure: ${procedureName}`);

        // Mock data - in real scenario, you'd fetch from database
        const mockData = {
            'GetProductById': [{ ProductId: 1, ProductName: 'Sample Product', Price: 99.99, Category: 'Electronics', CreatedAt: new Date() }],
            'GetAllProducts': [{ ProductId: 1, ProductName: 'Product 1', Price: 50 }, { ProductId: 2, ProductName: 'Product 2', Price: 75 }]
        };

        const data = mockData[procedureName] || [];

        // Log execution
        const executionLog = new ExecutionLog({
            procedureName,
            parameters,
            status: true,
            message: 'Success',
            executionTime: 10
        });

        await executionLog.save();

        return {
            success: true,
            message: 'Success',
            data: data
        };
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        return {
            success: false,
            message: `Error: ${error.message}`,
            data: null
        };
    }
}

// Parse parameters from string format
function parseParameters(paramString) {
    const params = {};
    if (!paramString) return params;
    
    const pairs = paramString.split('|');
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[key.trim()] = value.trim();
        }
    });
    
    return params;
}

// Routes
app.post('/api/v1.0/DynamicApi/DynamicApiExecute', async (req, res) => {
    try {
        const { stringOne, stringFour } = req.body;

        if (!stringFour) {
            return res.status(400).json({
                status: false,
                message: 'Procedure name is required',
                data: null
            });
        }

        const parameters = parseParameters(stringOne);
        const result = await executeProcedure(stringFour, parameters);

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        logger.error(error.message);
        res.status(500).json({
            status: false,
            message: 'Internal server error',
            data: null
        });
    }
});

// Get execution logs
app.get('/api/v1.0/DynamicApi/ExecutionLogs', async (req, res) => {
    try {
        const logs = await ExecutionLog.find().sort({ createdAt: -1 }).limit(50);
        res.json({
            status: true,
            message: 'Success',
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message,
            data: null
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
