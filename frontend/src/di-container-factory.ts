/**
 * Environment-aware Dependency Injection Container Factory for Voice Coach application
 */
import { DIContainer, ServiceLifetime } from './di-container';
import type {
  IAudioService,
  ITranscriptionService,
  IStateService,
  IAPIClient,
  IResultsService
} from './interfaces';

// Import concrete service implementations
import { BrowserAudioService } from './services/BrowserAudioService';
// Note: Local services are imported dynamically to support lazy loading
// and avoid circular dependencies

// Environment type
export type Environment = 'development' | 'testing' | 'production';

/**
 * Container Factory for creating environment-specific DI containers
 */
export class DIContainerFactory {
  /**
   * Create a DI container configured for the specified environment
   */
  static create(environment: Environment): DIContainer {
    const container = new DIContainer();
    
    // Register core services with environment-specific implementations
    this.registerAudioService(container, environment);
    this.registerTranscriptionService(container, environment);
    this.registerAPIClient(container, environment);
    this.registerStateService(container, environment);
    this.registerResultsService(container, environment);
    
    return container;
  }
  
  /**
   * Register the appropriate Audio Service implementation based on environment
   */
  private static registerAudioService(container: DIContainer, environment: Environment): void {
    if (environment === 'testing') {
      // Register mock implementation for testing
      container.registerFactory('IAudioService', () => {
        return {
          configure: async () => true,
          startRecording: async () => true,
          stopRecording: async () => ({
            blob: new Blob(['mock-audio-data'], { type: 'audio/wav' }),
            duration: 10,
            sampleRate: 44100,
            channels: 1,
            format: 'wav',
            size: 1024
          }),
          optimizeAudio: async (audio) => audio
        };
      });
    } else {
      // Register browser implementation for development and production
      container.register('IAudioService', BrowserAudioService);
    }
  }
  
  /**
   * Register the appropriate Transcription Service implementation based on environment
   */
  private static registerTranscriptionService(container: DIContainer, environment: Environment): void {
    if (environment === 'development') {
      // Import the LocalTranscriptionService implementation
      import('./services/local/LocalTranscriptionService').then(({ LocalTranscriptionService }) => {
        if (!container.has('ITranscriptionService')) {
          container.register('ITranscriptionService', LocalTranscriptionService);
        }
      }).catch(error => {
        console.error('Failed to load LocalTranscriptionService:', error);
      });
      
      // Register a temporary implementation until the import completes
      container.registerFactory('ITranscriptionService', () => {
        return {
          transcribe: async (audio) => ({
            text: "Loading LocalTranscriptionService...",
            confidence: 0.95,
            duration: audio.duration,
            wordTimings: []
          }),
          setModel: (model) => {},
          getStatus: () => 'loading'
        };
      });
    } else if (environment === 'testing') {
      // Register mock implementation for testing
      container.registerFactory('ITranscriptionService', () => {
        return {
          transcribe: async () => ({
            text: "Mock transcription for testing.",
            confidence: 1.0,
            duration: 10,
            wordTimings: []
          }),
          setModel: (model) => {},
          getStatus: () => 'ready'
        };
      });
    } else {
      // For production, we'll need to implement a real service that connects to Whisper API
      // This will be implemented in a later step
      container.registerFactory('ITranscriptionService', () => {
        throw new Error('Production TranscriptionService not yet implemented');
      });
    }
  }
  
