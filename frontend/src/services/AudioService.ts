import type { IAudioService, AudioOptions, AudioData } from '../interfaces';

/**
 * Browser-based implementation of the Audio Service
 */
export class BrowserAudioService implements IAudioService {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private options: AudioOptions = {
    sampleRate: 44100,
    channels: 1,
    reduceNoise: true,
    normalizeVolume: true,
    maxDuration: 120
  };
  
  // Event handlers
  public onRecordingStart?: () => void;
  public onRecordingStop?: (audio: AudioData) => void;
  
  constructor() {
    console.log('BrowserAudioService initialized');
  }
  
  /**
   * Configure the audio service with options
   */
  async configure(options: AudioOptions): Promise<boolean> {
    try {
      this.options = { ...this.options, ...options };
      
      // Initialize AudioContext
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.options.sampleRate
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to configure audio service:', error);
      return false;
    }
  }
  
  /**
   * Start recording audio
   */
  async startRecording(): Promise<boolean> {
    try {
      // Reset audio chunks
      this.audioChunks = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream);
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Calculate duration
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        
        // Create AudioData object
        const audioData: AudioData = {
          blob: audioBlob,
          duration,
          sampleRate: this.options.sampleRate || 44100,
          channels: this.options.channels || 1,
          format: 'webm',
          size: audioBlob.size
        };
        
        // Apply optimizations
        const optimizedAudio = await this.optimizeAudio(audioData);
        
        // Trigger event handler
        if (this.onRecordingStop) {
          this.onRecordingStop(optimizedAudio);
        }
      };
      
      // Start recording
      this.mediaRecorder.start();
      this.recordingStartTime = Date.now();
      
      // Set up max duration timer
      if (this.options.maxDuration) {
        setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            this.stopRecording();
          }
        }, this.options.maxDuration * 1000);
      }
      
      // Trigger event handler
      if (this.onRecordingStart) {
        this.onRecordingStart();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }
  
  /**
   * Stop recording audio
   */
  async stopRecording(): Promise<AudioData> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('Not currently recording'));
        return;
      }
      
      // Create one-time event handler to resolve the promise
      const originalOnStop = this.mediaRecorder.onstop;
      this.mediaRecorder.onstop = async (event) => {
        // Call original handler
        if (originalOnStop) {
          originalOnStop.call(this.mediaRecorder, event);
        }
        
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Calculate duration
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        
        // Create AudioData object
        const audioData: AudioData = {
          blob: audioBlob,
          duration,
          sampleRate: this.options.sampleRate || 44100,
          channels: this.options.channels || 1,
          format: 'webm',
          size: audioBlob.size
        };
        
        // Apply optimizations
        const optimizedAudio = await this.optimizeAudio(audioData);
        
        resolve(optimizedAudio);
      };
      
      // Stop recording
      this.mediaRecorder.stop();
      
      // Stop all tracks in the stream
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
    });
  }
  
  /**
   * Optimize audio data (placeholder implementation)
   */
  async optimizeAudio(audio: AudioData): Promise<AudioData> {
    // In a real implementation, this would apply noise reduction and normalization
    // For now, we'll just return the original audio
    return audio;
  }
}

/**
 * Mock implementation for testing or development
 */
export class MockAudioService implements IAudioService {
  private options: AudioOptions = {
    sampleRate: 44100,
    channels: 1,
    reduceNoise: true,
    normalizeVolume: true,
    maxDuration: 120
  };
  
  private isRecording: boolean = false;
  
  // Event handlers
  public onRecordingStart?: () => void;
  public onRecordingStop?: (audio: AudioData) => void;
  
  constructor() {
    console.log('MockAudioService initialized');
  }
  
  async configure(options: AudioOptions): Promise<boolean> {
    this.options = { ...this.options, ...options };
    return true;
  }
  
  async startRecording(): Promise<boolean> {
    this.isRecording = true;
    
    if (this.onRecordingStart) {
      this.onRecordingStart();
    }
    
    // Simulate recording for 3 seconds then auto-stop
    setTimeout(() => {
      if (this.isRecording) {
        this.stopRecording();
      }
    }, 3000);
    
    return true;
  }
  
  async stopRecording(): Promise<AudioData> {
    if (!this.isRecording) {
      throw new Error('Not currently recording');
    }
    
    this.isRecording = false;
    
    // Create mock audio data
    const audioData: AudioData = {
      blob: new Blob(['mock audio data'], { type: 'audio/webm' }),
      duration: 3,
      sampleRate: this.options.sampleRate || 44100,
      channels: this.options.channels || 1,
      format: 'webm',
      size: 1024
    };
    
    // Apply optimizations
    const optimizedAudio = await this.optimizeAudio(audioData);
    
    // Trigger event handler
    if (this.onRecordingStop) {
      this.onRecordingStop(optimizedAudio);
    }
    
    return optimizedAudio;
  }
  
  async optimizeAudio(audio: AudioData): Promise<AudioData> {
    // Mock optimization - just return the same data
    return audio;
  }
}
