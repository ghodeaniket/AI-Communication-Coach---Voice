import type { AudioData, TranscriptionResult, ProcessingResult } from '../interfaces';

/**
 * Interface for the Results Service
 */
export interface IResultsService {
  saveResult(result: RecordingResult): Promise<string>;
  getResult(id: string): Promise<RecordingResult | null>;
  listResults(limit?: number): Promise<RecordingResultSummary[]>;
  deleteResult(id: string): Promise<boolean>;
}

/**
 * Recording result data structure
 */
export interface RecordingResult {
  id?: string;
  timestamp: number;
  audioData?: Partial<AudioData>;
  transcription: TranscriptionResult;
  analytics: any;
  feedback: any;
  highlights?: any[];
  meta?: {
    duration: number;
    deviceInfo?: string;
    sessionId?: string;
  };
}

/**
 * Summary of recording result for listings
 */
export interface RecordingResultSummary {
  id: string;
  timestamp: number;
  duration: number;
  textPreview: string;
  overallScore?: number;
}

/**
 * Implementation of the Results Service using local storage
 */
export class LocalStorageResultsService implements IResultsService {
  private readonly STORAGE_KEY = 'voice-coach-results';
  
  constructor() {
    console.log('LocalStorageResultsService initialized');
  }
  
  /**
   * Save a new result to local storage
   */
  async saveResult(result: RecordingResult): Promise<string> {
    try {
      // Get existing results
      const existingResults = this.getStoredResults();
      
      // Generate ID if not provided
      const id = result.id || this.generateId();
      
      // Prepare result for storage (add id and ensure timestamp)
      const resultToStore: RecordingResult = {
        ...result,
        id,
        timestamp: result.timestamp || Date.now(),
      };
      
      // Simplify audio data to save space
      if (resultToStore.audioData) {
        // We don't store the actual blob in localStorage as it's too large
        resultToStore.audioData = {
          duration: resultToStore.audioData.duration,
          sampleRate: resultToStore.audioData.sampleRate,
          channels: resultToStore.audioData.channels,
          format: resultToStore.audioData.format,
          size: resultToStore.audioData.size,
        };
      }
      
      // Add to results list
      existingResults[id] = resultToStore;
      
      // Save back to storage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingResults));
      
      return id;
    } catch (error) {
      console.error('Error saving result:', error);
      throw new Error('Failed to save recording result');
    }
  }
  
  /**
   * Get a specific result by ID
   */
  async getResult(id: string): Promise<RecordingResult | null> {
    const results = this.getStoredResults();
    return results[id] || null;
  }
  
  /**
   * List all stored results, optionally limited to a specified count
   */
  async listResults(limit?: number): Promise<RecordingResultSummary[]> {
    const results = this.getStoredResults();
    
    const summaries = Object.values(results)
      .map(result => this.createSummary(result))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
    
    return limit ? summaries.slice(0, limit) : summaries;
  }
  
  /**
   * Delete a stored result
   */
  async deleteResult(id: string): Promise<boolean> {
    try {
      const results = this.getStoredResults();
      
      if (!results[id]) {
        return false;
      }
      
      delete results[id];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
      
      return true;
    } catch (error) {
      console.error('Error deleting result:', error);
      return false;
    }
  }
  
  /**
   * Get all stored results
   */
  private getStoredResults(): Record<string, RecordingResult> {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * Create a summary from a full result
   */
  private createSummary(result: RecordingResult): RecordingResultSummary {
    // Get a preview of the transcription (first 50 characters)
    const textPreview = result.transcription?.text?.substring(0, 50) + 
      (result.transcription?.text?.length > 50 ? '...' : '');
    
    // Calculate overall score if available
    const overallScore = result.feedback?.score !== undefined 
      ? result.feedback.score 
      : undefined;
    
    return {
      id: result.id!,
      timestamp: result.timestamp,
      duration: result.meta?.duration || result.audioData?.duration || 0,
      textPreview,
      overallScore
    };
  }
}

/**
 * API-based implementation of the Results Service
 * Uses backend API for persistence
 */
export class ApiResultsService implements IResultsService {
  private apiEndpoint: string;
  
  constructor() {
    console.log('ApiResultsService initialized');
    this.apiEndpoint = (import.meta.env.VITE_API_ENDPOINT || '') + '/results';
  }
  
  /**
   * Save a result to the API
   */
  async saveResult(result: RecordingResult): Promise<string> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...result,
          timestamp: result.timestamp || Date.now()
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error saving result:', error);
      
      // Fallback to local storage if API fails
      const localService = new LocalStorageResultsService();
      return localService.saveResult(result);
    }
  }
  
  /**
   * Get a specific result from the API
   */
  async getResult(id: string): Promise<RecordingResult | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting result:', error);
      
      // Fallback to local storage if API fails
      const localService = new LocalStorageResultsService();
      return localService.getResult(id);
    }
  }
  
  /**
   * List results from the API
   */
  async listResults(limit?: number): Promise<RecordingResultSummary[]> {
    try {
      const url = new URL(this.apiEndpoint);
      if (limit) {
        url.searchParams.append('limit', limit.toString());
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listing results:', error);
      
      // Fallback to local storage if API fails
      const localService = new LocalStorageResultsService();
      return localService.listResults(limit);
    }
  }
  
  /**
   * Delete a result from the API
   */
  async deleteResult(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/${id}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting result:', error);
      
      // Fallback to local storage if API fails
      const localService = new LocalStorageResultsService();
      return localService.deleteResult(id);
    }
  }
}
