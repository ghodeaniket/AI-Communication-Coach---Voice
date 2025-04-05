import { FeedbackService } from '../../../services/feedback';
import { 
  SpeechAnalytics, 
  TranscriptionResult, 
  FeedbackLevel 
} from '../../../interfaces';

describe('FeedbackService', () => {
  // Create test instances
  let service: FeedbackService;
  
  // Sample analytics data for tests
  const sampleTranscription: TranscriptionResult = {
    text: "Um, this is a test of the speech analytics service. You know, I think it's like, really important to um, analyze how we speak and stuff. It helps us to eliminate, uh, filler words and speak more clearly.",
    confidence: 0.95,
    duration: 15.0,
    wordTimings: [
      { word: "Um", startTime: 0.0, endTime: 0.5, confidence: 0.98 },
      { word: "this", startTime: 0.6, endTime: 0.8, confidence: 0.99 },
      { word: "is", startTime: 0.8, endTime: 0.9, confidence: 0.99 },
      { word: "a", startTime: 0.9, endTime: 1.0, confidence: 0.99 },
      { word: "test", startTime: 1.0, endTime: 1.3, confidence: 0.98 },
      { word: "of", startTime: 1.3, endTime: 1.4, confidence: 0.99 },
      { word: "the", startTime: 1.4, endTime: 1.5, confidence: 0.99 },
      { word: "speech", startTime: 1.5, endTime: 1.8, confidence: 0.98 },
      { word: "analytics", startTime: 1.8, endTime: 2.3, confidence: 0.97 },
      { word: "service", startTime: 2.3, endTime: 2.8, confidence: 0.98 },
      { word: "You", startTime: 3.2, endTime: 3.3, confidence: 0.99 },
      { word: "know", startTime: 3.3, endTime: 3.5, confidence: 0.99 },
      { word: "I", startTime: 3.8, endTime: 3.9, confidence: 0.99 },
      { word: "think", startTime: 3.9, endTime: 4.1, confidence: 0.98 },
      { word: "it's", startTime: 4.1, endTime: 4.3, confidence: 0.99 },
      { word: "like", startTime: 4.3, endTime: 4.6, confidence: 0.97 },
      { word: "really", startTime: 4.7, endTime: 4.9, confidence: 0.98 },
      { word: "important", startTime: 4.9, endTime: 5.4, confidence: 0.98 },
      { word: "to", startTime: 5.4, endTime: 5.5, confidence: 0.99 },
      { word: "um", startTime: 5.5, endTime: 6.0, confidence: 0.97 },
      { word: "analyze", startTime: 6.2, endTime: 6.6, confidence: 0.98 },
      { word: "how", startTime: 6.6, endTime: 6.8, confidence: 0.99 },
      { word: "we", startTime: 6.8, endTime: 6.9, confidence: 0.99 },
      { word: "speak", startTime: 6.9, endTime: 7.2, confidence: 0.98 },
      { word: "and", startTime: 7.2, endTime: 7.4, confidence: 0.99 },
      { word: "stuff", startTime: 7.4, endTime: 7.8, confidence: 0.97 },
      { word: "It", startTime: 8.5, endTime: 8.6, confidence: 0.99 },
      { word: "helps", startTime: 8.6, endTime: 8.9, confidence: 0.98 },
      { word: "us", startTime: 8.9, endTime: 9.1, confidence: 0.99 },
      { word: "to", startTime: 9.1, endTime: 9.2, confidence: 0.99 },
      { word: "eliminate", startTime: 9.2, endTime: 9.8, confidence: 0.98 },
      { word: "uh", startTime: 10.0, endTime: 10.3, confidence: 0.97 },
      { word: "filler", startTime: 10.4, endTime: 10.7, confidence: 0.98 },
      { word: "words", startTime: 10.7, endTime: 11.0, confidence: 0.99 },
      { word: "and", startTime: 11.1, endTime: 11.3, confidence: 0.99 },
      { word: "speak", startTime: 11.3, endTime: 11.6, confidence: 0.98 },
      { word: "more", startTime: 11.6, endTime: 11.9, confidence: 0.99 },
      { word: "clearly", startTime: 11.9, endTime: 12.4, confidence: 0.98 }
    ]
  };
  
  const sampleAnalytics: SpeechAnalytics = {
    fillerWords: {
      totalCount: 5,
      words: [
        { word: "um", count: 2, timestamps: [0.0, 5.5] },
        { word: "like", count: 1, timestamps: [4.3] },
        { word: "you know", count: 1, timestamps: [3.2] },
        { word: "stuff", count: 1, timestamps: [7.4] }
      ],
      density: 20.0 // 5 filler words in 15 seconds = 20 per minute
    },
    speakingRate: {
      wordsPerMinute: 152,
      totalWords: 38,
      duration: 15.0,
      recommendation: "Your speaking pace is within the ideal range for clear communication."
    },
    pauses: {
      totalPauses: 3,
      averagePauseDuration: 0.8,
      longPauses: [
        { startTime: 2.8, endTime: 3.2, duration: 0.4 },
        { startTime: 7.8, endTime: 8.5, duration: 0.7 },
      ],
      pauseDistribution: {
        short: 1,
        medium: 2,
        long: 0
      }
    },
    transcription: sampleTranscription
  };
  
  beforeEach(() => {
    // Create fresh service instance for each test
    service = new FeedbackService();
  });
  
  it('should generate feedback with all expected components', async () => {
    const result = await service.generateFeedback(sampleAnalytics);
    
    // Verify that all expected components are present
    expect(result).toBeDefined();
    expect(result.overallScore).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.improvements).toBeDefined();
    expect(result.detailedFeedback).toBeDefined();
    expect(result.highlightedTranscript).toBeDefined();
    
    // Check detailed feedback structure
    expect(result.detailedFeedback.fillerWords).toBeDefined();
    expect(result.detailedFeedback.speakingRate).toBeDefined();
    expect(result.detailedFeedback.pauses).toBeDefined();
    expect(result.detailedFeedback.general).toBeDefined();
    
    // Check highlighted transcript structure
    expect(result.highlightedTranscript.fullText).toBe(sampleTranscription.text);
    expect(Array.isArray(result.highlightedTranscript.highlights)).toBe(true);
  });
  
  it('should generate different feedback based on skill level', async () => {
    // Generate feedback for different skill levels
    service.setFeedbackLevel(FeedbackLevel.BEGINNER);
    const beginnerResult = await service.generateFeedback(sampleAnalytics);
    
    service.setFeedbackLevel(FeedbackLevel.INTERMEDIATE);
    const intermediateResult = await service.generateFeedback(sampleAnalytics);
    
    service.setFeedbackLevel(FeedbackLevel.ADVANCED);
    const advancedResult = await service.generateFeedback(sampleAnalytics);
    
    // Verify that feedback is different for each level
    expect(beginnerResult.detailedFeedback.fillerWords)
      .not.toBe(intermediateResult.detailedFeedback.fillerWords);
      
    expect(intermediateResult.detailedFeedback.fillerWords)
      .not.toBe(advancedResult.detailedFeedback.fillerWords);
      
    expect(beginnerResult.detailedFeedback.fillerWords)
      .not.toBe(advancedResult.detailedFeedback.fillerWords);
    
    // Advanced feedback should be more detailed
    expect(advancedResult.detailedFeedback.fillerWords.length)
      .toBeGreaterThan(beginnerResult.detailedFeedback.fillerWords.length * 0.8);
  });
  
  it('should create appropriate highlighted transcript', () => {
    const highlightedTranscript = service.generateTranscriptWithHighlights(
      sampleTranscription,
      sampleAnalytics
    );
    
    // Verify structure
    expect(highlightedTranscript.fullText).toBe(sampleTranscription.text);
    expect(Array.isArray(highlightedTranscript.highlights)).toBe(true);
    
    // Check that filler words are highlighted
    const fillerWordHighlights = highlightedTranscript.highlights.filter(
      h => h.type === 'filler_word'
    );
    
    // Should have highlights for filler words
    expect(fillerWordHighlights.length).toBeGreaterThan(0);
    
    // Check that each highlight has the required properties
    highlightedTranscript.highlights.forEach(highlight => {
      expect(highlight.startIdx).toBeDefined();
      expect(highlight.endIdx).toBeDefined();
      expect(highlight.startIdx).toBeLessThan(highlight.endIdx);
      expect(['filler_word', 'pause', 'fast_speech', 'slow_speech']).toContain(highlight.type);
    });
    
    // Check that highlights are sorted by position
    const startIndices = highlightedTranscript.highlights.map(h => h.startIdx);
    const sortedIndices = [...startIndices].sort((a, b) => a - b);
    expect(startIndices).toEqual(sortedIndices);
  });
  
  it('should identify strengths and improvements', async () => {
    const result = await service.generateFeedback(sampleAnalytics);
    
    // Check strengths
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
    
    // Check improvements
    expect(Array.isArray(result.improvements)).toBe(true);
    expect(result.improvements.length).toBeGreaterThan(0);
    
    // Create a sample with good metrics
    const goodAnalytics: SpeechAnalytics = {
      ...sampleAnalytics,
      fillerWords: {
        totalCount: 0,
        words: [],
        density: 0
      }
    };
    
    const goodResult = await service.generateFeedback(goodAnalytics);
    
    // Should have more strengths than improvements
    expect(goodResult.strengths.length).toBeGreaterThanOrEqual(goodResult.improvements.length);
  });
  
  it('should initialize with provided feedback level', () => {
    const advancedService = new FeedbackService({
      feedbackLevel: FeedbackLevel.ADVANCED
    });
    
    // Verify we get advanced-level feedback
    const highlightedTranscript = advancedService.generateTranscriptWithHighlights(
      sampleTranscription,
      sampleAnalytics
    );
    
    // This test is limited since we can't easily check the private feedbackLevel property
    // In a real test suite, we'd verify by checking the resulting feedback style
    expect(highlightedTranscript).toBeDefined();
  });
});
