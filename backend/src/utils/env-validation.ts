/**
 * Environment validation utility for Voice Coach backend
 */

import { z } from 'zod';

// Backend Environment Schema
export const backendEnvSchema = z.object({
  // Application Settings
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'])
    .optional()
    .default('info'),

  // AWS Configuration
  AWS_REGION: z.string().min(1, 'AWS region is required'),
  
  // External API Configuration
  OPENAI_API_KEY: z.string()
    .regex(/^sk-[a-zA-Z0-9]{32,}$/, 'Invalid OpenAI API key format')
    .optional(),
  OPENAI_WHISPER_MODEL: z.string()
    .optional()
    .default('whisper-1'),

  // Database Configuration
  DYNAMODB_TABLE: z.string().min(1, 'DynamoDB table name is required'),
  DYNAMODB_ENDPOINT: z.string().url('DynamoDB endpoint must be a valid URL').optional(),

  // Security & Authentication
  CORS_ALLOWED_ORIGINS: z.string().min(1, 'CORS allowed origins are required'),
});

// Backend environment type based on schema
export type BackendEnv = z.infer<typeof backendEnvSchema>;

/**
 * Validates backend environment variables
 * @returns Object with validated environment variables or error
 */
export function validateBackendEnv(): { 
  env: BackendEnv | null; 
  success: boolean; 
  error: z.ZodError | null;
} {
  try {
    const env = backendEnvSchema.parse(process.env);
    return { env, success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { env: null, success: false, error };
    }
    throw error;
  }
}

/**
 * Backend configuration derived from environment variables
 * Use this object throughout your backend application
 */
export function createBackendConfig() {
  const { env, success, error } = validateBackendEnv();
  
  if (!success || !env) {
    console.error('Environment validation failed:', 
      error?.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    
    // For backend, we want to fail fast in case of misconfiguration
    throw new Error('Invalid environment configuration');
  }
  
  return {
    app: {
      environment: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
    },
    aws: {
      region: env.AWS_REGION,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
      whisperModel: env.OPENAI_WHISPER_MODEL,
    },
    database: {
      tableName: env.DYNAMODB_TABLE,
      endpoint: env.DYNAMODB_ENDPOINT,
    },
    security: {
      corsOrigins: env.CORS_ALLOWED_ORIGINS.split(','),
    },
  };
}