  /**
   * Register the appropriate API Client implementation based on environment
   */
  private static registerAPIClient(container: DIContainer, environment: Environment): void {
    if (environment === 'development') {
      // Import the LocalAPIClient implementation
      import('./services/local/LocalAPIClient').then(({ LocalAPIClient }) => {
        if (!container.has('IAPIClient')) {
          container.register('IAPIClient', LocalAPIClient);
        }
      }).catch(error => {
        console.error('Failed to load LocalAPIClient:', error);
      });
      
      // Register a temporary implementation until the import completes
      container.registerFactory('IAPIClient', () => {
        return {
          processAudio: async (audio) => ({
            transcription: {
              text: "Loading LocalAPIClient...",
              confidence: 0.9,
              duration: audio.duration
            },
            analytics: {
              fillerWords: { count: 0, words: [] },
              speakingRate: { wordsPerMinute: 0, assessment: 'loading' },
              pauses: { count: 0, totalDuration: 0, assessment: 'loading' }
            },
            feedback: {
              suggestions: ["Loading local services..."],
              positives: ["Local development environment is initializing."],
              highlights: []
            }
          }),
          checkServiceHealth: async () => ({ status: 'initializing' }),
          setEndpoint: () => {},
          setTimeout: () => {}
        };
      });
    } else if (environment === 'testing') {
      // Register mock implementation for testing
      container.registerFactory('IAPIClient', () => {
        return {
          processAudio: async () => ({
            transcription: {
              text: "Mock API response for testing.",
              confidence: 1.0,
              duration: 10
            },
            analytics: {
              fillerWords: { count: 0, words: [] },
              speakingRate: { wordsPerMinute: 120, assessment: 'good' },
              pauses: { count: 0, totalDuration: 0, assessment: 'good' }
            },
            feedback: {
              suggestions: [],
              positives: ["Great job!"],
              highlights: []
            }
          }),
          checkServiceHealth: async () => ({ status: 'healthy' }),
          setEndpoint: () => {},
          setTimeout: () => {}
        };
      });
    } else {
      // For production, we'll need a real API client
      // This will be implemented in a later step
      container.registerFactory('IAPIClient', () => {
        throw new Error('Production APIClient not yet implemented');
      });
    }
  }
  
  /**
   * Register the appropriate State Service implementation based on environment
   */
  private static registerStateService(container: DIContainer, environment: Environment): void {
    // Use the same implementation for all environments for now
    container.registerFactory('IStateService', () => {
      const state = {
        current: 'idle',
        data: new Map<string, any>()
      };
      const observers: Array<{ update: (state: string, data: any) => void }> = [];
      
      return {
        getCurrentState: () => state.current,
        transition: (newState: string) => {
          state.current = newState;
          observers.forEach(obs => obs.update(state.current, state.data));
          return true;
        },
        getStateData: <T>(key: string): T | null => state.data.get(key) || null,
        setStateData: <T>(key: string, data: T): void => {
          state.data.set(key, data);
          observers.forEach(obs => obs.update(state.current, state.data));
        },
        subscribe: (observer: { update: (state: string, data: any) => void }): void => {
          observers.push(observer);
        }
      };
    }, ServiceLifetime.SINGLETON);
  }
  
  /**
   * Register the appropriate Results Service implementation based on environment
   */
  private static registerResultsService(container: DIContainer, environment: Environment): void {
    if (environment === 'development' || environment === 'testing') {
      // Use local storage based implementation for development and testing
      container.registerFactory('IResultsService', () => {
        const results = new Map<string, any>();
        let nextId = 1;
        
        return {
          saveResult: async (result) => {
            const id = result.id || `result-${nextId++}`;
            results.set(id, { ...result, id });
            return id;
          },
          getResult: async (id) => {
            return results.get(id) || null;
          },
          listResults: async (limit = 10) => {
            return Array.from(results.values())
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, limit)
              .map(result => ({
                id: result.id,
                timestamp: result.timestamp,
                duration: result.meta?.duration || 0,
                textPreview: result.transcription.text.slice(0, 50) + '...',
                overallScore: result.analytics?.overallScore
              }));
          },
          deleteResult: async (id) => {
            return results.delete(id);
          }
        };
      }, ServiceLifetime.SINGLETON);
    } else {
      // For production, we'll need a real results service that connects to backend
      // This will be implemented in a later step
      container.registerFactory('IResultsService', () => {
        throw new Error('Production ResultsService not yet implemented');
      });
    }
  }
}

import { detectEnvironment } from './config/environment';

// Create and export container for current environment
export const container = DIContainerFactory.create(detectEnvironment());
