import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TranscriptionRequest, AudioData, TranscriptionResult } from '../interfaces';
import { createErrorResponse, createSuccessResponse } from '../utils/responses';
import { getTranscriptionService } from '../utils/factory';
import { WhisperTranscriptionService } from '../services/transcription';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Received transcription request');
    
    // Check if we have a body
    if (!event.body) {
      return createErrorResponse(400, 'Missing request body');
    }
    
    // Parse the request body
    let request: TranscriptionRequest;
    try {
      request = JSON.parse(event.body) as TranscriptionRequest;
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }
    
    // Validate the request
    if (!request.audio || !request.audio.data) {
      return createErrorResponse(400, 'Missing audio data');
    }
    
    // Convert the base64 audio data to a buffer
    const audioBuffer = Buffer.from(request.audio.data, 'base64');
    
    // Create an AudioData object for processing
    const audioData: AudioData = {
      buffer: audioBuffer,
      format: request.audio.format,
      duration: request.audio.duration,
      sampleRate: request.audio.sampleRate,
      channels: request.audio.channels,
      size: request.audio.size
    };
    
    // Get transcription service
    const transcriptionService = getTranscriptionService();
    
    // Process the transcription
    let result: TranscriptionResult;
    
    try {
      // Use mock transcription for development if API key is not set
      if (!process.env.OPENAI_API_KEY && transcriptionService instanceof WhisperTranscriptionService) {
        console.log('Using mock transcription (no API key)');
        result = await transcriptionService.mockTranscribe(audioData);
      } else {
        // Use real transcription service
        result = await transcriptionService.transcribe(audioData);
      }
    } catch (error) {
      console.error('Error during transcription:', error);
      
      // Provide a more helpful error message
      return createErrorResponse(
        500,
        'Transcription failed',
        error instanceof Error ? error.message : 'Unknown error during transcription'
      );
    }
    
    // Return the result
    return createSuccessResponse(result);
    
  } catch (error) {
    console.error('Error processing transcription request:', error);
    return createErrorResponse(
      500, 
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
};
