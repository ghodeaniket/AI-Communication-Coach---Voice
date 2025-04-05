import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  AnalyticsRequest, 
  TranscriptionResult, 
  SpeechAnalytics
} from '../interfaces';
import { createErrorResponse, createSuccessResponse } from '../utils/responses';
import { getSpeechAnalyticsService } from '../utils/factory';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Received speech analytics request');
    
    // Check if we have a body
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body');
    }
    
    // Parse the request body
    let request: AnalyticsRequest;
    try {
      request = JSON.parse(event.body) as AnalyticsRequest;
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }
    
    // Validate the request
    if (!request.transcription) {
      return createErrorResponse(400, 'Missing transcription data');
    }
    
    // Get analytics service
    const speechAnalyticsService = getSpeechAnalyticsService();
    
    // Generate speech analytics
    let analytics: SpeechAnalytics;
    try {
      analytics = await speechAnalyticsService.analyze(request.transcription);
    } catch (error) {
      console.error('Error analyzing speech:', error);
      return createErrorResponse(
        500,
        'Speech analysis failed',
        error instanceof Error ? error.message : 'Unknown error during analysis'
      );
    }
    
    // Return the result
    return createSuccessResponse(analytics);
    
  } catch (error) {
    console.error('Error processing speech analytics request:', error);
    return createErrorResponse(
      500, 
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
};
