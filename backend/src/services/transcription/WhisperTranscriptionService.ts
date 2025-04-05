import { OpenAI } from 'openai';
import { AudioData, ITranscriptionService, TranscriptionResult } from '../../interfaces';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Service responsible for transcribing audio using OpenAI's Whisper API
 */
export class WhisperTranscriptionService implements ITranscriptionService {
  private client: OpenAI;
  private model: string;
  private status: string = 'idle';
  private apiKey: string;

  /**
   * Creates a new WhisperTranscriptionService instance
   * @param apiKey OpenAI API key (defaults to process.env.OPENAI_API_KEY)
   * @param model Whisper model to use (defaults to 'whisper-1')
   */
  constructor(apiKey?: string, model: string = 'whisper-1') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for WhisperTranscriptionService');
    }
    
    this.client = new OpenAI({
      apiKey: this.apiKey
    });
    
    this.model = model;
  }

  /**
   * Sets the Whisper model to use
   * @param model Whisper model name
   */
  public setModel(model: string): void {
    this.model = model;
  }

  /**
   * Gets the current status of the transcription service
   * @returns Current status
   */
  public getStatus(): string {
    return this.status;
  }

  /**
   * Transcribes audio using OpenAI's Whisper API
   * @param audio Audio data to transcribe
   * @returns TranscriptionResult with text and confidence
   */
  public async transcribe(audio: AudioData): Promise<TranscriptionResult> {
    try {
      this.status = 'processing';
      
      // Validate audio data
      if (!audio.buffer) {
        throw new Error('Audio buffer is required for transcription');
      }
      
      // Create a temporary file for the OpenAI API
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `audio_${Date.now()}.${audio.format || 'mp3'}`);
      
      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, audio.buffer);
      
      // Start measuring processing time
      const startTime = Date.now();
      
      try {
        // Call OpenAI API
        const response = await this.client.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: this.model,
          response_format: 'verbose_json',
        });
        
        // Calculate processing time
        const processingTime = (Date.now() - startTime) / 1000;
        
        // Check if response is in the expected format
        if (!response.text) {
          throw new Error('Unexpected response format from Whisper API');
        }
        
        // Extract word timings if available
        const wordTimings = response.words ? response.words.map(word => ({
          word: word.word,
          startTime: word.start ?? 0,
          endTime: word.end ?? 0,
          confidence: 0.95 // Default confidence since it's not provided by the API
        })) : undefined;
        
        // Create result object
        const result: TranscriptionResult = {
          text: response.text,
          confidence: 0.95, // Default confidence since it's not provided by the API
          duration: audio.duration,
          wordTimings
        };
        
        // Update status
        this.status = 'idle';
        
        // Return result
        return result;
      } finally {
        // Clean up the temporary file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      }
      
    } catch (error) {
      // Update status on error
      this.status = 'error';
      
      // Re-throw the error with more context
      throw error instanceof Error 
        ? new Error(`Transcription failed: ${error.message}`) 
        : new Error('Transcription failed: Unknown error');
    }
  }
  
  /**
   * A fallback method for testing or when API is unavailable
   * @param audio Audio data
   * @returns Mocked transcription result
   */
  public async mockTranscribe(audio: AudioData): Promise<TranscriptionResult> {
    // Wait to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock result
    return {
      text: "This is a mock transcription for development or testing purposes.",
      confidence: 0.95,
      duration: audio.duration,
      wordTimings: [
        { word: "This", startTime: 0.0, endTime: 0.2, confidence: 0.98 },
        { word: "is", startTime: 0.2, endTime: 0.3, confidence: 0.99 },
        { word: "a", startTime: 0.3, endTime: 0.4, confidence: 0.99 },
        { word: "mock", startTime: 0.4, endTime: 0.7, confidence: 0.96 },
        { word: "transcription", startTime: 0.7, endTime: 1.5, confidence: 0.94 },
        { word: "for", startTime: 1.5, endTime: 1.7, confidence: 0.97 },
        { word: "development", startTime: 1.7, endTime: 2.3, confidence: 0.95 },
        { word: "or", startTime: 2.3, endTime: 2.4, confidence: 0.99 },
        { word: "testing", startTime: 2.4, endTime: 2.8, confidence: 0.97 },
        { word: "purposes", startTime: 2.8, endTime: 3.3, confidence: 0.95 }
      ]
    };
  }
}
