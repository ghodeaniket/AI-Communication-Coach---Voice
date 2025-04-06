import type { IAudioService, AudioOptions, AudioData } from '../interfaces';
import { config } from '../config/environment';

/**
 * Browser-based implementation of IAudioService that uses the browser's
 * MediaRecorder API to capture audio from the user's microphone.
 */
export class BrowserAudioService implements IAudioService {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private recordingTimer: number | null = null;
  private gainNode: GainNode | null = null;
  
  // Configuration options with defaults from environment config
  private options: Required<AudioOptions> = {
    sampleRate: config.audio.sampleRate,
    channels: 1,
    reduceNoise: config.audio.noiseReduction,
    normalizeVolume: true,
    maxDuration: config.audio.maxRecordingDuration,
  };

  // Event handlers
  public onRecordingStart?: () => void;
  public onRecordingStop?: (audio: AudioData) => void;

  /**
   * Configure the audio service with the provided options
   * @param options - Audio configuration options
   * @returns Promise resolving to true if configuration was successful
   */
  public async configure(options: AudioOptions): Promise<boolean> {
    try {
      // Merge provided options with defaults
      this.options = { ...this.options, ...options };
      
      // Initialize AudioContext if not already done
      if (!this.audioContext) {
        this.audioContext = new AudioContext({
          sampleRate: this.options.sampleRate,
          latencyHint: 'interactive',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to configure audio service:', error);
      return false;
    }
  }

  /**
   * Start recording audio from the user's microphone
   * @returns Promise resolving to true if recording started successfully
   */
  public async startRecording(): Promise<boolean> {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        console.warn('Already recording');
        return false;
      }

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.options.channels,
          echoCancellation: this.options.reduceNoise,
          noiseSuppression: this.options.reduceNoise,
          autoGainControl: this.options.normalizeVolume,
        },
        video: false,
      });

      // Reset audio chunks
      this.audioChunks = [];
      
      // Create and configure MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm',
      });

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.startTime = Date.now();
      
      // Set up a timer to stop recording after maxDuration
      if (this.options.maxDuration > 0) {
        this.recordingTimer = window.setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            this.stopRecording().catch(console.error);
          }
        }, this.options.maxDuration * 1000);
      }

      // Trigger event if defined
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
   * Stop the current recording session
   * @returns Promise resolving to the recorded AudioData
   */
  public async stopRecording(): Promise<AudioData> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('No active recording'));
        return;
      }

      // Clear the max duration timer if it exists
      if (this.recordingTimer !== null) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }

      // Set up event handler for when recording is stopped
      this.mediaRecorder.onstop = async () => {
        try {
          const duration = (Date.now() - this.startTime) / 1000;
          
          // Create a blob from all the chunks
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Create AudioData object
          const audioData: AudioData = {
            blob: audioBlob,
            duration,
            sampleRate: this.options.sampleRate,
            channels: this.options.channels,
            format: 'webm',
            size: audioBlob.size,
          };

          // Stop tracks and clean up MediaStream
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }

          // Trigger event if defined
          if (this.onRecordingStop) {
            this.onRecordingStop(audioData);
          }

          resolve(audioData);
        } catch (error) {
          reject(error);
        }
      };

      // Stop the recording
      this.mediaRecorder.stop();
    });
  }

  /**
   * Optimize the audio data for better quality or smaller size
   * @param audio - The audio data to optimize
   * @returns Promise resolving to the optimized audio data
   */
  public async optimizeAudio(audio: AudioData): Promise<AudioData> {
    // Skip optimization if neither noise reduction nor volume normalization is enabled
    if (!this.options.reduceNoise && !this.options.normalizeVolume) {
      return audio;
    }

    try {
      // Convert the Blob to an ArrayBuffer
      const arrayBuffer = await audio.blob.arrayBuffer();
      
      // Initialize AudioContext if not already done
      if (!this.audioContext) {
        this.audioContext = new AudioContext({
          sampleRate: this.options.sampleRate,
        });
      }
      
      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create a new AudioBuffer with the same properties
      const optimizedBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Process each channel
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = optimizedBuffer.getChannelData(channel);
        
        // Apply optimizations
        if (this.options.normalizeVolume) {
          this.normalizeVolume(inputData, outputData);
        } else {
          // Just copy the data if no normalization
          outputData.set(inputData);
        }
      }
      
      // Convert AudioBuffer back to Blob
      const optimizedBlob = await this.audioBufferToBlob(optimizedBuffer);
      
      // Return new AudioData with optimized blob
      return {
        ...audio,
        blob: optimizedBlob,
        size: optimizedBlob.size,
      };
    } catch (error) {
      console.error('Audio optimization failed:', error);
      // Return original audio if optimization fails
      return audio;
    }
  }

  /**
   * Normalize the volume of an audio buffer
   * @param inputData - Source audio data
   * @param outputData - Target buffer to write normalized data
   */
  private normalizeVolume(inputData: Float32Array, outputData: Float32Array): void {
    // Find the maximum amplitude
    let maxAmplitude = 0;
    for (let i = 0; i < inputData.length; i++) {
      const absValue = Math.abs(inputData[i]);
      if (absValue > maxAmplitude) {
        maxAmplitude = absValue;
      }
    }
    
    // Skip normalization if the signal is too quiet
    if (maxAmplitude < 0.01) {
      outputData.set(inputData);
      return;
    }
    
    // Calculate the normalization factor (target 95% of max amplitude)
    const normalizationFactor = 0.95 / maxAmplitude;
    
    // Apply normalization
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] * normalizationFactor;
    }
  }

  /**
   * Convert an AudioBuffer to a Blob
   * @param audioBuffer - The AudioBuffer to convert
   * @returns Promise resolving to a Blob
   */
  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    // Create an offline audio context for rendering
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Create a source node
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to destination
    source.connect(offlineContext.destination);
    
    // Start playback
    source.start(0);
    
    // Render audio
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV format
    const wavBlob = this.encodeWAV(renderedBuffer);
    return new Blob([wavBlob], { type: 'audio/wav' });
  }

  /**
   * Encode AudioBuffer as WAV
   * @param audioBuffer - The AudioBuffer to encode
   * @returns ArrayBuffer containing WAV data
   */
  private encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numChannels * numSamples * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // format code (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true); // bits per sample
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    let offset = 44;
    const channels = [];
    
    // Extract channel data
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    // Interleave channel data and convert to 16-bit PCM
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        // Clamp values to [-1, 1] range
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        // Convert to 16-bit signed integer
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }
  
  /**
   * Write a string to a DataView
   * @param view - The DataView to write to
   * @param offset - The offset to start writing at
   * @param string - The string to write
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
