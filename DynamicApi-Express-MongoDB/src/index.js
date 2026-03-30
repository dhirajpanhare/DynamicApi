/**
 * Dynamic API Server - Express + MongoDB
 * Executes dynamic operations on MongoDB collections
 * Reference: DynamicApi-Django main application
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const logger = require('./utils/logger');
const { initializeController } = require('./controllers/dynamicApiController');
const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');
const loggingMiddleware = require('./middleware/loggingMiddleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamicapi';

// ============================================
// MIDDLEWARE
// ============================================

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS middleware
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:5000', 'http://localhost:8000'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging middleware
app.use(loggingMiddleware);

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dynamic API - MongoDB',
      version: '2.0.0',
      description: 'Universal MongoDB Operations API - Execute dynamic operations on any MongoDB collection via REST endpoints',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      schemas: {
        ExecuteOperationRequest: {
          type: 'object',
          properties: {
            operationType: {
              type: 'string',
              enum: ['create', 'read', 'update', 'delete', 'aggregate', 'bulk', 'transaction'],
              description: 'Type of MongoDB operation to execute',
            },
            collectionName: {
              type: 'string',
              description: 'Name of the MongoDB collection',
            },
            parameters: {
              type: 'object',
              description: 'Operation-specific parameters',
            },
          },
          required: ['operationType', 'collectionName'],
          example: {
            operationType: 'read',
            collectionName: 'users',
            parameters: {
              filter: { status: 'active' },
              skip: 0,
              limit: 10,
              countTotal: true,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              description: 'Operation success status',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              description: 'Operation result data',
            },
            metadata: {
              type: 'object',
              description: 'Operation metadata (duration, timestamp, etc)',
            },
          },
          example: {
            status: true,
            message: 'read operation completed successfully',
            data: {
              documents: [],
              count: 0,
              total: 0,
              skip: 0,
              limit: 10,
              hasMore: false,
            },
            metadata: {
              operationType: 'read',
              collectionName: 'users',
              duration: 42,
              timestamp: '2026-03-27T10:30:00Z',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Operations',
        description: 'Dynamic MongoDB operations',
      },
      {
        name: 'Collections',
        description: 'Collection metadata and schema',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================
// DATABASE CONNECTION
// ============================================

async function connectDatabase() {
  try {
    logger.info(`Connecting to MongoDB: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('✅ Connected to MongoDB successfully');

    // Initialize controller with mongoose connection
    initializeController(mongoose);

    return true;
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    return false;
  }
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    apiVersions: ['1.0', '2.0'],
    endpoints: {
      v1: '/api/v1.0/DynamicApi/DynamicApiExecute (legacy string-delimited format)',
      v2: '/api/v1.0/DynamicApi/Operations (new JSON format)',
      collections: '/api/v1.0/DynamicApi/Collections',
      schema: '/api/v1.0/DynamicApi/Collections/:collectionName/Schema',
      validate: '/api/v1.0/DynamicApi/ValidateOperation',
      docs: '/api/docs',
    },
  };

  res.status(200).json(healthStatus);
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'API is running',
    timestamp: new Date(),
  });
});

// API routes
app.use('/api/v1.0/DynamicApi', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Dynamic API - MongoDB',
    version: '2.0.0',
    description: 'Universal MongoDB Operations API',
    documentation: 'http://localhost:' + PORT + '/api/docs',
    endpoints: {
      'Execute Operation (Legacy)': 'POST /api/v1.0/DynamicApi/DynamicApiExecute',
      'Execute Operation (JSON)': 'POST /api/v1.0/DynamicApi/Operations',
      'Get Collections': 'GET /api/v1.0/DynamicApi/Collections',
      'Get Collection Schema': 'GET /api/v1.0/DynamicApi/Collections/:collectionName/Schema',
      'Validate Operation': 'POST /api/v1.0/DynamicApi/ValidateOperation',
      'Health Check': 'GET /health',
      'Swagger UI': 'GET /api/docs',
    },
  });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: `Route ${req.method} ${req.path} not found`,
    data: null,
  });
});

// Error handling middleware - must be last
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Connect to database first
    const dbConnected = await connectDatabase();

    if (!dbConnected) {
      logger.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      // Display startup banner
      console.log('\n╔════════════════════════════════════════════════════╗');
      console.log('║                                                    ║');
      console.log('║     ✅ Dynamic API Server (MongoDB) Started!      ║');
      console.log('║                                                    ║');
      console.log('╠════════════════════════════════════════════════════╣');
      console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(42)}║`);
      console.log(`║  Port: ${PORT.toString().padEnd(49)}║`);
      console.log(`║  MongoDB: ${MONGODB_URI.replace(/:[^:]*@/, ':***@').substring(0, 42).padEnd(42)}║`);
      console.log('╠════════════════════════════════════════════════════╣');
      console.log(`║  📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`║  🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`║  🌐 Server Root: http://localhost:${PORT}/`);
      console.log('╠════════════════════════════════════════════════════╣');
      console.log('║  Available Endpoints:                              ║');
      console.log('║  • POST   /api/v1.0/DynamicApi/DynamicApiExecute  ║');
      console.log('║  • POST   /api/v1.0/DynamicApi/Operations         ║');
      console.log('║  • GET    /api/v1.0/DynamicApi/Collections        ║');
      console.log('║  • GET    /api/v1.0/DynamicApi/Schema/:collection ║');
      console.log('║  • POST   /api/v1.0/DynamicApi/ValidateOperation  ║');
      console.log('║                                                    ║');
      console.log('╠════════════════════════════════════════════════════╣');
      console.log('║  CORS Origins Allowed:                             ║');
      corsOrigins.forEach((origin, index) => {
        const padding = ' '.repeat(Math.max(0, 29 - origin.length));
        const isLast = index === corsOrigins.length - 1;
        const corner = isLast ? '╚' : '║';
        console.log(`║  • ${origin}${padding}${corner}`);
      });
      if (corsOrigins.length === 0) {
        console.log('║  None configured (CORS disabled)                   ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
      } else {
        console.log('╚════════════════════════════════════════════════════╝\n');
      }

      logger.info('🎉 Server ready to accept requests!');
    });
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

module.exports = app;
