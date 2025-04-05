import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserAudioService } from '../BrowserAudioService';
import type { AudioData } from '../../interfaces';

// Mock implementations
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as any,
  onstop: null as any,
  state: 'inactive',
};

const mockMediaStream = {
  getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
};

const mockAudioContext = {
  createBuffer: vi.fn(),
  decodeAudioData: vi.fn(),
  createBufferSource: vi.fn(),
  createGain: vi.fn(),
};

describe('BrowserAudioService', () => {
  let audioService: BrowserAudioService;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup MediaRecorder mock
    global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder);
    
    // Setup navigator.mediaDevices.getUserMedia mock
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
    } as any;
    
    // Setup AudioContext mock
    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;
    global.OfflineAudioContext = vi.fn().mockImplementation(() => ({
      ...mockAudioContext,
      startRendering: vi.fn().mockResolvedValue({}),
    })) as any;
    
    // Setup window.setTimeout mock
    global.setTimeout = vi.fn().mockReturnValue(123);
    global.clearTimeout = vi.fn();
    
    // Create a new instance for each test
    audioService = new BrowserAudioService();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('configure', () => {
    it('should apply default options when none provided', async () => {
      const result = await audioService.configure({});
      expect(result).toBe(true);
      expect(AudioContext).toHaveBeenCalledWith(expect.objectContaining({
        sampleRate: 44100,
      }));
    });
    
    it('should override default options with provided options', async () => {
      const options = {
        sampleRate: 48000,
        channels: 2,
        reduceNoise: false,
      };
      
      const result = await audioService.configure(options);
      expect(result).toBe(true);
      expect(AudioContext).toHaveBeenCalledWith(expect.objectContaining({
        sampleRate: 48000,
      }));
    });
  });
  
  describe('startRecording', () => {
    it('should request microphone access and start recording', async () => {
      await audioService.configure({});
      const result = await audioService.startRecording();
      
      expect(result).toBe(true);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }),
        video: false,
      });
      
      expect(MediaRecorder).toHaveBeenCalledWith(
        mockMediaStream,
        expect.objectContaining({ mimeType: 'audio/webm' })
      );
      
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(100);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 120000);
    });
    
    it('should trigger onRecordingStart event if defined', async () => {
      const onStartSpy = vi.fn();
      audioService.onRecordingStart = onStartSpy;
      
      await audioService.configure({});
      await audioService.startRecording();
      
      expect(onStartSpy).toHaveBeenCalled();
    });
    
    it('should return false if already recording', async () => {
      await audioService.configure({});
      
      // First recording
      await audioService.startRecording();
      
      // Mock that we're already recording
      mockMediaRecorder.state = 'recording';
      
      // Try to start another recording
      const result = await audioService.startRecording();
      expect(result).toBe(false);
    });
  });
  
  describe('stopRecording', () => {
    beforeEach(async () => {
      await audioService.configure({});
      await audioService.startRecording();
      
      // Mock that we're recording
      mockMediaRecorder.state = 'recording';
      
      // Mock the data available event
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) } as BlobEvent);
      }
    });
    
    it('should stop recording and return audio data', async () => {
      const stopPromise = audioService.stopRecording();
      
      // Simulate the mediaRecorder.onstop event
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop(new Event('stop'));
      }
      
      const result = await stopPromise;
      
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(clearTimeout).toHaveBeenCalledWith(123);
      expect(mockMediaStream.getTracks).toHaveBeenCalled();
      
      expect(result).toMatchObject({
        format: 'webm',
        sampleRate: 44100,
        channels: 1,
      });
      expect(result.blob).toBeInstanceOf(Blob);
    });
    
    it('should trigger onRecordingStop event if defined', async () => {
      const onStopSpy = vi.fn();
      audioService.onRecordingStop = onStopSpy;
      
      const stopPromise = audioService.stopRecording();
      
      // Simulate the mediaRecorder.onstop event
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop(new Event('stop'));
      }
      
      await stopPromise;
      
      expect(onStopSpy).toHaveBeenCalledWith(expect.objectContaining({
        format: 'webm',
        sampleRate: 44100,
        channels: 1,
      }));
    });
    
    it('should reject if no active recording', async () => {
      // Mock that we're not recording
      mockMediaRecorder.state = 'inactive';
      
      await expect(audioService.stopRecording()).rejects.toThrow('No active recording');
    });
  });
  
  describe('optimizeAudio', () => {
    it('should return original audio if no optimization is needed', async () => {
      await audioService.configure({
        reduceNoise: false,
        normalizeVolume: false,
      });
      
      const testAudio: AudioData = {
        blob: new Blob(['test'], { type: 'audio/webm' }),
        duration: 10,
        sampleRate: 44100,
        channels: 1,
        format: 'webm',
        size: 100,
      };
      
      const result = await audioService.optimizeAudio(testAudio);
      expect(result).toBe(testAudio);
    });
    
    // More tests would be added for the optimization features
    // but they require more complex mocking of AudioContext methods
  });
});
