/**
 * Core backend service interfaces for Voice Coach application
 */

// Common Types

export interface AudioData {
  blob?: Blob;         // Not used in backend directly
  buffer?: Buffer;     // Buffer representation for backend processing
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
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

export interface FillerWordAnalysis {
  totalCount: number;
  words: Array<{
    word: string;
    count: number;
    timestamps: number[];
  }>;
  density: number; // Occurrences per minute
}

export interface SpeakingRateAnalysis {
  wordsPerMinute: number;
  totalWords: number;
  duration: number; // In seconds
  recommendation?: string; // Optional recommendation based on rate
}

export interface PauseAnalysis {
  totalPauses: number;
  averagePauseDuration: number; // In seconds
  longPauses: Array<{
    startTime: number;
    endTime: number;
    duration: number;
  }>;
  pauseDistribution: {
    short: number; // < 1 second
    medium: number; // 1-2 seconds
    long: number; // > 2 seconds
  };
}

export interface SpeechAnalytics {
  fillerWords: FillerWordAnalysis;
  speakingRate: SpeakingRateAnalysis;
  pauses: PauseAnalysis;
  transcription: TranscriptionResult;
}

export interface HighlightedTranscript {
  fullText: string;
  highlights: Array<{
    type: 'filler_word' | 'pause' | 'fast_speech' | 'slow_speech';
    startIdx: number;
    endIdx: number;
    metadata?: any;
  }>;
}

export interface FeedbackResult {
  overallScore: number; // 0-100
  strengths: string[];
  improvements: string[];
  detailedFeedback: {
    fillerWords: string;
    speakingRate: string;
    pauses: string;
    general: string;
  };
  highlightedTranscript: HighlightedTranscript;
}

export enum FeedbackLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// Service Interfaces

export interface ITranscriptionService {
  transcribe(audio: AudioData): Promise<TranscriptionResult>;
  setModel(model: string): void;
  getStatus(): string;
}

export interface ISpeechAnalyticsService {
  analyze(transcription: TranscriptionResult): Promise<SpeechAnalytics>;
  detectFillerWords(transcription: TranscriptionResult): FillerWordAnalysis;
  analyzeSpeakingRate(transcription: TranscriptionResult): SpeakingRateAnalysis;
  detectPauses(transcription: TranscriptionResult): PauseAnalysis;
}

export interface IFeedbackService {
  generateFeedback(analytics: SpeechAnalytics): Promise<FeedbackResult>;
  setFeedbackLevel(level: FeedbackLevel): void;
  generateTranscriptWithHighlights(
    transcription: TranscriptionResult, 
    analytics: SpeechAnalytics
  ): HighlightedTranscript;
}

export interface IStorageService {
  saveResult(userId: string, result: any): Promise<string>; // Returns recordingId
  getResult(userId: string, recordingId: string): Promise<any>;
  getUserResults(userId: string): Promise<any[]>;
  deleteResult(userId: string, recordingId: string): Promise<boolean>;
}

// Request/Response Types for Lambda Handlers

export interface TranscriptionRequest {
  audio: {
    data: string; // Base64 encoded audio data
    format: string;
    sampleRate: number;
    duration: number;
    channels: number;
    size: number;
  };
}

export interface AnalyticsRequest {
  transcription: TranscriptionResult;
}

export interface FeedbackRequest {
  analytics: SpeechAnalytics;
  level?: FeedbackLevel;
}

export interface StorageRequest {
  userId: string;
  recordingId?: string;
  data?: any;
}
