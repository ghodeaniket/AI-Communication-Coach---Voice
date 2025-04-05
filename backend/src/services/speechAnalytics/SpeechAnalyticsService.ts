import { 
  ISpeechAnalyticsService,
  TranscriptionResult,
  SpeechAnalytics,
  FillerWordAnalysis,
  SpeakingRateAnalysis, 
  PauseAnalysis
} from '../../interfaces';

/**
 * Service to analyze speech patterns and metrics from transcription
 */
export class SpeechAnalyticsService implements ISpeechAnalyticsService {
  // Common filler words to detect
  private fillerWords: string[] = [
    'um', 'uh', 'er', 'ah', 'like', 'you know', 'right', 'so', 'well', 'i mean',
    'kind of', 'sort of', 'actually', 'basically', 'literally', 'stuff', 'things'
  ];

  /**
   * Create a new SpeechAnalyticsService
   * @param options Optional configuration options
   */
  constructor(options?: {
    fillerWords?: string[];
  }) {
    if (options?.fillerWords) {
      this.fillerWords = options.fillerWords;
    }
  }

  /**
   * Analyze a transcription to extract speech metrics and patterns
   * @param transcription The transcription to analyze
   * @returns Comprehensive speech analytics
   */
  public async analyze(transcription: TranscriptionResult): Promise<SpeechAnalytics> {
    // Extract all metrics
    const fillerWords = this.detectFillerWords(transcription);
    const speakingRate = this.analyzeSpeakingRate(transcription);
    const pauses = this.detectPauses(transcription);

    // Return combined analytics
    return {
      fillerWords,
      speakingRate,
      pauses,
      transcription
    };
  }

  /**
   * Detect filler words in the transcription
   * @param transcription The transcription to analyze
   * @returns Analysis of filler word usage
   */
  public detectFillerWords(transcription: TranscriptionResult): FillerWordAnalysis {
    const text = transcription.text.toLowerCase();
    const words = text.split(/\s+/);
    
    // Track filler word occurrences and their positions
    const fillerWordEntries: Record<string, { count: number, timestamps: number[] }> = {};
    
    // Check for filler words
    this.fillerWords.forEach(fillerWord => {
      // Create regex to match whole words
      const regex = new RegExp(`\\b${fillerWord}\\b`, 'gi');
      let match;
      let matches = [];
      
      // Find all matches
      while ((match = regex.exec(text)) !== null) {
        matches.push(match.index);
      }
      
      if (matches.length > 0) {
        // Find timestamps based on word position in the transcription
        let timestamps: number[] = [];
        
        if (transcription.wordTimings) {
          matches.forEach(matchIndex => {
            // Find the closest word timing to this match
            // This is a simplification - in a real implementation, we'd use more sophisticated
            // text alignment to find exact timestamps
            const wordPosition = this.findWordPositionByCharIndex(text, matchIndex);
            if (wordPosition >= 0 && wordPosition < transcription.wordTimings!.length) {
              timestamps.push(transcription.wordTimings![wordPosition].startTime);
            }
          });
        } else {
          // If no word timings are available, estimate timestamps based on word position
          timestamps = matches.map(match => {
            // Rough estimate: position in text / total length * duration
            return (match / text.length) * transcription.duration;
          });
        }
        
        fillerWordEntries[fillerWord] = {
          count: matches.length,
          timestamps
        };
      }
    });
    
    // Convert to array format for the result
    const fillerWordList = Object.entries(fillerWordEntries).map(([word, { count, timestamps }]) => ({
      word,
      count,
      timestamps
    }));
    
    // Calculate total count and density
    const totalCount = fillerWordList.reduce((sum, entry) => sum + entry.count, 0);
    const durationInMinutes = transcription.duration / 60;
    const density = durationInMinutes > 0 ? totalCount / durationInMinutes : 0;
    
    return {
      totalCount,
      words: fillerWordList,
      density
    };
  }

  /**
   * Analyze speaking rate from transcription
   * @param transcription The transcription to analyze
   * @returns Analysis of speaking rate
   */
  public analyzeSpeakingRate(transcription: TranscriptionResult): SpeakingRateAnalysis {
    // Count words (splitting by whitespace is a simplification; for more accurate
    // word count we would use NLP tools)
    const words = transcription.text.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;
    const durationInMinutes = transcription.duration / 60;
    
    // Calculate words per minute
    const wordsPerMinute = durationInMinutes > 0 
      ? Math.round(totalWords / durationInMinutes) 
      : 0;
    
    // Generate speaking rate recommendation
    let recommendation: string;
    
    if (wordsPerMinute < 120) {
      recommendation = "Your speaking pace is slower than average. Consider increasing your speed slightly for more engaging delivery.";
    } else if (wordsPerMinute > 160) {
      recommendation = "Your speaking pace is faster than average. Try slowing down slightly for better clarity.";
    } else {
      recommendation = "Your speaking pace is within the ideal range for clear communication.";
    }
    
    return {
      wordsPerMinute,
      totalWords,
      duration: transcription.duration,
      recommendation
    };
  }

