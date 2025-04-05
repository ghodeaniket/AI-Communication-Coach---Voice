// Core service interfaces for Voice Coach application

// Audio Service Interface
export interface IAudioService {
  // Configuration
  configure(options: AudioOptions): Promise<boolean>;
  
  // Recording Management
  startRecording(): Promise<boolean>;
  stopRecording(): Promise<AudioData>;
  
  // Audio Processing
  optimizeAudio(audio: AudioData): Promise<AudioData>;
  
  // Events
  onRecordingStart?: () => void;
  onRecordingStop?: (audio: AudioData) => void;
}

export interface AudioOptions {
  sampleRate?: number;
  channels?: number;
  reduceNoise?: boolean;
  normalizeVolume?: boolean;
  maxDuration?: number;
}

export interface AudioData {
  blob: Blob;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

// Transcription Service Interface
export interface ITranscriptionService {
  transcribe(audio: AudioData): Promise<TranscriptionResult>;
  setModel(model: string): void;
  getStatus(): string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  wordTimings?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

// State Management Service Interface
export interface IStateService {
  getCurrentState(): string;
  transition(newState: string): boolean;
  getStateData<T>(key: string): T | null;
  setStateData<T>(key: string, data: T): void;
  subscribe(observer: { update: (state: string, data: any) => void }): void;
}

// API Client Interface
export interface IAPIClient {
  processAudio(audio: AudioData): Promise<ProcessingResult>;
  checkServiceHealth(): Promise<{ status: string }>;
  setEndpoint(endpoint: string): void;
  setTimeout(timeoutMs: number): void;
}

export interface ProcessingResult {
  transcription: TranscriptionResult;
  analytics: any;
  feedback: any;
}
