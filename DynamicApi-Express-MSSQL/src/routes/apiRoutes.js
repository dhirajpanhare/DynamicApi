/**
 * API Routes Definition
 * Defines all API endpoints and their handlers
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');

/**
 * Register API routes
 * @param {express.Router} router - Express router instance
 * @param {DynamicApiController} dynamicApiController - Controller handling the endpoints
 */
function registerApiRoutes(router, dynamicApiController) {
    /**
     * @swagger
     * /api/v1.0/DynamicApi/DynamicApiExecute:
     *   post:
     *     summary: Execute a stored procedure dynamically
     *     description: Execute any allowed stored procedure with flexible parameters. Supports custom parameter and key-value separators.
     *     tags:
     *       - Dynamic API
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/DynamicApiExecuteRequest'
     *           example:
     *             stringOne: "p_ProductId=1|p_Category=Electronics"
     *             stringTwo: "|"
     *             stringThree: "="
     *             stringFour: "GetProductById"
     *     responses:
     *       200:
     *         description: Procedure executed successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *             example:
     *               status: true
     *               message: "Success"
     *               data:
     *                 - ProductId: 1
     *                   ProductName: "Laptop"
     *                   Price: 50000
     *       400:
     *         description: Invalid request (missing procedure name or other validation error)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
        '/api/v1.0/DynamicApi/DynamicApiExecute',
        authenticate,
        (req, res) => dynamicApiController.executeProcedure(req, res)
    );

    /**
     * @swagger
     * /api/v1.0/DynamicApi/metadata/{procedureName}:
     *   get:
     *     summary: Get procedure metadata
     *     description: Retrieve parameter metadata and Swagger schema for a stored procedure
     *     tags:
     *       - Metadata
     *     parameters:
     *       - in: path
     *         name: procedureName
     *         required: true
     *         schema:
     *           type: string
     *         description: Name of the stored procedure
     *     responses:
     *       200:
     *         description: Metadata retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MetadataResponse'
     *       400:
     *         description: Invalid procedure name
     *       500:
     *         description: Internal server error
     */
    router.get(
        '/api/v1.0/DynamicApi/metadata/:procedureName',
        (req, res) => dynamicApiController.getProcedureMetadata(req, res)
    );

    /**
     * @swagger
     * /api/v1.0/DynamicApi/procedures:
     *   get:
     *     summary: List all procedures
     *     description: Get a list of all available stored procedures
     *     tags:
     *       - Metadata
     *     responses:
     *       200:
     *         description: Procedures listed successfully
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
     *                   type: array
     *                   items:
     *                     type: string
     *       500:
     *         description: Internal server error
     */
    router.get(
        '/api/v1.0/DynamicApi/procedures',
        (req, res) => dynamicApiController.listProcedures(req, res)
    );

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns the health status of the API server
     *     tags:
     *       - Health
     *     responses:
     *       200:
     *         description: Server is healthy
     *         content:
     *           application/json:
     *             example:
     *               status: "OK"
     *               timestamp: "2026-03-27T05:34:32.591Z"
     *               environment: "development"
     */
    router.get(
        '/health',
        (req, res) => dynamicApiController.healthCheck(req, res)
    );

    /**
     * @swagger
     * /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute:
     *   post:
     *     summary: Execute multiple stored procedures in a transaction
     *     description: Execute multiple stored procedures atomically - all succeed or all rollback on any failure
     *     tags:
     *       - Transaction API
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
     *                     procedureName:
     *                       type: string
     *                       example: "GetProduct"
     *                     stringOne:
     *                       type: string
     *                       example: "p_ProductId=1"
     *                     stringTwo:
     *                       type: string
     *                       example: ""
     *                     stringThree:
     *                       type: string
     *                       example: "="
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
    router.post(
        '/api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute',
        authenticate,
        (req, res) => dynamicApiController.executeTransaction(req, res)
    );

    /**
     * @swagger
     * /api/v1.0/DynamicApi/GeneratePayload:
     *   post:
     *     summary: Generate DynamicApiExecute payload from a stored procedure definition
     *     description: Paste a CREATE PROCEDURE SQL definition and receive a ready-to-use DynamicApiExecute request payload with sample values.
     *     tags:
     *       - Utilities
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - procedureDefinition
     *             properties:
     *               procedureDefinition:
     *                 type: string
     *                 description: Full CREATE PROCEDURE SQL definition (MySQL or MSSQL syntax)
     *     responses:
     *       200:
     *         description: Payload generated successfully (returns payload directly)
     *         content:
     *           application/json:
     *             example:
     *               stringOne: "p_ProductName=SampleText|p_Price=0.00|p_Category=SampleText"
     *               stringTwo: "|"
     *               stringThree: "="
     *               stringFour: "InsertProduct"
     *       400:
     *         description: Invalid or unparseable procedure definition
     */
    router.post(
        '/api/v1.0/DynamicApi/GeneratePayload',
        (req, res) => dynamicApiController.generatePayload(req, res)
    );
}

module.exports = {
    registerApiRoutes
};
