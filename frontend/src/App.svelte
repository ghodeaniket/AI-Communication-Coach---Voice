<script lang="ts">
  import { onMount } from 'svelte';
  import type { IAudioService, IStateService, IAPIClient, AudioData, ProcessingResult } from './interfaces';
  import type { IResultsService, RecordingResult } from './services/ResultsService';
  import { AppState } from './services/StateService';
  import AppLayout from './components/AppLayout.svelte';
  
  // Props passed from main.ts
  export let container: any = null;
  export let config: any = null;
  export let error: string = '';
  
  // Local state
  let isRecording = false;
  let currentState = AppState.IDLE;
  let stateData: any = {};
  
  // Results data
  let transcription = '';
  let highlights = [];
  let feedback = { overall: '', improvements: [], strengths: [] };
  let analytics = {};
  let savedResults = [];
  
  // Resolve services from container
  let audioService: IAudioService;
  let stateService: IStateService;
  let apiClient: IAPIClient;
  let resultsService: IResultsService;
  
  onMount(() => {
    console.log('App.svelte onMount called');
    
    try {
      // Initialize services from container
      console.log('Resolving services from container');
      audioService = container.resolve('IAudioService');
      stateService = container.resolve('IStateService');
      apiClient = container.resolve('IAPIClient');
      resultsService = container.resolve('IResultsService');
      
      console.log('Services resolved:', { 
        audioService: audioService?.constructor.name, 
        stateService: stateService?.constructor.name,
        apiClient: apiClient?.constructor.name,
        resultsService: resultsService?.constructor.name
      });
    
      // Subscribe to state changes
      stateService.subscribe({
        update: (state, data) => {
          currentState = state;
          stateData = data;
          
          // Handle state-specific logic
          if (state === AppState.RESULTS && data.transcription) {
            transcription = data.transcription.text;
            highlights = data.highlights || [];
            feedback = data.feedback || { overall: '', improvements: [], strengths: [] };
            analytics = data.analytics || {};
          }
        }
      });
      
      // Initialize audio service
      audioService.configure({
        sampleRate: config?.audio?.sampleRate || 44100,
        maxDuration: config?.audio?.maxRecordingDuration || 120,
        reduceNoise: config?.audio?.noiseReduction || true
      });
      
      // Set up API client
      if (config?.api?.endpoint) {
        apiClient.setEndpoint(config.api.endpoint);
      }
      
      if (config?.api?.timeout) {
        apiClient.setTimeout(config.api.timeout);
      }
      
      // Check API health
      checkApiHealth();
      
      // Load previous results
      loadPreviousResults();
      
      // Set up event handlers
      audioService.onRecordingStart = () => {
        stateService.transition(AppState.RECORDING);
      };
      
      audioService.onRecordingStop = async (audio) => {
        isRecording = false;
        await processRecordedAudio(audio);
      };
      
      console.log('App mounted with services:', { 
        audioService: !!audioService, 
        stateService: !!stateService,
        apiClient: !!apiClient,
        resultsService: !!resultsService
      });
    } catch (error) {
      console.error('Error in onMount:', error);
      stateService?.transition(AppState.ERROR);
      stateService?.setStateData('error', error);
    }
  });
  
  // Load previously saved results
  async function loadPreviousResults(limit = 5) {
    try {
      const results = await resultsService.listResults(limit);
      console.log('Loaded previous results:', results);
      savedResults = results;
      stateService.setStateData('savedResults', results);
    } catch (error) {
      console.error('Error loading previous results:', error);
    }
  }
  
  // Check API health on startup
  async function checkApiHealth() {
    try {
      const health = await apiClient.checkServiceHealth();
      console.log('API health status:', health.status);
      
      if (health.status !== 'healthy') {
        console.warn('API is not healthy, status:', health.status);
      }
    } catch (error) {
      console.error('API health check failed:', error);
    }
  }
  
  // Process recorded audio through the API
  async function processRecordedAudio(audio: AudioData) {
    try {
      stateService.transition(AppState.PROCESSING);
      stateService.setStateData('audioData', audio);
      
      console.log('Processing audio with API client...');
      
      // Optimize audio before sending to API
      const optimizedAudio = await audioService.optimizeAudio(audio);
      
      // Send to API for processing
      const result: ProcessingResult = await apiClient.processAudio(optimizedAudio);
      
      console.log('API processing complete:', result);
      
      // Update state with results
      stateService.transition(AppState.RESULTS);
      stateService.setStateData('transcription', result.transcription);
      stateService.setStateData('feedback', result.feedback);
      stateService.setStateData('analytics', result.analytics);
      
      // Generate highlights from analytics
      const highlights = generateHighlightsFromAnalytics(
        result.transcription.text, 
        result.analytics
      );
      stateService.setStateData('highlights', highlights);
      
      // Update local state for components
      transcription = result.transcription.text;
      feedback = result.feedback;
      analytics = result.analytics;
      
      // Save the result for persistence
      saveResult(audio, result, highlights);
    } catch (error) {
      console.error('Error processing audio:', error);
      stateService.transition(AppState.ERROR);
      stateService.setStateData('error', error);
    }
  }
  
  // Save the result to persistent storage
  async function saveResult(audio: AudioData, result: ProcessingResult, highlights: any[]) {
    try {
      // Prepare result data
      const recordingResult: RecordingResult = {
        timestamp: Date.now(),
        audioData: {
          duration: audio.duration,
          sampleRate: audio.sampleRate,
          channels: audio.channels,
          format: audio.format,
          size: audio.size,
        },
        transcription: result.transcription,
        analytics: result.analytics,
        feedback: result.feedback,
        highlights,
        meta: {
          duration: audio.duration,
          deviceInfo: navigator.userAgent,
          sessionId: crypto.randomUUID ? crypto.randomUUID() : undefined
        }
      };
      
      // Save result
      const id = await resultsService.saveResult(recordingResult);
      console.log('Result saved with ID:', id);
      
      // Update state with saved result ID
      stateService.setStateData('savedResultId', id);
      
      // Refresh saved results list
      loadPreviousResults();
    } catch (error) {
      console.error('Error saving result:', error);
    }
  }
  
  // Helper to generate transcript highlights from analytics
  function generateHighlightsFromAnalytics(text: string, analytics: any) {
    const highlights = [];
    
    // If the backend doesn't provide highlights, we can generate them here
    // based on the analytics data (filler words, pauses, etc.)
    
    // Example: Highlight filler words
    if (analytics.fillerWords?.words) {
      for (const word of analytics.fillerWords.words) {
        let regex = new RegExp(`\\b${word}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          highlights.push({
            start: match.index,
            end: match.index + word.length,
            type: 'filler',
            tooltip: 'Filler word'
          });
        }
      }
    }
    
    // Example: Highlight pauses if they have specific locations
    if (analytics.pauses?.locations) {
      for (const pause of analytics.pauses.locations) {
        highlights.push({
          start: pause.position,
          end: pause.position + 1, // Just highlight one character
          type: 'pause',
          tooltip: `Pause (${pause.duration.toFixed(1)}s)`
        });
      }
    }
    
    // More highlight generation logic can be added here
    
    return highlights;
  }
  
  // Handle record button click
  async function handleToggleRecording() {
    console.log('handleToggleRecording called, isRecording:', isRecording);
    
    try {
      if (!audioService) {
        console.error('No audio service available');
        return;
      }
      
      if (isRecording) {
        console.log('Stopping recording...');
        await audioService.stopRecording();
        isRecording = false;
      } else {
        console.log('Starting recording...');
        
        // First, explicitly check for microphone permissions
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Immediately stop the stream since we're just checking permissions
          stream.getTracks().forEach(track => track.stop());
          console.log('Microphone permission granted');
        } catch (err) {
          console.error('Microphone permission denied:', err);
          alert('Microphone permission is required for recording. Please grant permission and try again.');
          return;
        }
        
        // Configure audio service
        await audioService.configure({
          sampleRate: config?.audio?.sampleRate || 44100,
          maxDuration: config?.audio?.maxRecordingDuration || 120,
          reduceNoise: config?.audio?.noiseReduction || true
        });
        
        // Start recording
        const success = await audioService.startRecording();
        console.log('Recording started, success:', success);
        isRecording = success;
        
        // If we get here but isRecording is false, something went wrong
        if (!success) {
          console.error('Failed to start recording for unknown reason');
          alert('Failed to start recording. Please check console for details.');
        }
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Handle loading a previous result
  async function handleLoadResult(id: string) {
    try {
      const result = await resultsService.getResult(id);
      
      if (result) {
        // Update state with loaded result
        stateService.transition(AppState.RESULTS);
        stateService.setStateData('transcription', result.transcription);
        stateService.setStateData('feedback', result.feedback);
        stateService.setStateData('analytics', result.analytics);
        stateService.setStateData('highlights', result.highlights);
        stateService.setStateData('savedResultId', id);
        
        // Update local state for components
        transcription = result.transcription.text;
        feedback = result.feedback;
        analytics = result.analytics;
        highlights = result.highlights || [];
      }
    } catch (error) {
      console.error('Error loading result:', error);
    }
  }
</script>

{#if error}
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="max-w-2xl mx-auto bg-red-50 p-6 rounded-lg border border-red-200">
      <h2 class="text-xl font-semibold mb-2 text-red-700">Application Error</h2>
      <p class="text-red-600 mb-4">{error}</p>
      <p>Please check the browser console for more details or try refreshing the page.</p>
    </div>
  </div>
{:else}
  <AppLayout 
    {currentState}
    {isRecording}
    onToggleRecording={handleToggleRecording}
    {transcription}
    {highlights}
    {feedback}
    {analytics}
    savedResults={savedResults}
    onLoadResult={handleLoadResult}
  />
{/if}
