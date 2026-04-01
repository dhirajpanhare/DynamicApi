/**
 * API Routes Definition
 * Defines all API endpoints and their handlers
 */

const express = require('express');

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
        (req, res) => dynamicApiController.executeProcedure(req, res)
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
}

module.exports = {
    registerApiRoutes
};
