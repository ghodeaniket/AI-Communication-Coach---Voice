import { Injectable, ServiceLifetime } from '../di-container';
import type { ITranscriptionService, AudioData, TranscriptionResult } from '../interfaces';

/**
 * Status values for transcription service
 */
export enum TranscriptionStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Mock implementation of the Transcription Service
 */
@Injectable(ServiceLifetime.SINGLETON)
export class MockTranscriptionService implements ITranscriptionService {
  private model: string = 'whisper-1';
  private status: TranscriptionStatus = TranscriptionStatus.IDLE;
  
  // Event handlers
  public onTranscriptionComplete?: (result: TranscriptionResult) => void;
  
  constructor() {
    console.log('MockTranscriptionService initialized');
  }
  
  /**
   * Set the transcription model
   */
  setModel(model: string): void {
    this.model = model;
    console.log(`Transcription model set to: ${model}`);
  }
  
  /**
   * Get the current status of the service
   */
  getStatus(): string {
    return this.status;
  }
  
  /**
   * Transcribe audio data
   */
  async transcribe(audio: AudioData): Promise<TranscriptionResult> {
    this.status = TranscriptionStatus.PROCESSING;
    console.log('Transcribing audio...', audio);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create mock response based on audio duration
    const words = [
      'hello', 'world', 'this', 'is', 'a', 'mock', 'transcription', 
      'service', 'for', 'development', 'and', 'testing', 'purposes',
      'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'
    ];
    
    // Generate random text based on audio duration
    const wordCount = Math.max(5, Math.floor(audio.duration * 2));
    const text = Array.from({ length: wordCount }, () => 
      words[Math.floor(Math.random() * words.length)]
    ).join(' ');
    
    // Generate word timings
    const wordTimings = text.split(' ').map((word, index) => {
      const startTime = (index * audio.duration) / wordCount;
      const endTime = ((index + 1) * audio.duration) / wordCount;
      
      return {
        word,
        startTime,
        endTime,
        confidence: 0.8 + Math.random() * 0.2
      };
    });
    
    // Create result
    const result: TranscriptionResult = {
      text,
      confidence: 0.95,
      duration: audio.duration,
      wordTimings
    };
    
    this.status = TranscriptionStatus.COMPLETED;
    
    // Trigger event handler
    if (this.onTranscriptionComplete) {
      this.onTranscriptionComplete(result);
    }
    
    return result;
  }
}

/**
 * API-based implementation of the Transcription Service
 * Will call real API endpoint
 */
@Injectable(ServiceLifetime.SINGLETON)
export class ApiTranscriptionService implements ITranscriptionService {
  private model: string = 'whisper-1';
  private status: TranscriptionStatus = TranscriptionStatus.IDLE;
  private apiEndpoint: string;
  
  // Event handlers
  public onTranscriptionComplete?: (result: TranscriptionResult) => void;
  
  constructor() {
    console.log('ApiTranscriptionService initialized');
    this.apiEndpoint = (import.meta.env.VITE_API_ENDPOINT || '') + '/transcribe';
  }
  
  /**
   * Set the transcription model
   */
  setModel(model: string): void {
    this.model = model;
  }
  
  /**
   * Get the current status of the service
   */
  getStatus(): string {
    return this.status;
  }
  
  /**
   * Transcribe audio data by sending to API
   */
  async transcribe(audio: AudioData): Promise<TranscriptionResult> {
    try {
      this.status = TranscriptionStatus.PROCESSING;
      
      // Create form data with audio
      const formData = new FormData();
      formData.append('audio', audio.blob, 'recording.webm');
      formData.append('model', this.model);
      
      // Send to API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map API response to TranscriptionResult
      const result: TranscriptionResult = {
        text: data.result.text,
        confidence: data.result.confidence,
        duration: audio.duration,
        wordTimings: data.result.wordTimings
      };
      
      this.status = TranscriptionStatus.COMPLETED;
      
      // Trigger event handler
      if (this.onTranscriptionComplete) {
        this.onTranscriptionComplete(result);
      }
      
      return result;
    } catch (error) {
      this.status = TranscriptionStatus.ERROR;
      console.error('Transcription error:', error);
      throw error;
    }
  }
}