  /**
   * Detect pauses in speech from transcription
   * @param transcription The transcription to analyze
   * @returns Analysis of speech pauses
   */
  public detectPauses(transcription: TranscriptionResult): PauseAnalysis {
    // If word timings aren't available, create an estimated result
    if (!transcription.wordTimings || transcription.wordTimings.length < 2) {
      return this.estimatePauses(transcription);
    }
    
    const wordTimings = transcription.wordTimings;
    const pauses: Array<{startTime: number, endTime: number, duration: number}> = [];
    
    // Find pauses between words
    for (let i = 1; i < wordTimings.length; i++) {
      const prevWordEnd = wordTimings[i-1].endTime;
      const currentWordStart = wordTimings[i].startTime;
      const pauseDuration = currentWordStart - prevWordEnd;
      
      // Only count significant pauses (> 0.3 seconds)
      if (pauseDuration > 0.3) {
        pauses.push({
          startTime: prevWordEnd,
          endTime: currentWordStart,
          duration: pauseDuration
        });
      }
    }
    
    // Calculate average pause duration
    const totalPauseDuration = pauses.reduce((sum, pause) => sum + pause.duration, 0);
    const averagePauseDuration = pauses.length > 0 ? totalPauseDuration / pauses.length : 0;
    
    // Categorize pauses by duration
    const pauseDistribution = {
      short: pauses.filter(p => p.duration < 1).length,
      medium: pauses.filter(p => p.duration >= 1 && p.duration <= 2).length,
      long: pauses.filter(p => p.duration > 2).length
    };
    
    // Filter for long pauses (> 2 seconds)
    const longPauses = pauses.filter(p => p.duration > 2);
    
    return {
      totalPauses: pauses.length,
      averagePauseDuration,
      longPauses,
      pauseDistribution
    };
  }

  /**
   * Estimate pauses when word timings aren't available
   * @param transcription The transcription to analyze
   * @returns Estimated pause analysis
   */
  private estimatePauses(transcription: TranscriptionResult): PauseAnalysis {
    const text = transcription.text;
    const punctuationMarks = ['.', '!', '?', ',', ';', ':'];
    
    // Count punctuation marks which often indicate pauses
    let pauseCount = 0;
    let longPauseCount = 0;
    const pausePositions: Array<{position: number, isLong: boolean}> = [];
    
    for (let i = 0; i < text.length; i++) {
      if (punctuationMarks.includes(text[i])) {
        pauseCount++;
        
        // Periods, question marks, and exclamation points often indicate longer pauses
        if (['.', '!', '?'].includes(text[i])) {
          longPauseCount++;
          pausePositions.push({
            position: i,
            isLong: true
          });
        } else {
          pausePositions.push({
            position: i,
            isLong: false
          });
        }
      }
    }
    
    // Generate mock pause data
    const pauses: Array<{startTime: number, endTime: number, duration: number}> = [];
    const longPauses: Array<{startTime: number, endTime: number, duration: number}> = [];
    const duration = transcription.duration;
    
    pausePositions.forEach(({ position, isLong }, index) => {
      // Estimate timing based on position in text
      const relativePosition = position / text.length;
      const estimatedTime = relativePosition * duration;
      const pauseDuration = isLong ? 2.5 : 0.8;
      
      const pause = {
        startTime: Math.max(0, estimatedTime - pauseDuration / 2),
        endTime: Math.min(duration, estimatedTime + pauseDuration / 2),
        duration: pauseDuration
      };
      
      pauses.push(pause);
      
      if (isLong) {
        longPauses.push(pause);
      }
    });
    
    // Calculate distribution
    const pauseDistribution = {
      short: pauses.length - longPauses.length - Math.floor((pauses.length - longPauses.length) / 2),
      medium: Math.floor((pauses.length - longPauses.length) / 2),
      long: longPauses.length
    };
    
    // Calculate average pause duration
    const totalPauseDuration = pauses.reduce((sum, pause) => sum + pause.duration, 0);
    const averagePauseDuration = pauses.length > 0 ? totalPauseDuration / pauses.length : 0;
    
    return {
      totalPauses: pauses.length,
      averagePauseDuration,
      longPauses,
      pauseDistribution
    };
  }

  /**
   * Helper function to find word position by character index
   * @param text The full text to search in
   * @param charIndex The character index to find
   * @returns The word position (index) in the text
   */
  private findWordPositionByCharIndex(text: string, charIndex: number): number {
    // Split text by spaces, track character positions
    const words = text.split(/\s+/);
    let currentIndex = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip empty words
      if (word.length === 0) {
        continue;
      }
      
      // Check if the character index falls within this word
      if (charIndex >= currentIndex && charIndex < currentIndex + word.length) {
        return i;
      }
      
      // Move index past this word and the following space
      currentIndex += word.length + 1;
    }
    
    // If not found, return -1
    return -1;
  }
}
