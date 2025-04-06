/**
 * Local API Client for development
 * 
 * This implementation provides a local API client that works without
 * requiring actual backend services. It simulates API responses for
 * development and testing purposes.
 */

import type { 
  IAPIClient, 
  AudioData, 
  ProcessingResult,
  TranscriptionResult 
} from '../../interfaces';
import { LocalTranscriptionService } from './LocalTranscriptionService';
import { config } from '../../config/environment';

export class LocalAPIClient implements IAPIClient {
  private endpoint: string = 'http://localhost';
  private timeout: number = 30000;
  private transcriptionService: LocalTranscriptionService;
  
  constructor() {
    this.transcriptionService = new LocalTranscriptionService();
  }
  
  /**
   * Set the API endpoint
   * @param endpoint - API endpoint URL
   */
  public setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }
  
  /**
   * Set the request timeout
   * @param timeoutMs - Timeout in milliseconds
   */
  public setTimeout(timeoutMs: number): void {
    this.timeout = timeoutMs;
  }
  
  /**
   * Process audio and generate results
   * @param audio - Audio data to process
   * @returns Promise resolving to processing result
   */
  public async processAudio(audio: AudioData): Promise<ProcessingResult> {
    try {
      // Get network simulation configuration
      const { simulateNetworkDelay, networkDelayMs } = config.localServices || 
        { simulateNetworkDelay: true, networkDelayMs: 500 };
      
      // Log in debug mode
      if (config.debug) {
        console.log('LocalAPIClient - Processing audio:', {
          size: audio.size,
          duration: audio.duration,
          format: audio.format
        });
      }
      
      // Use the transcription service to get transcription
      const transcription = await this.transcriptionService.transcribe(audio);
      
      // Generate analytics based on transcription
      const analytics = await this.generateAnalytics(transcription);
      
      // Simulate network delay for backend processing if configured
      if (simulateNetworkDelay) {
        await new Promise(resolve => setTimeout(resolve, networkDelayMs || 500));
      }
      
      // Generate feedback based on analytics
      const feedback = await this.generateFeedback(analytics, transcription);
      
      // Construct final result
      const result: ProcessingResult = {
        transcription,
        analytics,
        feedback
      };
      
      // Log the result in debug mode
      if (config.debug) {
        console.log('LocalAPIClient - Processing complete:', {
          textLength: transcription.text.length,
          analyticKeys: Object.keys(analytics),
          feedbackItems: feedback.suggestions.length + feedback.positives.length
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }
  
  /**
   * Check service health
   * @returns Promise resolving to health status
   */
  public async checkServiceHealth(): Promise<{ status: string }> {
    return { status: 'healthy' };
  }
  
  /**
   * Generate speech analytics from transcription
   * @param transcription - Transcription result
   * @returns Promise resolving to analytics object
   */
  private async generateAnalytics(transcription: TranscriptionResult): Promise<any> {
    // Calculate words per minute
    const wordCount = transcription.text.split(/\s+/).filter(Boolean).length;
    const minutes = transcription.duration / 60;
    const wordsPerMinute = Math.round(wordCount / minutes);
    
    // Detect filler words
    const fillerWords = this.detectFillerWords(transcription.text);
    
    // Detect pauses based on word timings
    const pauses = this.detectPauses(transcription.wordTimings);
    
    // Calculate metrics
    return {
      fillerWords: {
        count: fillerWords.length,
        words: fillerWords,
        frequency: fillerWords.length / (wordCount || 1)
      },
      speakingRate: {
        wordsPerMinute,
        assessment: this.assessSpeakingRate(wordsPerMinute)
      },
      pauses: {
        count: pauses.length,
        totalDuration: pauses.reduce((sum, pause) => sum + pause.duration, 0),
        averageDuration: pauses.length ? 
          pauses.reduce((sum, pause) => sum + pause.duration, 0) / pauses.length : 0,
        assessment: this.assessPauses(pauses, transcription.duration)
      },
      clarity: {
        score: Math.min(100, 50 + transcription.confidence * 50),
        assessment: this.assessClarity(transcription.confidence)
      },
      overallScore: this.calculateOverallScore({
        fillerWordFrequency: fillerWords.length / (wordCount || 1),
        speakingRate: wordsPerMinute,
        pausePercentage: pauses.reduce((sum, pause) => sum + pause.duration, 0) / transcription.duration,
        clarity: transcription.confidence
      })
    };
  }
  
  /**
   * Generate feedback based on analytics
   * @param analytics - Speech analytics
   * @param transcription - Transcription result
   * @returns Promise resolving to feedback object
   */
  private async generateFeedback(analytics: any, transcription: TranscriptionResult): Promise<any> {
    const suggestions: string[] = [];
    const positives: string[] = [];
    const highlights: any[] = [];
    
    // Evaluate filler words
    if (analytics.fillerWords.count > 5) {
      suggestions.push(`Try to reduce filler words like "${analytics.fillerWords.words.slice(0, 3).join('", "')}". You used them ${analytics.fillerWords.count} times.`);
      
      // Add highlights for filler words
      this.addHighlightsForFillerWords(highlights, transcription, analytics.fillerWords.words);
    } else if (analytics.fillerWords.count <= 2) {
      positives.push("You used very few filler words, which makes your speech sound more confident and polished.");
    }
    
    // Evaluate speaking rate
    if (analytics.speakingRate.assessment === 'too_fast') {
      suggestions.push(`Your speaking pace of ${analytics.speakingRate.wordsPerMinute} words per minute is a bit fast. Try to slow down for better clarity.`);
    } else if (analytics.speakingRate.assessment === 'too_slow') {
      suggestions.push(`Your speaking pace of ${analytics.speakingRate.wordsPerMinute} words per minute is a bit slow. Try to maintain a more engaging pace.`);
    } else {
      positives.push(`Your speaking pace of ${analytics.speakingRate.wordsPerMinute} words per minute is excellent for clear communication.`);
    }
    
    // Evaluate pauses
    if (analytics.pauses.assessment === 'too_many') {
      suggestions.push("You have frequent pauses that might interrupt your flow. Try to practice more for smoother delivery.");
    } else if (analytics.pauses.assessment === 'too_few') {
      suggestions.push("Consider using more strategic pauses to emphasize key points and give listeners time to process information.");
    } else if (analytics.pauses.assessment === 'good') {
      positives.push("You use pauses effectively, which helps with emphasis and allows listeners to absorb your message.");
    }
    
    // Evaluate clarity
    if (analytics.clarity.assessment === 'excellent') {
      positives.push("Your speech is very clear and easy to understand.");
    } else if (analytics.clarity.assessment === 'good') {
      positives.push("You speak with good clarity, making it easy for listeners to follow.");
    } else if (analytics.clarity.assessment === 'fair') {
      suggestions.push("Try to articulate words more clearly to improve understanding.");
    } else {
      suggestions.push("Focus on clearer pronunciation to make your speech easier to understand.");
    }
    
    // Ensure we have at least one positive comment
    if (positives.length === 0) {
      positives.push("You're making good progress with your communication skills.");
    }
    
    // Return feedback
    return {
      suggestions,
      positives,
      highlights,
      overallScore: analytics.overallScore
    };
  }
  
  /**
   * Detect filler words in text
   * @param text - Text to analyze
   * @returns Array of filler words found
   */
  private detectFillerWords(text: string): string[] {
    const fillerWordsPatterns = [
      /\\bum\\b/gi,
      /\\buh\\b/gi,
      /\\beh\\b/gi,
      /\\blike\\b/gi,
      /\\byou know\\b/gi,
      /\\bso\\b/gi,
      /\\bactually\\b/gi,
      /\\bbasically\\b/gi,
      /\\bliterally\\b/gi,
      /\\bI mean\\b/gi,
      /\\bkind of\\b/gi,
      /\\bsort of\\b/gi,
      /\\bI guess\\b/gi,
      /\\bright\\b/gi
    ];
    
    const fillerWords: string[] = [];
    const lowerText = text.toLowerCase();
    
    fillerWordsPatterns.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          fillerWords.push(match);
        });
      }
    });
    
    return fillerWords;
  }
  
  /**
   * Detect pauses based on word timings
   * @param wordTimings - Array of word timing objects
   * @returns Array of pause objects
   */
  private detectPauses(wordTimings?: TranscriptionResult['wordTimings']): Array<{ startTime: number; endTime: number; duration: number }> {
    if (!wordTimings || wordTimings.length < 2) {
      return [];
    }
    
    const pauses = [];
    const pauseThreshold = 0.5; // Seconds
    
    for (let i = 1; i < wordTimings.length; i++) {
      const previousWordEnd = wordTimings[i - 1].endTime;
      const currentWordStart = wordTimings[i].startTime;
      const pauseDuration = currentWordStart - previousWordEnd;
      
      if (pauseDuration >= pauseThreshold) {
        pauses.push({
          startTime: previousWordEnd,
          endTime: currentWordStart,
          duration: pauseDuration
        });
      }
    }
    
    return pauses;
  }
  
  /**
   * Assess speaking rate
   * @param wordsPerMinute - Speaking rate in words per minute
   * @returns Assessment string
   */
  private assessSpeakingRate(wordsPerMinute: number): string {
    if (wordsPerMinute > 180) {
      return 'too_fast';
    } else if (wordsPerMinute < 120) {
      return 'too_slow';
    } else {
      return 'good';
    }
  }
  
  /**
   * Assess pauses
   * @param pauses - Array of pause objects
   * @param totalDuration - Total duration of speech
   * @returns Assessment string
   */
  private assessPauses(
    pauses: Array<{ duration: number }>,
    totalDuration: number
  ): string {
    const totalPauseDuration = pauses.reduce((sum, pause) => sum + pause.duration, 0);
    const pausePercentage = totalPauseDuration / totalDuration;
    
    if (pausePercentage > 0.3) {
      return 'too_many';
    } else if (pausePercentage < 0.05 && totalDuration > 30) {
      return 'too_few';
    } else {
      return 'good';
    }
  }
  
  /**
   * Assess speech clarity
   * @param confidence - Transcription confidence score
   * @returns Assessment string
   */
  private assessClarity(confidence: number): string {
    if (confidence >= 0.9) {
      return 'excellent';
    } else if (confidence >= 0.75) {
      return 'good';
    } else if (confidence >= 0.5) {
      return 'fair';
    } else {
      return 'poor';
    }
  }
  
  /**
   * Calculate overall score based on various metrics
   * @param metrics - Speech metrics
   * @returns Overall score (0-100)
   */
  private calculateOverallScore(metrics: {
    fillerWordFrequency: number;
    speakingRate: number;
    pausePercentage: number;
    clarity: number;
  }): number {
    // Convert each metric to a 0-100 score
    const fillerWordScore = Math.max(0, 100 - metrics.fillerWordFrequency * 500);
    
    const speakingRateScore = 
      metrics.speakingRate < 120 ? 60 + (metrics.speakingRate / 120) * 40 :
      metrics.speakingRate > 180 ? 100 - ((metrics.speakingRate - 180) / 60) * 40 :
      100;
    
    const pauseScore = 
      metrics.pausePercentage < 0.05 ? 80 :
      metrics.pausePercentage > 0.3 ? 60 :
      100;
    
    const clarityScore = metrics.clarity * 100;
    
    // Weighted average
    return Math.round(
      (fillerWordScore * 0.3) +
      (speakingRateScore * 0.25) +
      (pauseScore * 0.2) +
      (clarityScore * 0.25)
    );
  }
  
  /**
   * Add highlights for filler words
   * @param highlights - Highlights array to modify
   * @param transcription - Transcription result
   * @param fillerWords - Array of filler words
   */
  private addHighlightsForFillerWords(
    highlights: any[],
    transcription: TranscriptionResult,
    fillerWords: string[]
  ): void {
    if (!transcription.wordTimings || fillerWords.length === 0) {
      return;
    }
    
    for (const wordTiming of transcription.wordTimings) {
      if (fillerWords.some(filler => 
        wordTiming.word.toLowerCase() === filler.toLowerCase()
      )) {
        highlights.push({
          type: 'filler_word',
          word: wordTiming.word,
          startTime: wordTiming.startTime,
          endTime: wordTiming.endTime,
          message: 'Filler word'
        });
      }
    }
  }
}
