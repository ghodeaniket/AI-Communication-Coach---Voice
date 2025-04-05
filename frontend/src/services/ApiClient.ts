import { Injectable, ServiceLifetime } from '../di-container';
import type { IAPIClient, AudioData, ProcessingResult } from '../interfaces';

/**
 * Default implementation of the API Client
 */
@Injectable(ServiceLifetime.SINGLETON)
export class DefaultAPIClient implements IAPIClient {
  private endpoint: string;
  private timeout: number = 30000;
  
  constructor() {
    console.log('DefaultAPIClient initialized');
    this.endpoint = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/api';
  }
  
  /**
   * Set the API endpoint
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }
  
  /**
   * Set request timeout
   */
  setTimeout(timeoutMs: number): void {
    this.timeout = timeoutMs;
  }
  
  /**
   * Process audio through the API
   */
  async processAudio(audio: AudioData): Promise<ProcessingResult> {
    try {
      // Create form data with audio
      const formData = new FormData();
      formData.append('audio', audio.blob, 'recording.webm');
      
      // Add metadata
      formData.append('sampleRate', String(audio.sampleRate));
      formData.append('channels', String(audio.channels));
      formData.append('duration', String(audio.duration));
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      // Send to API
      const response = await fetch(`${this.endpoint}/process`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }
  
  /**
   * Check the health status of the API
   */
  async checkServiceHealth(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        return { status: 'error' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unavailable' };
    }
  }
}

/**
 * Mock implementation of the API Client for development/testing
 */
@Injectable(ServiceLifetime.SINGLETON)
export class MockAPIClient implements IAPIClient {
  private endpoint: string = 'http://mock-api';
  private timeout: number = 30000;
  
  constructor() {
    console.log('MockAPIClient initialized');
  }
  
  /**
   * Set the API endpoint (no-op for mock)
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }
  
  /**
   * Set request timeout (no-op for mock)
   */
  setTimeout(timeoutMs: number): void {
    this.timeout = timeoutMs;
  }
  
  /**
   * Process audio through the mocked API
   */
  async processAudio(audio: AudioData): Promise<ProcessingResult> {
    console.log('Processing audio with mock API client', audio);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock transcription
    const transcription = {
      text: "This is a mock transcription for testing purposes. It simulates what the real API would return.",
      confidence: 0.92,
      duration: audio.duration,
      wordTimings: []
    };
    
    // Generate mock analytics
    const analytics = {
      speakingRate: {
        wordsPerMinute: 150,
        syllablesPerMinute: 200,
        rating: "good"
      },
      fillerWords: {
        count: 5,
        words: ["um", "like", "you know"],
        percentage: 8
      },
      pauses: {
        count: 3,
        totalDuration: 2.5,
        avgDuration: 0.83
      }
    };
    
    // Generate mock feedback
    const feedback = {
      overall: "Your speech was clear and well-paced.",
      improvements: [
        "Try to reduce filler words like 'um' and 'like'.",
        "Consider using slightly longer pauses between main points."
      ],
      strengths: [
        "Good speaking rate",
        "Clear pronunciation"
      ],
      score: 85
    };
    
    return {
      transcription,
      analytics,
      feedback
    };
  }
  
  /**
   * Check the health status of the mocked API
   */
  async checkServiceHealth(): Promise<{ status: string }> {
    // Always return healthy
    return { status: 'healthy' };
  }
}
