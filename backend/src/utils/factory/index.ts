import { 
  ITranscriptionService,
  ISpeechAnalyticsService
} from '../../interfaces';
import { 
  WhisperTranscriptionService,
  SpeechAnalyticsService
} from '../../services';

// Cache for singleton service instances
const serviceInstances: Record<string, any> = {};

/**
 * Factory function to get the TranscriptionService instance
 * Creates a singleton instance or uses a provided instance
 */
export function getTranscriptionService(
  instance?: ITranscriptionService
): ITranscriptionService {
  // If an instance is provided, use it (useful for testing)
  if (instance) {
    return instance;
  }
  
  // Use cached instance if available
  if (serviceInstances['transcriptionService']) {
    return serviceInstances['transcriptionService'];
  }
  
  // Create new instance
  const service = new WhisperTranscriptionService();
  
  // Cache the instance
  serviceInstances['transcriptionService'] = service;
  
  return service;
}

/**
 * Factory function to get the SpeechAnalyticsService instance
 * Creates a singleton instance or uses a provided instance
 */
export function getSpeechAnalyticsService(
  instance?: ISpeechAnalyticsService
): ISpeechAnalyticsService {
  // If an instance is provided, use it (useful for testing)
  if (instance) {
    return instance;
  }
  
  // Use cached instance if available
  if (serviceInstances['speechAnalyticsService']) {
    return serviceInstances['speechAnalyticsService'];
  }
  
  // Create new instance
  const service = new SpeechAnalyticsService();
  
  // Cache the instance
  serviceInstances['speechAnalyticsService'] = service;
  
  return service;
}

// Additional factory functions will be added here as we implement more services
