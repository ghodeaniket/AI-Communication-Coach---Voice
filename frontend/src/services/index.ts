/**
 * Service registry entry point
 * 
 * This file provides a consistent way to access services
 * throughout the application without directly depending on 
 * container implementation details.
 */

import { container } from '../di-container-factory';
import type {
  IAudioService,
  ITranscriptionService,
  IStateService,
  IAPIClient,
  IResultsService
} from '../interfaces';

// Audio service accessor
export function getAudioService(): IAudioService {
  return container.resolve<IAudioService>('IAudioService');
}

// Transcription service accessor
export function getTranscriptionService(): ITranscriptionService {
  return container.resolve<ITranscriptionService>('ITranscriptionService');
}

// State service accessor
export function getStateService(): IStateService {
  return container.resolve<IStateService>('IStateService');
}

// API client accessor
export function getAPIClient(): IAPIClient {
  return container.resolve<IAPIClient>('IAPIClient');
}

// Results service accessor
export function getResultsService(): IResultsService {
  return container.resolve<IResultsService>('IResultsService');
}

// Re-export container for advanced use cases
export { container };
