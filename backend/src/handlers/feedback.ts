import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  FeedbackRequest, 
  SpeechAnalytics,
  FeedbackResult,
  HighlightedTranscript,
  FeedbackLevel
} from '../interfaces';
import { createErrorResponse, createSuccessResponse } from '../utils/responses';

/**
 * Generate transcript with highlights based on analytics
 */
const generateTranscriptWithHighlights = (
  analytics: SpeechAnalytics
): HighlightedTranscript => {
  const transcription = analytics.transcription;
  const text = transcription.text;
  const highlights = [];
  
  // In a real implementation, we'd use the word timings to find exact positions in the text
  // This is a simplified version using string matching for demonstration
  
  // 1. Highlight filler words
  analytics.fillerWords.words.forEach(fillerWord => {
    // Simple string search (in production, we'd use more sophisticated matching)
    let startIdx = 0;
    const word = fillerWord.word.toLowerCase();
    
    // Find all occurrences of this filler word
    for (let i = 0; i < fillerWord.count; i++) {
      const searchText = text.toLowerCase().substring(startIdx);
      const relativeIdx = searchText.indexOf(word);
      
      if (relativeIdx !== -1) {
        const absoluteStartIdx = startIdx + relativeIdx;
        const absoluteEndIdx = absoluteStartIdx + word.length;
        
        highlights.push({
          type: 'filler_word',
          startIdx: absoluteStartIdx,
          endIdx: absoluteEndIdx,
          metadata: {
            word: fillerWord.word
          }
        });
        
        startIdx = absoluteEndIdx;
      }
    }
  });
  
  // 2. Highlight areas of fast speech (simplified mock implementation)
  if (analytics.speakingRate.wordsPerMinute > 160) {
    // Just highlight a section in the middle for demonstration
    const middleIdx = Math.floor(text.length / 2);
    const startIdx = Math.max(0, middleIdx - 50);
    const endIdx = Math.min(text.length, middleIdx + 50);
    
    highlights.push({
      type: 'fast_speech',
      startIdx,
      endIdx,
      metadata: {
        rate: analytics.speakingRate.wordsPerMinute
      }
    });
  }
  
  // 3. Highlight long pauses (simplified mock implementation)
  analytics.pauses.longPauses.forEach((pause, index) => {
    // Simulate pause positions in the text
    const textPosition = Math.floor((index + 1) * text.length / (analytics.pauses.longPauses.length + 1));
    
    highlights.push({
      type: 'pause',
      startIdx: textPosition,
      endIdx: textPosition + 1,
      metadata: {
        duration: pause.duration
      }
    });
  });
  
  return {
    fullText: text,
    highlights: highlights.sort((a, b) => a.startIdx - b.startIdx) // Sort by position
  };
};

/**
 * Generate overall feedback based on speech analytics
 */
