/**
 * Cloudflare Worker Wrapper for Express MSSQL API
 * Adapts Express app to Cloudflare Workers API
 */

import app from './src/index.js';

/**
 * Main Cloudflare Worker handler
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      }

      // Create Express-compatible request wrapper
      const url = new URL(request.url);
      const path = url.pathname + url.search;
      
      // Get request body if present
      let body = null;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        body = await request.text();
      }

      // Call Express app (assuming it exports a handler)
      const response = await app(request);
      
      // Add CORS headers to response
      response.headers.set(
        'Access-Control-Allow-Origin',
        env.ALLOWED_ORIGINS || '*'
      );
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Add cache headers for health endpoint
      if (path.includes('/health')) {
        response.headers.set('Cache-Control', 'public, max-age=60');
      } else {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
          },
        }
      );
    }
  },

  /**
   * Scheduled handler for database cleanup
   */
  async scheduled(event, env, ctx) {
    try {
      console.log('Scheduled cleanup job triggered at:', new Date().toISOString());
      // Implement cleanup logic:
      // - Remove expired OTP records
      // - Cleanup old logs
      // - Clear session cache
    } catch (error) {
      console.error('Scheduled job error:', error);
    }
  },
};
