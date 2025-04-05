<script lang="ts">
  import { onMount } from 'svelte';
  import type DIContainer from './di-container';
  import type { IAudioService, IStateService } from './interfaces';
  import RecordButton from './components/RecordButton.svelte';
  import { AppState } from './services/StateService';
  import { runDIExample } from './examples/di-example';
  
  // Props passed from main.ts
  export let container: any = null;
  export let config: any = null;
  export let error: string = '';
  
  // Local state
  let isRecording = false;
  let currentState = AppState.IDLE;
  let stateData: any = {};
  let transcriptionText: string = '';
  let diTestResult: string = '';
  
  // Resolve services from container
  let audioService: IAudioService;
  let stateService: IStateService;
  
  onMount(() => {
    console.log('App.svelte onMount called');
    
    try {
      // Initialize services from container
      console.log('Resolving IAudioService from container');
      audioService = container.resolve('IAudioService');
      console.log('AudioService resolved:', audioService);
      
      console.log('Resolving IStateService from container');
      stateService = container.resolve('IStateService');
      console.log('StateService resolved:', stateService);
    
    // Subscribe to state changes
    stateService.subscribe({
      update: (state, data) => {
        currentState = state;
        stateData = data;
        
        // Handle state-specific logic
        if (state === AppState.RESULTS && data.transcription) {
          transcriptionText = data.transcription.text;
        }
      }
    });
    
    // Initialize audio service
    audioService.configure({
      sampleRate: config?.audio?.sampleRate || 44100,
      maxDuration: config?.audio?.maxRecordingDuration || 120,
      reduceNoise: config?.audio?.noiseReduction || true
    });
    
    // Set up event handlers
    audioService.onRecordingStart = () => {
      stateService.transition(AppState.RECORDING);
    };
    
    audioService.onRecordingStop = async (audio) => {
      isRecording = false;
      stateService.transition(AppState.PROCESSING);
      stateService.setStateData('audioData', audio);
      
      try {
        // In a real app, we would process the audio here
        // For now just simulate a delay and transition to results
        setTimeout(() => {
          stateService.transition(AppState.RESULTS);
          stateService.setStateData('transcription', {
            text: 'This is a mock transcription. The real app would process the audio and display the results here.',
            confidence: 0.95
          });
        }, 2000);
      } catch (error) {
        console.error('Error processing audio:', error);
        stateService.transition(AppState.ERROR);
        stateService.setStateData('error', error);
      }
    };
    
    console.log('App mounted with services:', { audioService, stateService });
    } catch (error) {
      console.error('Error in onMount:', error);
    }
  });
  
  // Handle record button click
  async function handleToggleRecording() {
    console.log('handleToggleRecording called, isRecording:', isRecording);
    console.log('audioService available:', !!audioService);
    
    try {
      if (isRecording) {
        console.log('Stopping recording...');
        await audioService.stopRecording();
        isRecording = false;
      } else {
        console.log('Starting recording...');
        const success = await audioService.startRecording();
        console.log('Recording started, success:', success);
        isRecording = success;
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
    }
  }
  
  // Test DI framework
  async function testDependencyInjection() {
    try {
      const result = await runDIExample();
      diTestResult = `DI Test successful! Result: ${result}`;
      console.log('DI Test result:', result);
    } catch (error) {
      diTestResult = `DI Test failed: ${error}`;
      console.error('DI Test error:', error);
    }
  }
</script>

<main class="min-h-screen bg-gray-100">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8 text-center">Voice-Based AI Communication Coach</h1>
    
    {#if error}
      <div class="w-full max-w-2xl mx-auto bg-red-50 p-6 rounded-lg border border-red-200">
        <h2 class="text-xl font-semibold mb-2 text-red-700">Application Error</h2>
        <p class="text-red-600 mb-4">{error}</p>
        <p>Please check the browser console for more details or try refreshing the page.</p>
      </div>
    {:else}
    <div class="flex flex-col items-center justify-center gap-8">
      <!-- Testing section -->
      <div class="w-full max-w-2xl bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Phase 1 Testing</h2>
        <p class="mb-4">Test the Dependency Injection framework:</p>
        <button 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          on:click={() => {
            console.log('DI Test button clicked');
            testDependencyInjection();
          }}
        >
          Run DI Test
        </button>
        
        {#if diTestResult}
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <p>{diTestResult}</p>
          </div>
        {/if}
      </div>
      
      <!-- Recording section -->
      <div class="text-center">
        <RecordButton {isRecording} onToggleRecording={handleToggleRecording} />
        <p class="mt-2">
          {#if currentState === AppState.IDLE}
            Click to start recording
          {:else if currentState === AppState.RECORDING}
            Recording... Click to stop
          {:else if currentState === AppState.PROCESSING}
            Processing your speech...
          {:else if currentState === AppState.RESULTS}
            Recording complete!
          {:else if currentState === AppState.ERROR}
            Error occurred. Please try again.
          {/if}
        </p>
      </div>
      
      <!-- Results section -->
      {#if currentState === AppState.RESULTS && transcriptionText}
        <div class="w-full max-w-2xl bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Transcription</h2>
          <p class="whitespace-pre-line">{transcriptionText}</p>
        </div>
      {/if}
      
      <!-- Error section -->
      {#if currentState === AppState.ERROR}
        <div class="w-full max-w-2xl bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 class="text-xl font-semibold mb-2 text-red-700">Error</h2>
          <p class="text-red-600">
            {stateData.error?.message || 'An unknown error occurred'}
          </p>
        </div>
      {/if}
    </div>
    {/if}
  </div>
</main>
