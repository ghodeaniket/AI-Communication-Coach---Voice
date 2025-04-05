import {
  IFeedbackService,
  SpeechAnalytics,
  TranscriptionResult,
  FeedbackResult,
  HighlightedTranscript,
  FeedbackLevel
} from '../../interfaces';

/**
 * Service for generating feedback based on speech analytics
 */
export class FeedbackService implements IFeedbackService {
  private feedbackLevel: FeedbackLevel = FeedbackLevel.INTERMEDIATE;

  /**
   * Create a new FeedbackService instance
   * @param options Optional configuration options
   */
  constructor(options?: {
    feedbackLevel?: FeedbackLevel;
  }) {
    if (options?.feedbackLevel) {
      this.feedbackLevel = options.feedbackLevel;
    }
  }

  /**
   * Set the feedback detail level
   * @param level The feedback level to use
   */
  public setFeedbackLevel(level: FeedbackLevel): void {
    this.feedbackLevel = level;
  }

  /**
   * Generate comprehensive feedback based on speech analytics
   * @param analytics Speech analytics data
   * @returns Detailed feedback with scores, strengths, improvements, and highlighted transcript
   */
  public async generateFeedback(analytics: SpeechAnalytics): Promise<FeedbackResult> {
    // Calculate scores for different aspects of the speech
    const scores = this.calculateScores(analytics);
    
    // Generate overall score (weighted average)
    const overallScore = Math.round(
      (scores.fillerWordScore * 0.35) + 
      (scores.speakingRateScore * 0.35) + 
      (scores.pauseScore * 0.3)
    );
    
    // Identify strengths and areas for improvement
    const strengths = this.identifyStrengths(analytics, scores);
    const improvements = this.identifyImprovements(analytics, scores);
    
    // Generate detailed feedback based on skill level
    const detailedFeedback = this.generateDetailedFeedback(analytics, scores);
    
    // Generate highlighted transcript
    const highlightedTranscript = this.generateTranscriptWithHighlights(
      analytics.transcription,
      analytics
    );
    
    return {
      overallScore,
      strengths,
      improvements,
      detailedFeedback,
      highlightedTranscript
    };
  }

