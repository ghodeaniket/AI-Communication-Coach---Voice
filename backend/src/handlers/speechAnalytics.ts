import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  AnalyticsRequest, 
  TranscriptionResult, 
  SpeechAnalytics,
  FillerWordAnalysis,
  SpeakingRateAnalysis,
  PauseAnalysis
} from '../interfaces';
import { createErrorResponse, createSuccessResponse } from '../utils/responses';

// Common filler words to detect
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'right', 'so', 'well', 'I mean',
  'kind of', 'sort of', 'actually', 'basically', 'literally', 'stuff', 'things'
];

/**
 * Detect filler words in the transcription
 */
const detectFillerWords = (transcription: TranscriptionResult): FillerWordAnalysis => {
  // For a real implementation, we'd use the word timings to find exact timestamps
  // This is a simplified version for demonstration
  const text = transcription.text.toLowerCase();
  const words = text.split(/\s+/);
  
  const fillerWordCounts: Record<string, { count: number, timestamps: number[] }> = {};
  
  // Count occurrences of each filler word
  FILLER_WORDS.forEach(fillerWord => {
    const regex = new RegExp(`\\b${fillerWord}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches && matches.length > 0) {
      // In a real implementation, we would use word timings to get actual timestamps
      const timestamps = Array(matches.length).fill(0).map((_, i) => i * 2); // Mock timestamps
      
      fillerWordCounts[fillerWord] = {
        count: matches.length,
        timestamps
      };
    }
  });
  
  // Calculate total count and prepare result format
  const totalCount = Object.values(fillerWordCounts).reduce((sum, { count }) => sum + count, 0);
  const fillerWordList = Object.entries(fillerWordCounts).map(([word, { count, timestamps }]) => ({
    word,
    count,
    timestamps
  }));
  
  // Calculate density (occurrences per minute)
  const durationInMinutes = transcription.duration / 60;
  const density = durationInMinutes > 0 ? totalCount / durationInMinutes : 0;
  
  return {
    totalCount,
    words: fillerWordList,
    density
  };
};

/**
 * Analyze speaking rate
 */
const analyzeSpeakingRate = (transcription: TranscriptionResult): SpeakingRateAnalysis => {
  const words = transcription.text.split(/\s+/).filter(word => word.length > 0);
  const totalWords = words.length;
  const durationInMinutes = transcription.duration / 60;
  
  // Calculate words per minute
  const wordsPerMinute = durationInMinutes > 0 ? Math.round(totalWords / durationInMinutes) : 0;
  
  // Generate recommendation based on speaking rate
  let recommendation: string | undefined;
  
  if (wordsPerMinute < 120) {
    recommendation = "Your speaking pace is slower than average. Consider increasing your speed slightly for more engaging delivery.";
  } else if (wordsPerMinute > 160) {
    recommendation = "Your speaking pace is faster than average. Try slowing down slightly for better clarity.";
  } else {
    recommendation = "Your speaking pace is within the ideal range for clear communication.";
  }
  
  return {
    wordsPerMinute,
    totalWords,
    duration: transcription.duration,
    recommendation
  };
};

/**
 * Detect pauses in speech
 */
const detectPauses = (transcription: TranscriptionResult): PauseAnalysis => {
  // In a real implementation, we would analyze word timings to detect pauses
  // This is a simplified mock implementation
  
  // Mock data for demonstration
  const mockPauses = [
    { startTime: 1.2, endTime: 2.5, duration: 1.3 },
    { startTime: 5.7, endTime: 7.1, duration: 1.4 },
    { startTime: 10.3, endTime: 10.8, duration: 0.5 },
    { startTime: 15.5, endTime: 18.2, duration: 2.7 }
  ];
  
  // Calculate average pause duration
  const totalPauseDuration = mockPauses.reduce((sum, pause) => sum + pause.duration, 0);
  const averagePauseDuration = mockPauses.length > 0 ? totalPauseDuration / mockPauses.length : 0;
  
  // Classify pauses by duration
  const pauseDistribution = {
    short: mockPauses.filter(p => p.duration < 1).length,
    medium: mockPauses.filter(p => p.duration >= 1 && p.duration <= 2).length,
    long: mockPauses.filter(p => p.duration > 2).length
  };
  
  // Filter for long pauses (> 2 seconds)
  const longPauses = mockPauses.filter(p => p.duration > 2);
  
  return {
    totalPauses: mockPauses.length,
    averagePauseDuration,
    longPauses,
    pauseDistribution
  };
};

/**
 * Generate comprehensive speech analytics
 */
const generateSpeechAnalytics = (transcription: TranscriptionResult): SpeechAnalytics => {
  return {
    fillerWords: detectFillerWords(transcription),
    speakingRate: analyzeSpeakingRate(transcription),
    pauses: detectPauses(transcription),
    transcription
  };
};

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
    
    // Generate speech analytics
    const analytics = generateSpeechAnalytics(request.transcription);
    
    // Return the result
    return createSuccessResponse(analytics);
    
  } catch (error) {
    console.error('Error processing speech analytics:', error);
    return createErrorResponse(
      500, 
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
};
