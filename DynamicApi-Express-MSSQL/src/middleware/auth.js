/**
 * Flexible Authentication Middleware
 *
 * Priority order:
 *
 *  1. AUTH_SERVICE_URL (highest priority)
 *     If set, every token is validated by calling that external service.
 *     The service is your project's own auth API — Dynamic API just proxies
 *     the Bearer token to it and trusts the response.
 *     Expected response:  { "status": true|false, "message": "..." }
 *     HTTP 200 + status:true  → allow
 *     Anything else           → deny
 *
 *  2. AUTH_MODE (fallback when AUTH_SERVICE_URL is not set)
 *
 *     none    — No authentication (development / internal networks).
 *
 *     token   — Static token validation.
 *               Set STATIC_TOKENS=tok1,tok2 in .env.
 *               Quick bootstrap — any project can start immediately.
 *
 *     jwt     — JWT validation only.
 *               Set JWT_SECRETS=secret1,secret2 in .env
 *               (one secret per external auth project).
 *               Dynamic API never generates tokens — only validates.
 *
 *     hybrid  — Accepts BOTH static tokens AND JWTs.
 *               Use during migration: old clients keep static tokens
 *               while new projects switch to their own JWT.
 *
 * Migration path:
 *   1. AUTH_MODE=token           → static token, up and running instantly
 *   2. AUTH_SERVICE_URL=<url>    → delegate to project's own auth API
 *   3. AUTH_MODE=jwt             → validate JWT locally with shared secret
 *   4. AUTH_MODE=hybrid          → support both during transition
 */

const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return null;
}

function isValidStaticToken(token) {
    const raw = process.env.STATIC_TOKENS || '';
    if (!raw.trim()) return false;
    return raw.split(',').map(t => t.trim()).filter(Boolean).includes(token);
}

function verifyJwt(token) {
    const raw = process.env.JWT_SECRETS || process.env.JWT_SECRET || '';
    const secrets = raw.split(',').map(s => s.trim()).filter(Boolean);
    for (const secret of secrets) {
        try { return jwt.verify(token, secret); } catch (e) { /* try next */ }
    }
    return null;
}

/**
 * Call the project's external auth service to validate a token.
 * Sends POST to AUTH_SERVICE_URL with the original Authorization header.
 * Returns true if the service responds HTTP 200 with { status: true }.
 * Returns false on any error, timeout, or rejection.
 */
async function callAuthService(token) {
    const serviceUrl = process.env.AUTH_SERVICE_URL;
    if (!serviceUrl) return null; // not configured — skip

    let parsed;
    try { parsed = new URL(serviceUrl); }
    catch (e) {
        logger.error(`AUTH | Invalid AUTH_SERVICE_URL: ${serviceUrl}`);
        return false;
    }

    return new Promise((resolve) => {
        const client = parsed.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': 0
            },
            timeout: 5000
        };

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const body = JSON.parse(data);
                        resolve(body.status === true);
                    } else {
                        resolve(false);
                    }
                } catch {
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            logger.error(`AUTH | Auth service request failed: ${err.message}`);
            resolve(false);
        });
        req.on('timeout', () => {
            logger.warn('AUTH | Auth service request timed out');
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main authentication middleware
// ─────────────────────────────────────────────────────────────────────────────

const authenticate = async (req, res, next) => {

    // ── 1. External auth service (highest priority) ───────────────────────────
    //    If AUTH_SERVICE_URL is configured, delegate validation to that service.
    //    This is the recommended path when a project has its own auth API.
    if (process.env.AUTH_SERVICE_URL) {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                status: false,
                message: 'Authorization header with Bearer token required',
                data: null
            });
        }
        const valid = await callAuthService(token);
        if (valid) {
            req.authType = 'auth-service';
            return next();
        }
        logger.warn(`AUTH | Auth service rejected token | IP:${req.ip}`);
        return res.status(403).json({
            status: false,
            message: 'Invalid or expired token',
            data: null
        });
    }

    // ── 2. AUTH_MODE fallback ──────────────────────────────────────────────────
    const mode = (process.env.AUTH_MODE || 'none').toLowerCase();

    if (mode === 'none') return next();

    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({
            status: false,
            message: 'Authorization header with Bearer token required',
            data: null
        });
    }

    if (mode === 'token') {
        if (isValidStaticToken(token)) { req.authType = 'static-token'; return next(); }
        logger.warn(`AUTH | Invalid static token | IP:${req.ip}`);
        return res.status(403).json({ status: false, message: 'Invalid token', data: null });
    }

    if (mode === 'jwt') {
        const payload = verifyJwt(token);
        if (payload) { req.user = payload; req.authType = 'jwt'; return next(); }
        logger.warn(`AUTH | Invalid JWT | IP:${req.ip}`);
        return res.status(403).json({ status: false, message: 'Invalid or expired token', data: null });
    }

    if (mode === 'hybrid') {
        if (isValidStaticToken(token)) { req.authType = 'static-token'; return next(); }
        const payload = verifyJwt(token);
        if (payload) { req.user = payload; req.authType = 'jwt'; return next(); }
        logger.warn(`AUTH | Invalid hybrid auth | IP:${req.ip}`);
        return res.status(403).json({ status: false, message: 'Invalid or expired token', data: null });
    }

    logger.error(`AUTH | Unknown AUTH_MODE value: "${mode}"`);
    return res.status(500).json({
        status: false,
        message: 'Server authentication misconfiguration',
        data: null
    });
};

module.exports = { authenticate };
