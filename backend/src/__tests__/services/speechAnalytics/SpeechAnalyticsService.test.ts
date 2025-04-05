import { SpeechAnalyticsService } from '../../../services/speechAnalytics';
import { TranscriptionResult } from '../../../interfaces';

describe('SpeechAnalyticsService', () => {
  // Create test instances
  let service: SpeechAnalyticsService;
  
  // Sample transcription data for tests
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
  
  // Test without word timings
  const transcriptionWithoutTimings: TranscriptionResult = {
    text: "Um, this is a test without word timings. You know, it should still work.",
    confidence: 0.95,
    duration: 5.0
  };
  
  beforeEach(() => {
    // Create fresh service instance for each test
    service = new SpeechAnalyticsService();
  });
  
  it('should analyze transcription with all metrics', async () => {
    const result = await service.analyze(sampleTranscription);
    
    // Verify that all expected components are present
    expect(result).toBeDefined();
    expect(result.fillerWords).toBeDefined();
    expect(result.speakingRate).toBeDefined();
    expect(result.pauses).toBeDefined();
    expect(result.transcription).toBeDefined();
    
    // Verify original transcription is included
    expect(result.transcription).toBe(sampleTranscription);
  });
  
  it('should detect filler words correctly', () => {
    const result = service.detectFillerWords(sampleTranscription);
    
    // Verify filler word detection
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.words.length).toBeGreaterThan(0);
    
    // Check for specific filler words in our sample
    const fillerWords = result.words.map(w => w.word);
    expect(fillerWords).toContain('um');
    expect(fillerWords).toContain('like');
    expect(fillerWords).toContain('you know');
    expect(fillerWords).toContain('uh');
    expect(fillerWords).toContain('stuff');
    
    // Check density calculation
    expect(result.density).toBeGreaterThan(0);
    
    // Specific words should have timestamps
    const umEntry = result.words.find(w => w.word === 'um');
    expect(umEntry).toBeDefined();
    expect(umEntry!.timestamps.length).toBe(umEntry!.count);
  });
  
  it('should analyze speaking rate correctly', () => {
    const result = service.analyzeSpeakingRate(sampleTranscription);
    
    // Verify speaking rate analysis
    expect(result.wordsPerMinute).toBeGreaterThan(0);
    expect(result.totalWords).toBeGreaterThan(0);
    expect(result.duration).toBe(15.0);
    
    // Count words and compare with result
    const wordCount = sampleTranscription.text.split(/\s+/).filter(w => w.length > 0).length;
    expect(result.totalWords).toBe(wordCount);
    
    // Verify word per minute calculation is accurate
    const expectedWPM = Math.round(wordCount / (15.0 / 60));
    expect(result.wordsPerMinute).toBe(expectedWPM);
    
    // Check recommendation
    expect(result.recommendation).toBeDefined();
  });
  
  it('should detect pauses correctly with word timings', () => {
    const result = service.detectPauses(sampleTranscription);
    
    // Verify pause detection
    expect(result.totalPauses).toBeGreaterThanOrEqual(0);
    expect(result.averagePauseDuration).toBeGreaterThanOrEqual(0);
    expect(result.pauseDistribution).toBeDefined();
    
    // Sum of distribution categories should equal total pauses
    const totalFromDistribution = 
      result.pauseDistribution.short + 
      result.pauseDistribution.medium + 
      result.pauseDistribution.long;
    expect(totalFromDistribution).toBe(result.totalPauses);
    
    // Long pauses array length should match distribution count
    expect(result.longPauses.length).toBe(result.pauseDistribution.long);
  });
  
  it('should handle transcription without word timings', async () => {
    const result = await service.analyze(transcriptionWithoutTimings);
    
    // Verify the analysis still works
    expect(result).toBeDefined();
    expect(result.fillerWords).toBeDefined();
    expect(result.speakingRate).toBeDefined();
    expect(result.pauses).toBeDefined();
    
    // The filler word detection should still work
    expect(result.fillerWords.totalCount).toBeGreaterThan(0);
    
    // The pauses should be estimated rather than detected
    expect(result.pauses.totalPauses).toBeGreaterThanOrEqual(0);
  });
  
  it('should be customizable with different filler words', async () => {
    // Create service with custom filler words
    const customService = new SpeechAnalyticsService({
      fillerWords: ['custom', 'words']
    });
    
    // The standard filler words shouldn't be detected
    const result = customService.detectFillerWords(sampleTranscription);
    const fillerWords = result.words.map(w => w.word);
    expect(fillerWords).not.toContain('um');
    expect(fillerWords).not.toContain('uh');
    
    // But if we add a custom word that is in the text, it should be found
    const serviceWithCustomAndStandard = new SpeechAnalyticsService({
      fillerWords: ['um', 'test', 'custom']
    });
    
    const customResult = serviceWithCustomAndStandard.detectFillerWords(sampleTranscription);
    const customFillerWords = customResult.words.map(w => w.word);
    expect(customFillerWords).toContain('um');
    expect(customFillerWords).toContain('test');
    expect(customFillerWords).not.toContain('custom'); // Not in the text
  });
});
