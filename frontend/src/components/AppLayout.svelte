<script lang="ts">
  import { AppState } from '../services/StateService';
  import RecordButton from './RecordButton.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import TranscriptionDisplay from './TranscriptionDisplay.svelte';
  import FeedbackDisplay from './FeedbackDisplay.svelte';
  import AnalyticsDisplay from './AnalyticsDisplay.svelte';
  import AudioTest from './AudioTest.svelte';
  
  // Props
  export let currentState = AppState.IDLE;
  export let isRecording = false;
  export let onToggleRecording: () => void;
  export let transcription = '';
  export let highlights = [];
  export let feedback = { overall: '', improvements: [], strengths: [] };
  export let analytics = {};
  
  // Show the mock data toggle for development purposes
  let showMockData = false;
  
  // Development helper to generate mock data
  function generateMockData() {
    // Mock transcription
    transcription = "Hello, um, thank you for, uh, listening to my speech today. I'm going to talk about effective communication. So, you know, communication is really important in our daily lives. It helps us connect with others and, like, share our ideas. When we communicate clearly, we can avoid misunderstandings and build stronger relationships. Um, another thing to consider is that good communication involves active listening. This means, you know, paying attention to what others are saying and responding thoughtfully. In conclusion, effective communication is essential for success in both personal and professional contexts.";
    
    // Mock highlights
    highlights = [
      { start: 7, end: 9, type: 'filler', tooltip: 'Filler word' },
      { start: 28, end: 30, type: 'filler', tooltip: 'Filler word' },
      { start: 108, end: 117, type: 'pause', tooltip: 'Long pause (1.2s)' },
      { start: 160, end: 168, type: 'emphasis', tooltip: 'Good emphasis' },
      { start: 277, end: 279, type: 'filler', tooltip: 'Filler word' },
      { start: 342, end: 350, type: 'filler', tooltip: 'Filler word' }
    ];
    
    // Mock feedback
    feedback = {
      overall: "Your speech was generally clear and well-structured with a good introduction and conclusion. However, you used several filler words that could be reduced to make your delivery more polished.",
      improvements: [
        "Reduce filler words like 'um' and 'uh'",
        "Consider using more varied sentence structures",
        "Practice more natural pausing between key points"
      ],
      strengths: [
        "Clear introduction and conclusion",
        "Good topic explanation",
        "Appropriate speaking pace"
      ],
      score: 78
    };
    
    // Mock analytics
    analytics = {
      speakingRate: {
        wordsPerMinute: 145,
        syllablesPerMinute: 195,
        rating: "good"
      },
      fillerWords: {
        count: 5,
        words: ["um", "uh", "like", "you know"],
        percentage: 8.2
      },
      pauses: {
        count: 4,
        totalDuration: 5.3,
        avgDuration: 1.33
      },
      duration: 62
    };
  }
</script>

<div class="min-h-screen bg-gray-100 pt-8 pb-12">
  <div class="container mx-auto px-4">
    <header class="mb-10 text-center">
      <h1 class="text-3xl font-bold text-gray-800">Voice-Based AI Communication Coach</h1>
      <p class="mt-2 text-gray-600">Record your speech and get actionable feedback to improve your communication</p>
    </header>
    
    <!-- Status indicator -->
    <StatusIndicator {currentState} {isRecording} />
    
    <!-- Main content area -->
    <div class="max-w-5xl mx-auto">
      <!-- Recording controls -->
      <div class="flex flex-col items-center mb-8">
        <RecordButton {isRecording} {onToggleRecording} />
        <p class="mt-3 text-gray-600 text-center">
          {#if currentState === AppState.IDLE}
            Click the button to start recording your speech
          {:else if currentState === AppState.RECORDING}
            Click again to stop recording when you're finished
          {:else if currentState === AppState.PROCESSING}
            Please wait while we analyze your speech...
          {:else if currentState === AppState.RESULTS}
            Review your results below
          {:else if currentState === AppState.ERROR}
            An error occurred. Please try again.
          {/if}
        </p>
      </div>
      
      <!-- Development tools (only in dev mode) -->
      {#if import.meta.env.DEV}
        <div class="mb-6 p-3 bg-gray-200 rounded text-sm">
          <div class="flex items-center justify-between">
            <span class="font-semibold">Development Tools</span>
            <button 
              class="px-3 py-1 bg-blue-500 text-white text-xs rounded"
              on:click={generateMockData}
            >
              Generate Mock Data
            </button>
          </div>
          
          <!-- Add microphone test component for debugging -->
          <AudioTest />
        </div>
      {/if}
      
      <!-- Results section -->
      {#if currentState === AppState.RESULTS || showMockData}
        <div class="space-y-6">
          <!-- Transcription -->
          <TranscriptionDisplay {transcription} {highlights} />
          
          <!-- Analytics & Feedback -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsDisplay {analytics} />
            <FeedbackDisplay {feedback} />
          </div>
        </div>
      {:else if currentState === AppState.ERROR}
        <div class="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 class="text-xl font-semibold mb-2 text-red-700">Error</h2>
          <p class="text-red-600 mb-4">Sorry, something went wrong while processing your speech.</p>
          <p>Please try recording again. If the problem persists, try refreshing the page.</p>
        </div>
      {/if}
    </div>
  </div>
</div>
