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
} = require('../controllers/dynamicApiController');

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
router.post('/DynamicApiExecute', executeOperation);

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
router.post('/Operations', executeOperation);

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

module.exports = router;
