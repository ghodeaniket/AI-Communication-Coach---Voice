/**
 * Environment configuration for Voice Coach application
 */

import type { Environment } from '../di-container-factory';

// Environment-specific configuration
export interface EnvironmentConfig {
  apiEndpoint: string;
  useLocalServices: boolean;
  debug: boolean;
  mockResponses: boolean;
  audio: {
    maxRecordingDuration: number;
    sampleRate: number;
    noiseReduction: boolean;
  };
}

// Default configuration values by environment
const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/api',
    useLocalServices: true,
    debug: true,
    mockResponses: import.meta.env.VITE_USE_MOCK_RESPONSES === 'true',
    audio: {
      maxRecordingDuration: Number(import.meta.env.VITE_MAX_RECORDING_DURATION || 120),
      sampleRate: Number(import.meta.env.VITE_AUDIO_SAMPLE_RATE || 44100),
      noiseReduction: import.meta.env.VITE_AUDIO_NOISE_REDUCTION !== 'false',
    }
  },
  testing: {
    apiEndpoint: 'http://test-api.example.com',
    useLocalServices: false,
    debug: true,
    mockResponses: true,
    audio: {
      maxRecordingDuration: 30,
      sampleRate: 16000,
      noiseReduction: false,
    }
  },
  production: {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || 'https://api.voicecoach.example.com',
    useLocalServices: false,
    debug: false,
    mockResponses: false,
    audio: {
      maxRecordingDuration: Number(import.meta.env.VITE_MAX_RECORDING_DURATION || 180),
      sampleRate: Number(import.meta.env.VITE_AUDIO_SAMPLE_RATE || 44100),
      noiseReduction: import.meta.env.VITE_AUDIO_NOISE_REDUCTION !== 'false',
    }
  }
};

// Detect current environment
export function detectEnvironment(): Environment {
  if (import.meta.env.MODE === 'test') {
    return 'testing';
  } else if (import.meta.env.PROD) {
    return 'production';
  }
  return 'development';
}

// Get config for current environment
const currentEnvironment = detectEnvironment();
export const config = environmentConfigs[currentEnvironment];

// Export current environment for debugging
export const environment = currentEnvironment;

// For testing and debugging
export const isDevEnvironment = currentEnvironment === 'development';
export const isTestEnvironment = currentEnvironment === 'testing';
export const isProdEnvironment = currentEnvironment === 'production';
