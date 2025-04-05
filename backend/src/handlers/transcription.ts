import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TranscriptionRequest, AudioData, TranscriptionResult } from '../interfaces';
import { corsHeaders } from '../utils/cors';
import { createErrorResponse, createSuccessResponse } from '../utils/responses';

// This is a placeholder implementation until we connect to the OpenAI Whisper API
const mockTranscribe = async (audio: AudioData): Promise<TranscriptionResult> => {
  // In a real implementation, we would send the audio to the OpenAI Whisper API
  // For now, we'll return a mock result
  console.log(`Mock transcribing audio: ${audio.duration}s, ${audio.format}, ${audio.size} bytes`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    text: "This is a mock transcription for development purposes. It simulates what would be returned from the Whisper API.",
    confidence: 0.95,
    duration: audio.duration,
    wordTimings: [
      { word: "This", startTime: 0.0, endTime: 0.2, confidence: 0.98 },
      { word: "is", startTime: 0.2, endTime: 0.3, confidence: 0.99 },
      { word: "a", startTime: 0.3, endTime: 0.4, confidence: 0.99 },
      { word: "mock", startTime: 0.4, endTime: 0.7, confidence: 0.96 },
      { word: "transcription", startTime: 0.7, endTime: 1.5, confidence: 0.94 }
      // Additional word timings would be included in a real response
    ]
  };
};

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
    
    // Process the transcription
    const result = await mockTranscribe(audioData);
    
    // Return the result
    return createSuccessResponse(result);
    
  } catch (error) {
    console.error('Error processing transcription:', error);
    return createErrorResponse(
      500, 
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
};
