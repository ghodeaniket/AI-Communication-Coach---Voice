<script lang="ts">
  import { AppState } from '../services/StateService';
  import RecordButton from './RecordButton.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import TranscriptionDisplay from './TranscriptionDisplay.svelte';
  import FeedbackDisplay from './FeedbackDisplay.svelte';
  import AnalyticsDisplay from './AnalyticsDisplay.svelte';
  import AudioTest from './AudioTest.svelte';
  import SavedResultsList from './SavedResultsList.svelte';
  
  // Props
  export let currentState = AppState.IDLE;
  export let isRecording = false;
  export let audioServiceAvailable = false;
  export let onToggleRecording: () => void;
  export let onGenerateMockData: () => void;
  export let transcription = '';
  export let highlights = [];
  export let feedback = { overall: '', improvements: [], strengths: [] };
  export let analytics = {};
  export let savedResults = [];
  export let onLoadResult: (id: string) => void = () => {};
</script>

<div class="min-h-screen bg-gray-100 pt-8 pb-12">
  <div class="container mx-auto px-4">
    <header class="mb-10 text-center">
      <h1 class="text-3xl font-bold text-gray-800">Voice-Based AI Communication Coach</h1>
      <p class="mt-2 text-gray-600">Record your speech and get actionable feedback to improve your communication</p>
    </header>
    
    <!-- Status indicator -->
    <StatusIndicator {currentState} {isRecording} />
    
    <div class="max-w-5xl mx-auto">
      <!-- Main content area with flex layout -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left column - Recording and results -->
        <div class="lg:w-3/4">
          <!-- Recording controls -->
          <div class="flex flex-col items-center mb-8">
            <div class="flex flex-col sm:flex-row items-center gap-4">
              <!-- Record button -->
              <RecordButton {isRecording} onToggleRecording={onToggleRecording} />
              
              <!-- Mock data button -->
              <button 
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                on:click={onGenerateMockData}
              >
                Generate Mock Data
              </button>
            </div>
            
            <p class="mt-4 text-gray-600 text-center">
              {#if !audioServiceAvailable}
                <span class="text-orange-600 font-semibold">Audio recording is not available. Use "Generate Mock Data" instead.</span>
              {:else if currentState === AppState.IDLE}
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
              <div class="flex flex-col gap-2">
                <span class="font-semibold">Development Tools</span>
                <!-- Add microphone test component for debugging -->
                <AudioTest />
              </div>
            </div>
          {/if}
          
          <!-- Results section -->
          {#if currentState === AppState.RESULTS}
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
        
        <!-- Right column - Saved results -->
        <div class="lg:w-1/4">
          {#if savedResults && savedResults.length > 0}
            <div class="bg-white rounded-lg shadow p-4">
              <h2 class="text-lg font-medium mb-3">Previous Recordings</h2>
              <SavedResultsList {savedResults} {onLoadResult} />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
