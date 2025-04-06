/**
 * Environment configuration for Voice Coach application
 */

import type { Environment } from '../di-container-factory';

// Environment-specific configuration
export interface EnvironmentConfig {
  apiEndpoint: string;
  useLocalServices: boolean;
  useMockServices: boolean;
  debug: boolean;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
  };
  audio: {
    maxRecordingDuration: number;
    sampleRate: number;
    noiseReduction: boolean;
  };
  localServices: {
    useSpeechRecognition: boolean;
    simulateNetworkDelay: boolean;
    networkDelayMs: number;
  };
}

// Default configuration values by environment
const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/api',
    useLocalServices: true,
    useMockServices: import.meta.env.VITE_USE_MOCK_SERVICES === 'true',
    debug: true,
    logging: {
      level: 'debug',
      enableConsole: true
    },
    audio: {
      maxRecordingDuration: Number(import.meta.env.VITE_MAX_RECORDING_DURATION || 120),
      sampleRate: Number(import.meta.env.VITE_AUDIO_SAMPLE_RATE || 44100),
      noiseReduction: import.meta.env.VITE_AUDIO_NOISE_REDUCTION !== 'false',
    },
    localServices: {
      useSpeechRecognition: import.meta.env.VITE_USE_SPEECH_RECOGNITION !== 'false',
      simulateNetworkDelay: import.meta.env.VITE_SIMULATE_NETWORK_DELAY === 'true',
      networkDelayMs: Number(import.meta.env.VITE_NETWORK_DELAY_MS || 500)
    }
  },
  testing: {
    apiEndpoint: 'http://test-api.example.com',
    useLocalServices: false,
    useMockServices: true,
    debug: true,
    logging: {
      level: 'debug',
      enableConsole: true
    },
    audio: {
      maxRecordingDuration: 30,
      sampleRate: 16000,
      noiseReduction: false,
    },
    localServices: {
      useSpeechRecognition: false,
      simulateNetworkDelay: false,
      networkDelayMs: 0
    }
  },
  production: {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || 'https://api.voicecoach.example.com',
    useLocalServices: false,
    useMockServices: false,
    debug: false,
    logging: {
      level: 'error',
      enableConsole: false
    },
    audio: {
      maxRecordingDuration: Number(import.meta.env.VITE_MAX_RECORDING_DURATION || 180),
      sampleRate: Number(import.meta.env.VITE_AUDIO_SAMPLE_RATE || 44100),
      noiseReduction: import.meta.env.VITE_AUDIO_NOISE_REDUCTION !== 'false',
    },
    localServices: {
      useSpeechRecognition: false,
      simulateNetworkDelay: false,
      networkDelayMs: 0
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