const generateFeedback = (
  analytics: SpeechAnalytics, 
  level: FeedbackLevel = FeedbackLevel.INTERMEDIATE
): FeedbackResult => {
  // Calculate overall score (simplified algorithm)
  let fillerWordScore = 100;
  if (analytics.fillerWords.density > 0) {
    fillerWordScore = Math.max(0, 100 - (analytics.fillerWords.density * 10));
  }
  
  let speakingRateScore = 100;
  const wpm = analytics.speakingRate.wordsPerMinute;
  if (wpm < 120) {
    speakingRateScore = Math.max(50, 100 - (120 - wpm));
  } else if (wpm > 160) {
    speakingRateScore = Math.max(50, 100 - (wpm - 160));
  }
  
  let pauseScore = 100;
  if (analytics.pauses.longPauses.length > 0) {
    pauseScore = Math.max(0, 100 - (analytics.pauses.longPauses.length * 5));
  }
  
  // Overall score is weighted average
  const overallScore = Math.round((fillerWordScore * 0.4) + (speakingRateScore * 0.4) + (pauseScore * 0.2));
  
  // Generate strengths and improvements
  const strengths = [];
  const improvements = [];
  
  if (fillerWordScore >= 80) {
    strengths.push("You used minimal filler words, keeping your speech clear and confident.");
  } else {
    improvements.push("Reduce filler words like \"um\", \"uh\", and \"like\" to sound more confident.");
  }
  
  if (speakingRateScore >= 80) {
    strengths.push("Your speaking pace is well-balanced, making your message easy to follow.");
  } else if (wpm < 120) {
    improvements.push("Try to increase your speaking pace slightly to maintain audience engagement.");
  } else {
    improvements.push("Consider slowing down your speech slightly for better clarity.");
  }
  
  if (pauseScore >= 80) {
    strengths.push("You effectively use pauses to emphasize key points.");
  } else {
    improvements.push("Work on reducing extended pauses that might disrupt your flow.");
  }
  
  // Detailed feedback based on level
  let fillerWordFeedback, speakingRateFeedback, pauseFeedback, generalFeedback;
  
  // Adjust feedback detail based on level
  switch (level) {
    case FeedbackLevel.BEGINNER:
      // Simpler, more encouraging feedback
      fillerWordFeedback = analytics.fillerWords.totalCount > 0 
        ? `You used filler words ${analytics.fillerWords.totalCount} times. Try to be aware of these words when speaking.` 
        : "Great job avoiding filler words!";
      
      speakingRateFeedback = `You spoke at ${wpm} words per minute. The ideal range is 120-160 wpm.`;
      
      pauseFeedback = analytics.pauses.longPauses.length > 0
        ? "You had some longer pauses in your speech. Short pauses can be effective, but long ones might break your flow."
        : "You maintained a good flow with appropriate pauses.";
      
      generalFeedback = "Keep practicing regularly to build your confidence and speaking skills.";
      break;
      
    case FeedbackLevel.ADVANCED:
      // More detailed, technical feedback
      fillerWordFeedback = analytics.fillerWords.totalCount > 0 
        ? `You used filler words at a rate of ${analytics.fillerWords.density.toFixed(1)} per minute, with "${analytics.fillerWords.words[0]?.word || 'um'}" being most frequent. Professional speakers aim for fewer than 1 per minute.` 
        : "Excellent job avoiding filler words, maintaining a professional speaking quality.";
      
      speakingRateFeedback = `Your rate of ${wpm} WPM is ${wpm < 120 ? 'below' : wpm > 160 ? 'above' : 'within'} the optimal range of 120-160 WPM. ${analytics.speakingRate.recommendation}`;
      
      pauseFeedback = `Your pause distribution (${analytics.pauses.pauseDistribution.short} short, ${analytics.pauses.pauseDistribution.medium} medium, ${analytics.pauses.pauseDistribution.long} long) shows ${analytics.pauses.pauseDistribution.long > 2 ? 'excessive long pauses' : 'good pause control'}. Strategic pauses increase retention by 38%.`;
      
      generalFeedback = "Consider recording yourself regularly and tracking these metrics to see improvement over time.";
      break;
      
    case FeedbackLevel.INTERMEDIATE:
    default:
      // Balanced feedback
      fillerWordFeedback = analytics.fillerWords.totalCount > 0 
        ? `You used filler words ${analytics.fillerWords.totalCount} times (${analytics.fillerWords.density.toFixed(1)} per minute). Most common: "${analytics.fillerWords.words[0]?.word || 'um'}" (${analytics.fillerWords.words[0]?.count || 0} times).` 
        : "You did an excellent job avoiding filler words, which enhances your clarity and credibility.";
      
      speakingRateFeedback = `You spoke at ${wpm} words per minute. ${analytics.speakingRate.recommendation}`;
      
      pauseFeedback = analytics.pauses.longPauses.length > 0
        ? `You had ${analytics.pauses.longPauses.length} extended pauses lasting over 2 seconds. While strategic pauses are effective, too many long pauses can disrupt your flow.`
        : "Your pausing technique was effective, with good rhythm throughout your speech.";
      
      generalFeedback = "Focus on maintaining a conversational tone while incorporating these technical improvements.";
      break;
  }
  
  // Create highlighted transcript
  const highlightedTranscript = generateTranscriptWithHighlights(analytics);
  
  return {
    overallScore,
    strengths,
    improvements,
    detailedFeedback: {
      fillerWords: fillerWordFeedback,
      speakingRate: speakingRateFeedback,
      pauses: pauseFeedback,
      general: generalFeedback
    },
    highlightedTranscript
  };
};

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
    
    // Generate feedback
    const feedback = generateFeedback(
      request.analytics,
      request.level || FeedbackLevel.INTERMEDIATE
    );
    
    // Return the result
    return createSuccessResponse(feedback);
    
  } catch (error) {
    console.error('Error generating feedback:', error);
    return createErrorResponse(
      500, 
      'Internal server error',
      error instanceof Error ? error.message : String(error)
    );
  }
};
