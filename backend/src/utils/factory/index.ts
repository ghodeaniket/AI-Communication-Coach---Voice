import { 
  ITranscriptionService 
} from '../../interfaces';
import { WhisperTranscriptionService } from '../../services/transcription';

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
  
  // Check if we should use a mock service for testing/development
  const useMock = process.env.USE_MOCK_SERVICES === 'true' || process.env.NODE_ENV === 'test';
  
  // Create new instance
  const service = new WhisperTranscriptionService();
  
  // Cache the instance
  serviceInstances['transcriptionService'] = service;
  
  return service;
}

// Additional factory functions will be added here as we implement more services
