/**
 * Local Transcription Service for development
 * 
 * This implementation provides a simplified but functional transcription service
 * that works locally without requiring external API calls. It uses the browser's
 * SpeechRecognition API when available, and falls back to mock responses when not.
 */

import type { ITranscriptionService, AudioData, TranscriptionResult } from '../../interfaces';
import { config } from '../../config/environment';

export class LocalTranscriptionService implements ITranscriptionService {
  private model: string = 'browser-recognition';
  private status: string = 'idle';
  private speechRecognitionSupported: boolean;
  
  // Event callback
  public onTranscriptionComplete?: (result: TranscriptionResult) => void;
  
  constructor() {
    // Check if browser supports SpeechRecognition
    this.speechRecognitionSupported = 'webkitSpeechRecognition' in window || 
                                     'SpeechRecognition' in window;
  }
  
  /**
   * Set the transcription model to use
   * @param model - Model identifier
   */
  public setModel(model: string): void {
    this.model = model;
  }
  
  /**
   * Get the current status of the transcription service
   * @returns Status string
   */
  public getStatus(): string {
    return this.status;
  }
  
  /**
   * Transcribe audio data to text
   * @param audio - Audio data to transcribe
   * @returns Promise resolving to transcription result
   */
  public async transcribe(audio: AudioData): Promise<TranscriptionResult> {
    this.status = 'processing';
    
    try {
      let result: TranscriptionResult;
      
      if (this.speechRecognitionSupported && config.localServices?.useSpeechRecognition && !config.useMockServices) {
        // Use browser's SpeechRecognition API
        result = await this.useBrowserRecognition(audio);
      } else {
        // Fall back to mock implementation
        result = await this.useMockTranscription(audio);
      }
      
      this.status = 'completed';
      
      // Trigger completion callback if defined
      if (this.onTranscriptionComplete) {
        this.onTranscriptionComplete(result);
      }
      
      return result;
    } catch (error) {
      this.status = 'error';
      console.error('Transcription error:', error);
      throw error;
    }
  }
  
  /**
   * Use browser's SpeechRecognition API for transcription
   * @param audio - Audio data to transcribe
   * @returns Promise resolving to transcription result
   */
  private async useBrowserRecognition(audio: AudioData): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      // Define SpeechRecognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('SpeechRecognition not supported in this browser'));
        return;
      }
      
      try {
        // Create audio URL from blob
        const audioURL = URL.createObjectURL(audio.blob);
        const audioElement = new Audio(audioURL);
        
        // Set up recognition
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;
        
        // Store results
        let transcriptText = '';
        
        // Handle results
        recognition.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            transcriptText += (i > 0 ? ' ' : '') + transcript;
          }
        };
        
        // Handle end of speech
        recognition.onend = () => {
          // Stop audio playback
          audioElement.pause();
          URL.revokeObjectURL(audioURL);
          
          // Create result
          const result: TranscriptionResult = {
            text: transcriptText || 'No speech detected. Please try again.',
            confidence: 0.8,
            duration: audio.duration,
            wordTimings: this.generateMockWordTimings(transcriptText, audio.duration)
          };
          
          resolve(result);
        };
        
        // Handle errors
        recognition.onerror = (event) => {
          audioElement.pause();
          URL.revokeObjectURL(audioURL);
          reject(new Error(`Speech recognition error: ${event.error}`));
        };
        
        // Start recognition and audio playback simultaneously
        recognition.start();
        audioElement.play();
        
        // Stop recognition when audio ends
        audioElement.onended = () => {
          recognition.stop();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Fallback mock transcription implementation
   * @param audio - Audio data to transcribe
   * @returns Promise resolving to transcription result
   */
  private async useMockTranscription(audio: AudioData): Promise<TranscriptionResult> {
    // Get configuration for simulation
    const { simulateNetworkDelay, networkDelayMs } = config.localServices || 
      { simulateNetworkDelay: true, networkDelayMs: 500 };
    
    // Simulate processing delay based on configuration
    const processingTime = simulateNetworkDelay 
      ? Math.min(networkDelayMs || 500, audio.duration * 200)
      : 0;
    
    // Create mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTexts = [
          "Hello, this is a local transcription test. The system is working correctly.",
          "I'm practicing my communication skills using an AI coach application.",
          "Voice-based communication is important for conveying ideas clearly and concisely.",
          "When speaking in public, remember to pace yourself and use pauses effectively.",
          "Effective communication involves not just what you say, but how you say it."
        ];
        
        // Select a random text or use the first one
        const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        
        // Create the result
        const result: TranscriptionResult = {
          text,
          confidence: 0.95,
          duration: audio.duration,
          wordTimings: this.generateMockWordTimings(text, audio.duration)
        };
        
        // Log in development mode
        if (config.debug) {
          console.log('LocalTranscriptionService - Generated mock transcription:', result);
        }
        
        resolve(result);
      }, processingTime);
    });
  }
  
  /**
   * Generate mock word timings for visualization
   * @param text - Transcription text
   * @param totalDuration - Audio duration in seconds
   * @returns Array of word timing objects
   */
  private generateMockWordTimings(text: string, totalDuration: number): TranscriptionResult['wordTimings'] {
    // Split text into words
    const words = text.split(/\s+/);
    
    if (words.length === 0) {
      return [];
    }
    
    // Calculate average time per word
    const timePerWord = totalDuration / words.length;
    
    // Generate timing for each word
    return words.map((word, index) => {
      const startTime = index * timePerWord;
      const endTime = startTime + timePerWord;
      
      return {
        word,
        startTime,
        endTime,
        confidence: 0.8 + Math.random() * 0.2 // Random confidence between 0.8 and 1.0
      };
    });
  }
}
