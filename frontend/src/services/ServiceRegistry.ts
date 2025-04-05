/**
 * Service Registry - Configures and registers all services with the DI container
 */

import container from '../di-container';
import { MockAudioService } from './AudioService';
import { BrowserAudioService } from './BrowserAudioService';
import { ApplicationStateService } from './StateService';
import { MockTranscriptionService, ApiTranscriptionService } from './TranscriptionService';
import { DefaultAPIClient, MockAPIClient } from './ApiClient';

// Environment-specific configurations
const isDevelopment = import.meta.env.DEV;
const useMocks = isDevelopment; // In development, use mock services by default

/**
 * Register all services with the container
 */
export function registerServices() {
  // Register audio service
  container.register('IAudioService', 
    useMocks ? MockAudioService : BrowserAudioService);
  
  // Register state management service
  container.register('IStateService', ApplicationStateService);
  
  // Register transcription service
  container.register('ITranscriptionService', 
    useMocks ? MockTranscriptionService : ApiTranscriptionService);
  
  // Register API client
  container.register('IAPIClient', 
    useMocks ? MockAPIClient : DefaultAPIClient);
  
  // Log registered services in development
  if (isDevelopment) {
    console.log('Service registration complete with the following services:');
    console.log('- IAudioService:', useMocks ? 'MockAudioService' : 'BrowserAudioService');
    console.log('- IStateService: ApplicationStateService');
    console.log('- ITranscriptionService:', useMocks ? 'MockTranscriptionService' : 'ApiTranscriptionService');
    console.log('- IAPIClient:', useMocks ? 'MockAPIClient' : 'DefaultAPIClient');
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
