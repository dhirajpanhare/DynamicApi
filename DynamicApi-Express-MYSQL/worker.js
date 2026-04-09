/**
 * Cloudflare Worker Wrapper for Express MySQL API
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

      // Process request through Express app
      const response = await app(request);
      
      // Add CORS headers
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
      response.headers.set('Content-Security-Policy', "default-src 'self'");
      
      // Add cache headers
      const url = new URL(request.url);
      if (url.pathname.includes('/health')) {
        response.headers.set('Cache-Control', 'public, max-age=60');
      } else {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      
      // Log error to R2 bucket if configured
      try {
        const errorLog = JSON.stringify({
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          requestId: crypto.randomUUID(),
        });
        // Could store to env.BUCKET if needed
      } catch (e) {
        console.error('Could not log error:', e);
      }
      
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: env.NODE_ENV === 'development' ? error.message : 'An error occurred',
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
   * Scheduled handler for maintenance tasks
   */
  async scheduled(event, env, ctx) {
    try {
      console.log('Maintenance job:', event.cron, new Date().toISOString());
      // Cleanup expired OTP records
      // Archive old logs
      // Vacuum session tables
    } catch (error) {
      console.error('Scheduled error:', error);
    }
  },
};
