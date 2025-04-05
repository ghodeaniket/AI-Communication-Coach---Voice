import type { IAudioService, AudioOptions, AudioData } from '../../interfaces';

/**
 * A simpler implementation of IAudioService that uses the browser's
 * MediaRecorder API to capture audio from the user's microphone.
 */
export class SimpleAudioService implements IAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
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
    console.log('SimpleAudioService initialized');
  }
  
  /**
   * Configure the audio service with options
   */
  async configure(options: AudioOptions): Promise<boolean> {
    console.log('SimpleAudioService.configure called with:', options);
    this.options = { ...this.options, ...options };
    return true;
  }
  
  /**
   * Start recording audio
   */
  async startRecording(): Promise<boolean> {
    console.log('SimpleAudioService.startRecording called');
    try {
      // Reset audio chunks
      this.audioChunks = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      
      console.log('Microphone access granted');
      
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream);
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('MediaRecorder.ondataavailable', event.data.size);
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Start recording
      console.log('Starting MediaRecorder...');
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.startTime = Date.now();
      
      console.log('MediaRecorder started');
      
      // Trigger event handler
      if (this.onRecordingStart) {
        console.log('Calling onRecordingStart event handler');
        this.onRecordingStart();
      }
      
      // Set up max duration timer
      if (this.options.maxDuration) {
        console.log(`Setting up max duration timer: ${this.options.maxDuration}s`);
        setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            console.log('Max duration reached, stopping recording');
            this.stopRecording().catch(err => console.error('Error stopping recording:', err));
          }
        }, this.options.maxDuration * 1000);
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
    console.log('SimpleAudioService.stopRecording called');
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        console.error('No MediaRecorder available');
        reject(new Error('No MediaRecorder available'));
        return;
      }
      
      if (this.mediaRecorder.state !== 'recording') {
        console.error('MediaRecorder is not recording');
        reject(new Error('Not currently recording'));
        return;
      }
      
      console.log('Setting up MediaRecorder.onstop handler');
      
      // Set up event handler for when recording is stopped
      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
        
        try {
          const duration = (Date.now() - this.startTime) / 1000;
          console.log(`Recording duration: ${duration}s`);
          
          // Create a blob from all the chunks
          console.log(`Creating blob from ${this.audioChunks.length} chunks`);
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          console.log(`Blob created, size: ${audioBlob.size} bytes`);
          
          // Create AudioData object
          const audioData: AudioData = {
            blob: audioBlob,
            duration,
            sampleRate: this.options.sampleRate || 44100,
            channels: this.options.channels || 1,
            format: 'webm',
            size: audioBlob.size
          };
          
          // Stop tracks and clean up MediaStream
          console.log('Stopping MediaStream tracks');
          this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
          
          // Trigger event handler
          if (this.onRecordingStop) {
            console.log('Calling onRecordingStop event handler');
            this.onRecordingStop(audioData);
          }
          
          resolve(audioData);
        } catch (error) {
          console.error('Error in onstop handler:', error);
          reject(error);
        }
      };
      
      // Stop the recording
      console.log('Stopping MediaRecorder...');
      this.mediaRecorder.stop();
    });
  }
  
  /**
   * Optimize the audio data (stub implementation)
   */
  async optimizeAudio(audio: AudioData): Promise<AudioData> {
    console.log('SimpleAudioService.optimizeAudio called');
    // Just return the original audio data
    return audio;
  }
}
