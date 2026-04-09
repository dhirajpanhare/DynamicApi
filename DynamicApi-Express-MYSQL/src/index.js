/**
 * Dynamic API Express Application
 * Main entry point for the Express application
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');

// Import configuration
const swaggerSpec = require('./config/swagger');

// Import services
const DynamicApiService = require('./services/dynamicApiService');
const ProcedureMetadataExtractor = require('./services/procedureMetadataExtractor');
const TransactionExecutor = require('./services/transactionExecutor');
const { initializeEmailService } = require('./services/emailService');

// Import controllers
const DynamicApiController = require('./controllers/dynamicApiController');

// Import routes
const { registerApiRoutes } = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');

// Import middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Import utilities
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Body parser middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// CORS middleware - Allow only specific origins
const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000','http://localhost:5173', 'http://localhost:4200', 'http://localhost:8000'];

const corsOptions = {
    origin: corsOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
};

app.use(cors(corsOptions));
// Initialize email service
initializeEmailService();
// ============================================================================
// DATABASE CONNECTION POOLS
// ============================================================================

// Main database connection pool for procedure execution
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'DynamicApiDb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Separate connection pool for logging operations
const loggingConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0
});

// ============================================================================
// SERVICE AND CONTROLLER INITIALIZATION
// ============================================================================

// Initialize metadata extractor with database pool and logger
const procedureMetadataExtractor = new ProcedureMetadataExtractor(async () => pool, logger);

// Initialize transaction executor with database pool and logger
const transactionExecutor = new TransactionExecutor(async () => pool, logger);

// Initialize service with database pools, metadataExtractor and logger
const dynamicApiService = new DynamicApiService(pool, loggingConnection, logger, procedureMetadataExtractor);
dynamicApiService.transactionExecutor = transactionExecutor;

// Initialize controller with service
const dynamicApiController = new DynamicApiController(dynamicApiService);

// ============================================================================
// SWAGGER SETUP
// ============================================================================

app.use('/api/v1.0/docs', swaggerUi.serve);
app.get('/api/v1.0/docs', swaggerUi.setup(swaggerSpec, { 
    swaggerOptions: { url: '/swagger.json' } 
}));
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Redirect /docs to /api/v1.0/docs
app.get('/docs', (req, res) => {
    res.redirect('/api/v1.0/docs');
});

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// Create router instance
const apiRouter = express.Router();

// Register all API routes
registerApiRoutes(apiRouter, dynamicApiController);

// Mount auth routes
app.use('/api/v1.0/auth', authRoutes);

// Mount router
app.use(apiRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("");
    console.log("=".repeat(60));
    console.log("  Express Dynamic API - Development Server Started");
    console.log("=".repeat(60));
    console.log(`[STARTUP] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[STARTUP] Port: ${PORT}`);
    console.log(`[STARTUP] CORS Origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8000'}`);
    console.log("");
    console.log("[STARTUP] API Endpoints:");
    console.log(`  - Swagger UI: http://localhost:${PORT}/api/v1.0/docs`);
    console.log(`  - Health Check: http://localhost:${PORT}/health`);
    console.log(`  - API Endpoint: http://localhost:${PORT}/api/v1.0/DynamicApi/DynamicApiExecute`);
    console.log("");
    logger.info(`✓ Server running on port ${PORT}`);
    logger.info(`✓ Swagger documentation at http://localhost:${PORT}/api/v1.0/docs`);
    logger.info(`✓ Health check endpoint at http://localhost:${PORT}/health`);
    console.log("=".repeat(60) + "");
});

module.exports = app;
