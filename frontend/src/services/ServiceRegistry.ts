/**
 * Service Registry - Configures and registers all services with the DI container
 */

import container from '../di-container';
import { MockAudioService } from './AudioService';
import { SimpleAudioService } from './audio/simple-audio-service';
import { ApplicationStateService } from './StateService';
import { MockTranscriptionService, ApiTranscriptionService } from './TranscriptionService';
import { DefaultAPIClient, MockAPIClient } from './ApiClient';
import { LocalStorageResultsService, ApiResultsService } from './ResultsService';

// Environment-specific configurations
const isDevelopment = import.meta.env.DEV;
// For debugging, we can choose to use mock services or real implementations
const useMocks = false; // Set to false to use real implementations

/**
 * Register all services with the container
 */
export function registerServices() {
  // Register audio service - using SimpleAudioService for better browser compatibility
  container.register('IAudioService', SimpleAudioService);
  
  // Register state management service
  container.register('IStateService', ApplicationStateService);
  
  // Register transcription service
  container.register('ITranscriptionService', 
    useMocks ? MockTranscriptionService : ApiTranscriptionService);
  
  // Register API client
  container.register('IAPIClient', 
    useMocks ? MockAPIClient : DefaultAPIClient);
  
  // Register results service
  container.register('IResultsService', 
    useMocks ? LocalStorageResultsService : ApiResultsService);
  
  // Log registered services in development
  if (isDevelopment) {
    console.log('Service registration complete with the following services:');
    console.log('- IAudioService: SimpleAudioService');
    console.log('- IStateService: ApplicationStateService');
    console.log('- ITranscriptionService:', useMocks ? 'MockTranscriptionService' : 'ApiTranscriptionService');
    console.log('- IAPIClient:', useMocks ? 'MockAPIClient' : 'DefaultAPIClient');
    console.log('- IResultsService:', useMocks ? 'LocalStorageResultsService' : 'ApiResultsService');
  }
  
  return container;
}

/**
 * Initialize container for application
 */
export function initializeContainer() {
  registerServices();
  return container;
}

// Export singleton instance
export default container;
