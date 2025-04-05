<script lang="ts">
  import { onMount } from 'svelte';
  import type { IAudioService, IStateService } from './interfaces';
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
            transcription = data.transcription.text;
            
            // In a real app, these would come from the backend
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
      
      // Set up event handlers
      audioService.onRecordingStart = () => {
        stateService.transition(AppState.RECORDING);
      };
      
      audioService.onRecordingStop = async (audio) => {
        isRecording = false;
        stateService.transition(AppState.PROCESSING);
        stateService.setStateData('audioData', audio);
        
        try {
          // In a real app, we would process the audio here by sending to backend
          // For now just simulate a delay and transition to results with mock data
          setTimeout(() => {
            stateService.transition(AppState.RESULTS);
            
            // Set mock results data
            const mockResults = getMockResults();
            stateService.setStateData('transcription', { text: mockResults.transcription });
            stateService.setStateData('highlights', mockResults.highlights);
            stateService.setStateData('feedback', mockResults.feedback);
            stateService.setStateData('analytics', mockResults.analytics);
            
            // Update local state for components
            transcription = mockResults.transcription;
            highlights = mockResults.highlights;
            feedback = mockResults.feedback;
            analytics = mockResults.analytics;
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
    console.log('audioService type:', audioService?.constructor.name);
    
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
        
        await audioService.configure({
          sampleRate: config?.audio?.sampleRate || 44100,
          maxDuration: config?.audio?.maxRecordingDuration || 120,
          reduceNoise: config?.audio?.noiseReduction || true
        });
        
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
  
  // Create mock results for testing
  function getMockResults() {
    return {
      transcription: "Hello, um, thank you for, uh, listening to my speech today. I'm going to talk about effective communication. So, you know, communication is really important in our daily lives. It helps us connect with others and, like, share our ideas. When we communicate clearly, we can avoid misunderstandings and build stronger relationships. Um, another thing to consider is that good communication involves active listening. This means, you know, paying attention to what others are saying and responding thoughtfully. In conclusion, effective communication is essential for success in both personal and professional contexts.",
      highlights: [
        { start: 7, end: 9, type: 'filler', tooltip: 'Filler word' },
        { start: 28, end: 30, type: 'filler', tooltip: 'Filler word' },
        { start: 108, end: 117, type: 'pause', tooltip: 'Long pause (1.2s)' },
        { start: 160, end: 168, type: 'emphasis', tooltip: 'Good emphasis' },
        { start: 277, end: 279, type: 'filler', tooltip: 'Filler word' },
        { start: 342, end: 350, type: 'filler', tooltip: 'Filler word' }
      ],
      feedback: {
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
      },
      analytics: {
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
      }
    };
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
  />
{/if}
