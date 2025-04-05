/**
 * CORS utilities for API responses
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

/**
 * Add CORS headers to an existing headers object
 * @param headers Existing headers object
 * @returns Headers object with CORS headers added
 */
export const addCorsHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  return {
    ...headers,
    ...corsHeaders
  };
};
