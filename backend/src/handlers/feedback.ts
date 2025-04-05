import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  FeedbackRequest, 
  SpeechAnalytics,
  FeedbackResult,
  FeedbackLevel
} from '../interfaces';
import { createErrorResponse, createSuccessResponse } from '../utils/responses';
import { getFeedbackService } from '../utils/factory';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Received feedback generation request');
    
    // Check if we have a body
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body');
    }
    
    // Parse the request body
    let request: FeedbackRequest;
    try {
      request = JSON.parse(event.body) as FeedbackRequest;
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }
    
    // Validate the request
    if (!request.analytics) {
      return createErrorResponse(400, 'Missing analytics data');
    }
    
    // Get the requested feedback level (default to intermediate)
    const feedbackLevel = request.level || FeedbackLevel.INTERMEDIATE;
    
    // Get feedback service
    const feedbackService = getFeedbackService(undefined, feedbackLevel);
    
    // Generate feedback
    let feedback: FeedbackResult;
    try {
      feedback = await feedbackService.generateFeedback(request.analytics);
    } catch (error) {
      console.error('Error generating feedback:', error);
      return createErrorResponse(
        500,
        'Feedback generation failed',
        error instanceof Error ? error.message : 'Unknown error during feedback generation'
      );
    }
    
    // Return the result
    return createSuccessResponse(feedback);
    
  } catch (error) {
    console.error('Error processing feedback request:', error);
    return createErrorResponse(
      500, 
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
};