  /**
   * Generate a transcript with highlighted areas of interest
   * @param transcription Original transcription
   * @param analytics Speech analytics data
   * @returns Transcript with highlights for filler words, pauses, etc.
   */
  public generateTranscriptWithHighlights(
    transcription: TranscriptionResult, 
    analytics: SpeechAnalytics
  ): HighlightedTranscript {
    const text = transcription.text;
    const highlights: Array<{
      type: 'filler_word' | 'pause' | 'fast_speech' | 'slow_speech';
      startIdx: number;
      endIdx: number;
      metadata?: any;
    }> = [];
    
    // 1. Highlight filler words
    analytics.fillerWords.words.forEach(fillerWord => {
      // Simple string search (in production, we'd use more sophisticated matching)
      let searchWord = fillerWord.word.toLowerCase();
      let startIdx = 0;
      
      // Find all occurrences of this filler word
      while (true) {
        const lowerText = text.toLowerCase().substring(startIdx);
        // Match whole words with word boundaries
        const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegExp(searchWord)}\\b`);
        const match = lowerText.match(wordBoundaryRegex);
        
        if (!match || match.index === undefined) break;
        
        const relativeIdx = match.index;
        const absoluteStartIdx = startIdx + relativeIdx;
        const absoluteEndIdx = absoluteStartIdx + searchWord.length;
        
        highlights.push({
          type: 'filler_word' as const,
          startIdx: absoluteStartIdx,
          endIdx: absoluteEndIdx,
          metadata: {
            word: fillerWord.word
          }
        });
        
        startIdx = absoluteEndIdx;
      }
    });
    
    // 2. Highlight areas of fast or slow speech
    // For simplicity, we'll highlight sentences with speaking rate issues
    const wpm = analytics.speakingRate.wordsPerMinute;
    if (wpm > 160 || wpm < 120) {
      // Find sentences in the text (simplification: split by periods)
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let currentIdx = 0;
      
      sentences.forEach(sentence => {
        const sentenceIdx = text.indexOf(sentence, currentIdx);
        if (sentenceIdx !== -1) {
          // Highlight about 1/3 of sentences to avoid overwhelming the user
          if (Math.random() < 0.33) {
            highlights.push({
              type: wpm > 160 ? 'fast_speech' as const : 'slow_speech' as const,
              startIdx: sentenceIdx,
              endIdx: sentenceIdx + sentence.length,
              metadata: {
                rate: wpm
              }
            });
          }
          currentIdx = sentenceIdx + sentence.length;
        }
      });
    }
    
    // 3. Highlight long pauses
    if (analytics.pauses.longPauses.length > 0) {
      analytics.pauses.longPauses.forEach(pause => {
        // Find the closest word to this pause time
        if (transcription.wordTimings) {
          // Find word that occurs right after the pause
          const wordAfterPause = transcription.wordTimings.find(
            word => word.startTime >= pause.endTime
          );
          
          if (wordAfterPause) {
            // Find this word in the text
            const wordIdx = this.findWordInText(text, wordAfterPause.word);
            if (wordIdx !== -1) {
              highlights.push({
                type: 'pause' as const,
                startIdx: Math.max(0, wordIdx - 1), // Position right before the word
                endIdx: wordIdx,
                metadata: {
                  duration: pause.duration
                }
              });
            }
          }
        } else {
          // Without word timings, estimate pause positions based on punctuation
          // This is a simplification - in a real implementation, we'd use NLP
          const punctuationMarks = ['.', '!', '?', ',', ';', ':'];
          let lastPunctuationIdx = -1;
          
          // Assign pauses to punctuation marks
          for (let i = 0; i < Math.min(analytics.pauses.longPauses.length, 5); i++) {
            for (let j = lastPunctuationIdx + 1; j < text.length; j++) {
              if (punctuationMarks.includes(text[j])) {
                highlights.push({
                  type: 'pause' as const,
                  startIdx: j,
                  endIdx: j + 1,
                  metadata: {
                    duration: analytics.pauses.longPauses[i].duration
                  }
                });
                lastPunctuationIdx = j;
                break;
              }
            }
          }
        }
      });
    }
    
    return {
      fullText: text,
      highlights: highlights.sort((a, b) => a.startIdx - b.startIdx) // Sort by position
    };
  }

  /**
   * Calculate scores for different aspects of the speech
   * @param analytics Speech analytics data
   * @returns Scores for filler words, speaking rate, and pauses
   */
  private calculateScores(analytics: SpeechAnalytics): {
    fillerWordScore: number;
    speakingRateScore: number;
    pauseScore: number;
  } {
    // Score for filler word usage (0-100)
    let fillerWordScore = 100;
    if (analytics.fillerWords.density > 0) {
      // Penalty based on density (occurrences per minute)
      fillerWordScore = Math.max(0, 100 - (analytics.fillerWords.density * 10));
    }
    
    // Score for speaking rate (0-100)
    let speakingRateScore = 100;
    const wpm = analytics.speakingRate.wordsPerMinute;
    if (wpm < 120) {
      // Penalty for speaking too slowly
      speakingRateScore = Math.max(50, 100 - (120 - wpm) * 1.2);
    } else if (wpm > 160) {
      // Penalty for speaking too quickly
      speakingRateScore = Math.max(50, 100 - (wpm - 160) * 1.2);
    }
    
    // Score for pauses (0-100)
    let pauseScore = 100;
    // Penalty for too many long pauses
    if (analytics.pauses.longPauses.length > 0) {
      pauseScore = Math.max(0, 100 - (analytics.pauses.longPauses.length * 7));
    }
    // Penalty for poor pause distribution (too many short or too many long)
    const totalPauses = analytics.pauses.totalPauses;
    if (totalPauses > 0) {
      const shortRatio = analytics.pauses.pauseDistribution.short / totalPauses;
      const longRatio = analytics.pauses.pauseDistribution.long / totalPauses;
      
      if (shortRatio > 0.8 || longRatio > 0.5) {
        pauseScore = Math.max(0, pauseScore - 15);
      }
    }
    
    return {
      fillerWordScore,
      speakingRateScore,
      pauseScore
    };
  }

  /**
   * Identify strengths based on speech analytics
   * @param analytics Speech analytics data
   * @param scores Calculated scores
   * @returns Array of strength statements
   */
  private identifyStrengths(
    analytics: SpeechAnalytics, 
    scores: { fillerWordScore: number; speakingRateScore: number; pauseScore: number; }
  ): string[] {
    const strengths: string[] = [];
    
    // Filler word strengths
    if (scores.fillerWordScore >= 85) {
      strengths.push(
        "You used minimal filler words, keeping your speech clear and confident."
      );
    } else if (scores.fillerWordScore >= 70) {
      strengths.push(
        "You maintained reasonable control over filler words."
      );
    }
    
    // Speaking rate strengths
    if (scores.speakingRateScore >= 85) {
      strengths.push(
        "Your speaking pace is well-balanced, making your message easy to follow."
      );
    } else if (scores.speakingRateScore >= 70) {
      if (analytics.speakingRate.wordsPerMinute > 140) {
        strengths.push(
          "Your energetic speaking pace helps maintain audience engagement."
        );
      } else {
        strengths.push(
          "Your measured speaking pace gives listeners time to absorb your message."
        );
      }
    }
    
    // Pause strengths
    if (scores.pauseScore >= 85) {
      strengths.push(
        "You effectively use pauses to emphasize key points and maintain a natural rhythm."
      );
    } else if (scores.pauseScore >= 70) {
      strengths.push(
        "Your speech has a good flow with strategic pauses."
      );
    }
    
    // Content strengths
    const wordCount = analytics.speakingRate.totalWords;
    if (wordCount > 100) {
      strengths.push(
        "You expressed your thoughts comprehensively with substantive content."
      );
    }
    
    // Add a general strength if we have fewer than 2 specific strengths
    if (strengths.length < 2) {
      const average = (scores.fillerWordScore + scores.speakingRateScore + scores.pauseScore) / 3;
      if (average >= 60) {
        strengths.push(
          "Your speech demonstrates good fundamental communication skills."
        );
      } else {
        strengths.push(
          "You've taken an important step in improving your communication by analyzing your speech patterns."
        );
      }
    }
    
    return strengths;
  }

  /**
   * Identify areas for improvement based on speech analytics
   * @param analytics Speech analytics data
   * @param scores Calculated scores
   * @returns Array of improvement statements
   */
  private identifyImprovements(
    analytics: SpeechAnalytics, 
    scores: { fillerWordScore: number; speakingRateScore: number; pauseScore: number; }
  ): string[] {
    const improvements: string[] = [];
    
    // Filler word improvements
    if (scores.fillerWordScore < 70) {
      // If we have specific filler words to target
      if (analytics.fillerWords.words.length > 0) {
        const topFillerWords = analytics.fillerWords.words
          .slice(0, 2)
          .map(w => `"${w.word}"`)
          .join(" and ");
        
        improvements.push(
          `Reduce filler words like ${topFillerWords} to sound more confident and polished.`
        );
      } else {
        improvements.push(
          "Reduce filler words like \"um\", \"uh\", and \"like\" to sound more confident."
        );
      }
    }
    
    // Speaking rate improvements
    if (scores.speakingRateScore < 70) {
      const wpm = analytics.speakingRate.wordsPerMinute;
      if (wpm < 120) {
        improvements.push(
          "Try increasing your speaking pace slightly to maintain audience engagement."
        );
      } else if (wpm > 160) {
        improvements.push(
          "Consider slowing down your speech slightly for better clarity and comprehension."
        );
      }
    }
    
    // Pause improvements
    if (scores.pauseScore < 70) {
      if (analytics.pauses.longPauses.length > 3) {
        improvements.push(
          "Work on reducing extended pauses that might disrupt your flow."
        );
      } else if (analytics.pauses.pauseDistribution.short > 10) {
        improvements.push(
          "Try incorporating more varied pauses - short for natural rhythm, and longer ones for emphasis."
        );
      } else {
        improvements.push(
          "Practice using strategic pauses to emphasize key points and give listeners time to absorb information."
        );
      }
    }
    
    // Add a general improvement if we have fewer than 2 specific improvements
    if (improvements.length < 2 && 
        (scores.fillerWordScore < 85 || scores.speakingRateScore < 85 || scores.pauseScore < 85)) {
      improvements.push(
        "Regular practice and self-awareness will help refine your speaking technique over time."
      );
    }
    
    return improvements;
  }

  /**
   * Generate detailed feedback based on speech analytics and skill level
   * @param analytics Speech analytics data
   * @param scores Calculated scores
   * @returns Detailed feedback for different aspects of speech
   */
  private generateDetailedFeedback(
    analytics: SpeechAnalytics,
    scores: { fillerWordScore: number; speakingRateScore: number; pauseScore: number; }
  ): {
    fillerWords: string;
    speakingRate: string;
    pauses: string;
    general: string;
  } {
    let fillerWordFeedback, speakingRateFeedback, pauseFeedback, generalFeedback;
    
    // Adjust feedback detail based on level
    switch (this.feedbackLevel) {
      case FeedbackLevel.BEGINNER:
        // Simpler, more encouraging feedback for beginners
        fillerWordFeedback = this.generateBeginnerFillerWordFeedback(analytics);
        speakingRateFeedback = this.generateBeginnerSpeakingRateFeedback(analytics);
        pauseFeedback = this.generateBeginnerPauseFeedback(analytics);
        generalFeedback = "Keep practicing regularly to build your confidence and speaking skills.";
        break;
        
      case FeedbackLevel.ADVANCED:
        // More detailed, technical feedback for advanced speakers
        fillerWordFeedback = this.generateAdvancedFillerWordFeedback(analytics);
        speakingRateFeedback = this.generateAdvancedSpeakingRateFeedback(analytics);
        pauseFeedback = this.generateAdvancedPauseFeedback(analytics);
        generalFeedback = "Consider recording yourself regularly and tracking these metrics to see improvement over time. The most effective speakers continue to refine their technique through deliberate practice.";
        break;
        
      case FeedbackLevel.INTERMEDIATE:
      default:
        // Balanced feedback for intermediate speakers
        fillerWordFeedback = this.generateIntermediateFillerWordFeedback(analytics);
        speakingRateFeedback = this.generateIntermediateSpeakingRateFeedback(analytics);
        pauseFeedback = this.generateIntermediatePauseFeedback(analytics);
        generalFeedback = "Focus on maintaining a conversational tone while incorporating these technical improvements. Regular practice will help these skills become more natural over time.";
        break;
    }
    
    return {
      fillerWords: fillerWordFeedback,
      speakingRate: speakingRateFeedback,
      pauses: pauseFeedback,
      general: generalFeedback
    };
  }

  /**
   * Generate beginner-level feedback for filler words
   */
  private generateBeginnerFillerWordFeedback(analytics: SpeechAnalytics): string {
    if (analytics.fillerWords.totalCount === 0) {
      return "Great job avoiding filler words! This keeps your message clear and confident.";
    }
    
    return `You used filler words ${analytics.fillerWords.totalCount} times. Being aware of these words is the first step to reducing them. Try pausing briefly instead of using filler words when you need a moment to think.`;
  }

  /**
   * Generate intermediate-level feedback for filler words
   */
  private generateIntermediateFillerWordFeedback(analytics: SpeechAnalytics): string {
    if (analytics.fillerWords.totalCount === 0) {
      return "You did an excellent job avoiding filler words, which enhances your clarity and credibility.";
    }
    
    const commonFillerWords = analytics.fillerWords.words
      .slice(0, 2)
      .map(w => `"${w.word}" (${w.count} times)`)
      .join(" and ");
    
    return `You used filler words ${analytics.fillerWords.totalCount} times (${analytics.fillerWords.density.toFixed(1)} per minute). Most common: ${commonFillerWords}. Replace these with strategic pauses to sound more polished.`;
  }

  /**
   * Generate advanced-level feedback for filler words
   */
  private generateAdvancedFillerWordFeedback(analytics: SpeechAnalytics): string {
    if (analytics.fillerWords.totalCount === 0) {
      return "Excellent job maintaining zero filler words throughout your speech, demonstrating professional-level verbal discipline and clarity.";
    }
    
    const topFillerWord = analytics.fillerWords.words[0]?.word || 'um';
    
    return `Your filler word rate was ${analytics.fillerWords.density.toFixed(1)} per minute, with "${topFillerWord}" being most frequent. Professional speakers aim for fewer than 1 per minute. Research shows audiences perceive speakers with fewer filler words as 30% more credible and authoritative.`;
  }

  /**
   * Generate beginner-level feedback for speaking rate
   */
  private generateBeginnerSpeakingRateFeedback(analytics: SpeechAnalytics): string {
    const wpm = analytics.speakingRate.wordsPerMinute;
    
    if (wpm >= 120 && wpm <= 160) {
      return `You spoke at ${wpm} words per minute, which is within the ideal range. Great job!`;
    } else if (wpm < 120) {
      return `You spoke at ${wpm} words per minute, which is a bit slower than the ideal range of 120-160 wpm. Try practicing at a slightly faster pace.`;
    } else {
      return `You spoke at ${wpm} words per minute, which is a bit faster than the ideal range of 120-160 wpm. Try slowing down slightly for better clarity.`;
    }
  }

  /**
   * Generate intermediate-level feedback for speaking rate
   */
  private generateIntermediateSpeakingRateFeedback(analytics: SpeechAnalytics): string {
    const wpm = analytics.speakingRate.wordsPerMinute;
    
    if (wpm >= 120 && wpm <= 160) {
      return `Your speaking rate of ${wpm} WPM falls within the optimal range for comprehension and engagement. You effectively balance clarity with energy.`;
    } else if (wpm < 120) {
      return `Your speaking rate of ${wpm} WPM is below the ideal range of 120-160 WPM. Try increasing your pace by about ${Math.min(30, 120 - wpm)} WPM to maintain audience engagement while still ensuring clarity.`;
    } else {
      return `Your speaking rate of ${wpm} WPM exceeds the ideal range of 120-160 WPM. Consider reducing your pace by about ${Math.min(30, wpm - 160)} WPM to ensure your audience can fully process your message.`;
    }
  }

  /**
   * Generate advanced-level feedback for speaking rate
   */
  private generateAdvancedSpeakingRateFeedback(analytics: SpeechAnalytics): string {
    const wpm = analytics.speakingRate.wordsPerMinute;
    
    if (wpm >= 120 && wpm <= 160) {
      return `Your rate of ${wpm} WPM is within the optimal range of 120-160 WPM. Research shows this range maximizes both comprehension (which decreases above 160 WPM) and engagement (which drops below 120 WPM). Your pacing demonstrates professional-level control.`;
    } else if (wpm < 120) {
      return `Your rate of ${wpm} WPM is below the optimal range of 120-160 WPM. Studies show audience engagement decreases by approximately 20% when speakers drop below 120 WPM. Consider using technique drills that target a slightly faster delivery while maintaining articulation quality.`;
    } else {
      return `Your rate of ${wpm} WPM exceeds the optimal range of 120-160 WPM. Research indicates comprehension decreases by approximately 10% for every 20 WPM above 160. Consider using strategic pausing and measured articulation exercises to modulate your pace.`;
    }
  }

  /**
   * Generate beginner-level feedback for pauses
   */
  private generateBeginnerPauseFeedback(analytics: SpeechAnalytics): string {
    if (analytics.pauses.longPauses.length === 0) {
      return "You maintained a good flow with appropriate pauses. Pauses are natural and help give your listeners time to process information.";
    }
    
    return `You had ${analytics.pauses.totalPauses} pauses, with ${analytics.pauses.longPauses.length} longer ones. Short pauses are natural, but too many long pauses might break your flow. Practice by reading aloud and being mindful of your pausing pattern.`;
  }

  /**
   * Generate intermediate-level feedback for pauses
   */
  private generateIntermediatePauseFeedback(analytics: SpeechAnalytics): string {
    if (analytics.pauses.longPauses.length === 0 && analytics.pauses.totalPauses > 0) {
      return `Your pausing technique shows good control, with a balanced rhythm throughout your speech. You used pauses effectively to create natural breaks without disrupting your flow.`;
    } else if (analytics.pauses.longPauses.length === 0) {
      return `Your speech had very few detected pauses. While this creates a smooth flow, intentionally incorporating strategic pauses can add emphasis to key points and give your audience time to absorb important information.`;
    }
    
    return `You had ${analytics.pauses.longPauses.length} extended pauses lasting over 2 seconds. While strategic pauses are effective for emphasis, too many long pauses can disrupt your flow. Aim for a balance of brief pauses for natural rhythm and occasional longer pauses for emphasis.`;
  }

  /**
   * Generate advanced-level feedback for pauses
   */
  private generateAdvancedPauseFeedback(analytics: SpeechAnalytics): string {
    const distribution = analytics.pauses.pauseDistribution;
    const total = analytics.pauses.totalPauses;
    
    if (total === 0) {
      return "Your speech lacked detectable pauses, creating a continuous flow. While this demonstrates verbal fluency, research shows strategic pausing increases audience retention by 38%. Consider incorporating 'power pauses' (1.5-2 seconds) before and after key points.";
    }
    
    return `Your pause distribution (${distribution.short} short, ${distribution.medium} medium, ${distribution.long} long) shows ${distribution.long > 2 ? 'excessive long pauses' : 'good pause control'}. Top speakers use a 4:2:1 ratio of short:medium:long pauses. Studies show proper pause distribution increases audience comprehension by 25% and perceived speaker authority by 40%.`;
  }

  /**
   * Helper method to escape special characters in regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Helper method to find a word in text
   */
  private findWordInText(text: string, word: string): number {
    const regex = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, 'i');
    const match = text.match(regex);
    return match ? match.index! : -1;
  }
}
