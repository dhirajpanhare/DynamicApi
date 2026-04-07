/**
 * API Routes for Dynamic MongoDB Operations
 * Routes for executing operations and managing collections
 */

const express = require('express');
const router = express.Router();
const {
  executeOperation,
  getAvailableCollections,
  getCollectionSchema,
  validateOperation,
  getCollectionMetadata,
  listProcedures,
  executeTransaction,
} = require('../controllers/dynamicApiController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1.0/DynamicApi/DynamicApiExecute:
 *   post:
 *     tags:
 *       - Operations
 *     summary: Execute MongoDB Operation (Legacy Format)
 *     description: Execute operation with string-delimited parameters (backward compatible)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stringOne:
 *                 type: string
 *                 description: Delimited parameters
 *               stringTwo:
 *                 type: string
 *                 default: "|"
 *               stringThree:
 *                 type: string
 *                 default: "="
 *               stringFour:
 *                 type: string
 *                 description: Collection name
 *             required:
 *               - stringOne
 *               - stringFour
 *     responses:
 *       200:
 *         description: Operation executed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/DynamicApiExecute', authenticate, executeOperation);

/**
 * @swagger
 * /api/v1.0/DynamicApi/Operations:
 *   post:
 *     tags:
 *       - Operations
 *     summary: Execute MongoDB Operation (JSON Format)
 *     description: Execute operation with JSON parameters (recommended)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExecuteOperationRequest'
 *     responses:
 *       200:
 *         description: Operation executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/Operations', authenticate, executeOperation);

/**
 * @swagger
 * /api/v1.0/DynamicApi/Collections:
 *   get:
 *     tags:
 *       - Collections
 *     summary: Get Available Collections
 *     description: Retrieve list of all MongoDB collections in the database
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     collections:
 *                       type: array
 *                       items:
 *                         type: string
 *                     count:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/Collections', getAvailableCollections);

/**
 * @swagger
 * /api/v1.0/DynamicApi/Collections/{collectionName}/Schema:
 *   get:
 *     tags:
 *       - Collections
 *     summary: Get Collection Schema
 *     description: Retrieve schema information for a specific collection
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *     responses:
 *       200:
 *         description: Schema retrieved successfully
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.get('/Collections/:collectionName/Schema', getCollectionSchema);

/**
 * @swagger
 * /api/v1.0/DynamicApi/ValidateOperation:
 *   post:
 *     tags:
 *       - Operations
 *     summary: Validate Operation
 *     description: Validate operation parameters without executing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operationType:
 *                 type: string
 *               collectionName:
 *                 type: string
 *               parameters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Validation successful
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Server error
 */
router.post('/ValidateOperation', validateOperation);

/**
 * @swagger
 * /api/v1.0/DynamicApi/metadata/{collectionName}:
 *   get:
 *     tags:
 *       - Metadata
 *     summary: Get Collection Metadata
 *     description: Retrieve parameter metadata and Swagger schema for a MongoDB collection
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the MongoDB collection
 *     responses:
 *       200:
 *         description: Metadata retrieved successfully
 *       400:
 *         description: Invalid collection name
 *       500:
 *         description: Server error
 */
router.get('/metadata/:collectionName', getCollectionMetadata);

/**
 * @swagger
 * /api/v1.0/DynamicApi/procedures:
 *   get:
 *     tags:
 *       - Metadata
 *     summary: List All Collections
 *     description: Get a list of all available MongoDB collections (equivalent to procedures)
 *     responses:
 *       200:
 *         description: Collections listed successfully
 *       500:
 *         description: Server error
 */
router.get('/procedures', listProcedures);

/**
 * @swagger
 * /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute:
 *   post:
 *     tags:
 *       - Transaction API
 *     summary: Execute Multiple Operations in a Transaction
 *     description: Execute multiple MongoDB operations atomically - all succeed or all rollback on any failure. Uses MongoDB session-based transactions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction
 *               - operations
 *             properties:
 *               transaction:
 *                 type: boolean
 *                 example: true
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     operationType:
 *                       type: string
 *                       enum: ['create', 'read', 'update', 'delete', 'aggregate', 'bulk']
 *                       example: "update"
 *                     collectionName:
 *                       type: string
 *                       example: "products"
 *                     parameters:
 *                       type: object
 *                       description: Operation-specific parameters (query, update, options, etc.)
 *                       example:
 *                         query: {"_id": "123"}
 *                         update: {"price": 99.99}
 *     responses:
 *       200:
 *         description: All operations completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 executionTime:
 *                   type: number
 *                   description: Total execution time in milliseconds
 *                 cached:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     operationCount:
 *                       type: number
 *                     successfulOperations:
 *                       type: number
 *                     failedOperations:
 *                       type: number
 *                     operations:
 *                       type: array
 *       400:
 *         description: Invalid request (invalid format, missing required fields, etc.)
 *       500:
 *         description: Server error or transaction failed
 */
router.post('/api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute', authenticate, executeTransaction);

module.exports = router;
