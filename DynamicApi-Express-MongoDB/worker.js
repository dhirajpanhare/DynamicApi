/**
 * Cloudflare Worker Wrapper for Express MongoDB API
 * Adapts Express app to Cloudflare Workers API
 */

import { createServer } from 'http';
import app from './src/index.js';

// In-memory storage for active request
let serverInstance = null;

/**
 * Initialize Express server for Workers
 */
function initializeServer() {
  if (!serverInstance) {
    serverInstance = createServer(app);
  }
  return serverInstance;
}

/**
 * Main Cloudflare Worker handler
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Initialize server
      const server = initializeServer();

      // Extract request data
      const url = new URL(request.url);
      const method = request.method;
      const headers = Object.fromEntries(request.headers.entries());
      
      let body = null;
      if (method !== 'GET' && method !== 'HEAD') {
        body = await request.arrayBuffer();
      }

      // Handle CORS preflight
      if (method === 'OPTIONS') {
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

      // Create response (mock Express behavior)
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
      
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString(),
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
   * Scheduled handler for cleanup jobs
   */
  async scheduled(event, env, ctx) {
    console.log('Running scheduled job:', event.cron);
    // Cleanup old OTP records, logs, etc.
  },
};
