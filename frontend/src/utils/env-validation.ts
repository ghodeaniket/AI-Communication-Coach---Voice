/**
 * Environment validation utility for Voice Coach application
 */

/**
 * Frontend configuration derived from environment variables
 * Use this object throughout your frontend application
 */
export function createFrontendConfig() {
  const config = {
    api: {
      endpoint: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/api',
      timeout: Number(import.meta.env.VITE_API_TIMEOUT || '30000'),
      version: import.meta.env.VITE_API_VERSION || 'v1',
    },
    audio: {
      maxRecordingDuration: Number(import.meta.env.VITE_MAX_RECORDING_DURATION || '120'),
      sampleRate: Number(import.meta.env.VITE_AUDIO_SAMPLE_RATE || '44100'),
      noiseReduction: import.meta.env.VITE_AUDIO_NOISE_REDUCTION !== 'false',
    },
    features: {
      advancedMetrics: import.meta.env.VITE_FEATURE_ADVANCED_METRICS === 'true',
      recordingComparison: import.meta.env.VITE_FEATURE_RECORDING_COMPARISON !== 'false',
      socialSharing: import.meta.env.VITE_FEATURE_SOCIAL_SHARING === 'true',
    },
    monitoring: {
      enabled: import.meta.env.VITE_ENABLE_MONITORING === 'true',
      analyticsId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    },
  };
  
  return config;
}

/**
 * Validate environment variables
 * Returns true if all required variables are present
 */
export function validateEnvironment() {
  // Check for required variables
  const requiredVars = [
    'VITE_API_ENDPOINT',
  ];
  
  const missingVars = requiredVars.filter(varName => 
    import.meta.env[varName] === undefined || import.meta.env[varName] === '');
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}
