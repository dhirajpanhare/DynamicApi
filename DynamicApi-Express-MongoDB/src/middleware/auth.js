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
 *     token   — Static token validation via STATIC_TOKENS.
 *     jwt     — JWT validation via JWT_SECRETS.
 *     hybrid  — Both static tokens AND JWTs (migration phase).
 *
 * Migration path:
 *   1. AUTH_MODE=token        → static token, up and running instantly
 *   2. AUTH_SERVICE_URL=<url> → delegate to project's own auth API
 *   3. AUTH_MODE=jwt          → validate JWT locally with shared secret
 */

const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');
const logger = require('../utils/logger');

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }
    return null;
}

/**
 * Check token against comma-separated STATIC_TOKENS env variable
 */
function isValidStaticToken(token) {
    const raw = process.env.STATIC_TOKENS || '';
    if (!raw.trim()) return false;
    const tokens = raw.split(',').map(t => t.trim()).filter(Boolean);
    return tokens.includes(token);
}

/**
 * Try to verify JWT against each secret in JWT_SECRETS (or JWT_SECRET).
 * Returns the decoded payload on success, or null on failure.
 * Supports multiple secrets so multiple external auth APIs can share one Dynamic API.
 */
function verifyJwt(token) {
    const raw = process.env.JWT_SECRETS || process.env.JWT_SECRET || '';
    const secrets = raw.split(',').map(s => s.trim()).filter(Boolean);
    for (const secret of secrets) {
        try {
            return jwt.verify(token, secret);
        } catch (e) {
            // try the next secret
        }
    }
    return null;
}

async function callAuthService(token) {
    const serviceUrl = process.env.AUTH_SERVICE_URL;
    if (!serviceUrl) return null;
    let parsed;
    try { parsed = new URL(serviceUrl); }
    catch (e) { logger.error(`AUTH | Invalid AUTH_SERVICE_URL: ${serviceUrl}`); return false; }

    return new Promise((resolve) => {
        const client = parsed.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': 0 },
            timeout: 5000
        };
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(res.statusCode === 200 && JSON.parse(data).status === true);
                } catch { resolve(false); }
            });
        });
        req.on('error', (err) => { logger.error(`AUTH | Auth service error: ${err.message}`); resolve(false); });
        req.on('timeout', () => { logger.warn('AUTH | Auth service timed out'); req.destroy(); resolve(false); });
        req.end();
    });
}

/**
 * Main authentication middleware.
 * Apply to any route that should be protected.
 */
const authenticate = async (req, res, next) => {

    // 1. External auth service (highest priority)
    if (process.env.AUTH_SERVICE_URL) {
        const token = extractToken(req);
        if (!token) return res.status(401).json({ status: false, message: 'Authorization header with Bearer token required', data: null });
        const valid = await callAuthService(token);
        if (valid) { req.authType = 'auth-service'; return next(); }
        logger.warn(`AUTH | Auth service rejected token | IP:${req.ip}`);
        return res.status(403).json({ status: false, message: 'Invalid or expired token', data: null });
    }

    // 2. AUTH_MODE fallback
    const mode = (process.env.AUTH_MODE || 'none').toLowerCase();

    // ── none ─────────────────────────────────────────────────────────────────
    if (mode === 'none') {
        return next();
    }

    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({
            status: false,
            message: 'Authorization header with Bearer token required',
            data: null
        });
    }

    // ── token ─────────────────────────────────────────────────────────────────
    if (mode === 'token') {
        if (isValidStaticToken(token)) {
            req.authType = 'static-token';
            return next();
        }
        logger.warn(`AUTH | Invalid static token | IP:${req.ip}`);
        return res.status(403).json({
            status: false,
            message: 'Invalid token',
            data: null
        });
    }

    // ── jwt ───────────────────────────────────────────────────────────────────
    if (mode === 'jwt') {
        const payload = verifyJwt(token);
        if (payload) {
            req.user = payload;
            req.authType = 'jwt';
            return next();
        }
        logger.warn(`AUTH | Invalid JWT | IP:${req.ip}`);
        return res.status(403).json({
            status: false,
            message: 'Invalid or expired token',
            data: null
        });
    }

    // ── hybrid ────────────────────────────────────────────────────────────────
    if (mode === 'hybrid') {
        if (isValidStaticToken(token)) {
            req.authType = 'static-token';
            return next();
        }
        const payload = verifyJwt(token);
        if (payload) {
            req.user = payload;
            req.authType = 'jwt';
            return next();
        }
        logger.warn(`AUTH | Invalid hybrid auth | IP:${req.ip}`);
        return res.status(403).json({
            status: false,
            message: 'Invalid or expired token',
            data: null
        });
    }

    // ── unknown mode — fail safe ──────────────────────────────────────────────
    logger.error(`AUTH | Unknown AUTH_MODE value: "${mode}"`);
    return res.status(500).json({
        status: false,
        message: 'Server authentication misconfiguration',
        data: null
    });
};

module.exports = { authenticate };
