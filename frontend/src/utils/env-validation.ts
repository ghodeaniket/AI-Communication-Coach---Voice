/**
 * Environment validation utility for Voice Coach application
 */

import { z } from 'zod';

// Frontend Environment Schema
export const frontendEnvSchema = z.object({
  // API Configuration
  VITE_API_ENDPOINT: z.string(),  // Simplified validation for development
  VITE_API_TIMEOUT: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive('API timeout must be positive'))
    .optional()
    .default('30000'),
  VITE_API_VERSION: z.string()
    .regex(/^v\d+$/, 'API version must match pattern v\\d+')
    .optional()
    .default('v1'),

  // Audio Processing
  VITE_MAX_RECORDING_DURATION: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(30).max(300, 'Recording duration must be between 30 and 300 seconds'))
    .optional()
    .default('120'),
  VITE_AUDIO_SAMPLE_RATE: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.enum([8000, 16000, 22050, 44100, 48000].map(String) as [string, ...string[]]))
    .optional()
    .default('44100'),
  VITE_AUDIO_NOISE_REDUCTION: z.string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('true'),

  // Feature Flags
  VITE_FEATURE_ADVANCED_METRICS: z.string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('false'),
  VITE_FEATURE_RECORDING_COMPARISON: z.string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('true'),
});

// Frontend environment type based on schema
export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

/**
 * Validates frontend environment variables
 * @returns Object with validated environment variables or error
 */
export function validateFrontendEnv(): { 
  env: FrontendEnv | null; 
  success: boolean; 
  error: z.ZodError | null;
} {
  try {
    // In the browser, use import.meta.env
    const env = frontendEnvSchema.parse(import.meta.env);
    return { env, success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { env: null, success: false, error };
    }
    throw error;
  }
}

/**
 * Frontend configuration derived from environment variables
 * Use this object throughout your frontend application
 */
export function createFrontendConfig() {
  const { env, success, error } = validateFrontendEnv();
  
  if (!success) {
    console.error('Environment validation failed:', 
      error?.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    
    // In development, show detailed error
    if (import.meta.env.DEV) {
      throw new Error('Invalid environment configuration');
    }
    
    // In production, use defaults where possible
    return createDefaultFrontendConfig();
  }
  
  return {
    api: {
      endpoint: env.VITE_API_ENDPOINT,
      timeout: env.VITE_API_TIMEOUT,
      version: env.VITE_API_VERSION,
    },
    audio: {
      maxRecordingDuration: env.VITE_MAX_RECORDING_DURATION,
      sampleRate: env.VITE_AUDIO_SAMPLE_RATE,
      noiseReduction: env.VITE_AUDIO_NOISE_REDUCTION,
    },
    features: {
      advancedMetrics: env.VITE_FEATURE_ADVANCED_METRICS,
      recordingComparison: env.VITE_FEATURE_RECORDING_COMPARISON,
    },
  };
}

/**
 * Default frontend configuration for fallback when validation fails
 */
function createDefaultFrontendConfig() {
  // Safe defaults for production fallback
  return {
    api: {
      endpoint: 'https://api.example.com/api', // This should be updated
      timeout: 30000,
      version: 'v1',
    },
    audio: {
      maxRecordingDuration: 120,
      sampleRate: 44100,
      noiseReduction: true,
    },
    features: {
      advancedMetrics: false,
      recordingComparison: true,
    },
  };
}
