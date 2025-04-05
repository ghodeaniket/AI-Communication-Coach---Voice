<script lang="ts">
  import { onMount } from 'svelte';
  import type DIContainer from './di-container';
  import type { IAudioService, IStateService } from './interfaces';
  import RecordButton from './components/RecordButton.svelte';
  import { AppState } from './services/StateService';
  
  // Props passed from main.ts
  export let container: DIContainer;
  export let config: any;
  
  // Local state
  let isRecording = false;
  let currentState = AppState.IDLE;
  let stateData: any = {};
  let transcriptionText: string = '';
  
  // Resolve services from container
  let audioService: IAudioService;
  let stateService: IStateService;
  
  onMount(() => {
    // Initialize services from container
    audioService = container.resolve<IAudioService>('IAudioService');
    stateService = container.resolve<IStateService>('IStateService');
    
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
      sampleRate: config.audio.sampleRate,
      maxDuration: config.audio.maxRecordingDuration,
      reduceNoise: config.audio.noiseReduction
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
  });
  
  // Handle record button click
  async function handleToggleRecording() {
    if (isRecording) {
      await audioService.stopRecording();
      isRecording = false;
    } else {
      const success = await audioService.startRecording();
      isRecording = success;
    }
  }
</script>

<main>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8 text-center">Voice-Based AI Communication Coach</h1>
    
    <div class="flex flex-col items-center justify-center gap-8">
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
  </div>
</main>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
