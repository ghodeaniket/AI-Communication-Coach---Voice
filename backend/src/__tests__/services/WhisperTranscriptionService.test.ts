import { WhisperTranscriptionService } from '../../services/transcription';
import { AudioData } from '../../interfaces';
import * as fs from 'fs';

// Mock OpenAI client
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        audio: {
          transcriptions: {
            create: jest.fn().mockResolvedValue({
              text: 'This is a mock transcription response',
              words: [
                { word: 'This', start: 0.0, end: 0.2 },
                { word: 'is', start: 0.2, end: 0.3 },
                { word: 'a', start: 0.3, end: 0.4 },
                { word: 'mock', start: 0.4, end: 0.7 },
                { word: 'transcription', start: 0.7, end: 1.5 },
                { word: 'response', start: 1.5, end: 2.0 }
              ]
            })
          }
        }
      };
    })
  };
});

// Mock file system
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue({}),
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn()
}));

describe('WhisperTranscriptionService', () => {
  // Store original environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Set up a mock API key for tests
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  it('should initialize with provided API key', () => {
    const service = new WhisperTranscriptionService('custom-api-key');
    expect(service).toBeDefined();
    expect(service.getStatus()).toBe('idle');
  });
  
  it('should initialize with environment API key', () => {
    const service = new WhisperTranscriptionService();
    expect(service).toBeDefined();
  });
  
  it('should throw error if no API key is provided', () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => new WhisperTranscriptionService()).toThrow();
  });
  
  it('should set model correctly', () => {
    const service = new WhisperTranscriptionService('test-api-key');
    service.setModel('whisper-2');
    // Note: We can't directly test the private model property,
    // but we could extend the test to verify the model is used correctly
  });
  
  it('should transcribe audio successfully', async () => {
    const service = new WhisperTranscriptionService('test-api-key');
    
    // Create mock audio data
    const audioData: AudioData = {
      buffer: Buffer.from('mock audio data'),
      format: 'mp3',
      duration: 5.0,
      sampleRate: 44100,
      channels: 2,
      size: 1024
    };
    
    // Test transcription
    const result = await service.transcribe(audioData);
    
    // Verify result
    expect(result).toBeDefined();
    expect(result.text).toBe('This is a mock transcription response');
    expect(result.confidence).toBe(0.95);
    expect(result.duration).toBe(5.0);
    expect(result.wordTimings?.length).toBe(6);
    
    // Verify file operations
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.createReadStream).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
  
  it('should handle missing audio buffer', async () => {
    const service = new WhisperTranscriptionService('test-api-key');
    
    // Create invalid audio data (no buffer)
    const audioData: AudioData = {
      format: 'mp3',
      duration: 5.0,
      sampleRate: 44100,
      channels: 2,
      size: 1024
    };
    
    // Test that it throws an error
    await expect(service.transcribe(audioData)).rejects.toThrow();
  });
  
  it('should provide mock transcription', async () => {
    const service = new WhisperTranscriptionService('test-api-key');
    
    // Create mock audio data
    const audioData: AudioData = {
      buffer: Buffer.from('mock audio data'),
      format: 'mp3',
      duration: 5.0,
      sampleRate: 44100,
      channels: 2,
      size: 1024
    };
    
    // Test mock transcription
    const result = await service.mockTranscribe(audioData);
    
    // Verify result has the expected format
    expect(result).toBeDefined();
    expect(result.text).toContain('mock transcription');
    expect(result.wordTimings?.length).toBeGreaterThan(0);
  });
});
