<script lang="ts">
  import { AppState } from '../services/StateService';
  
  export let currentState: string = AppState.IDLE;
  export let isRecording: boolean = false;
  
  // Animated dot for recording indicator
  let dots = '';
  let dotInterval: number;
  
  // Update dots animation
  function updateDots() {
    dots = dots.length < 3 ? dots + '.' : '';
  }
  
  // Start/stop dot animation based on recording state
  $: {
    if (isRecording && !dotInterval) {
      dotInterval = window.setInterval(updateDots, 500);
    } else if (!isRecording && dotInterval) {
      clearInterval(dotInterval);
      dotInterval = 0;
      dots = '';
    }
  }
  
  // Clean up interval on component destruction
  import { onDestroy } from 'svelte';
  
  onDestroy(() => {
    if (dotInterval) {
      clearInterval(dotInterval);
    }
  });
  
  // Get status icon based on state
  function getStatusIcon(state: string) {
    switch (state) {
      case AppState.IDLE:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>`;
      case AppState.RECORDING:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
          </svg>`;
      case AppState.PROCESSING:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>`;
      case AppState.RESULTS:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>`;
      case AppState.ERROR:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>`;
      default:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>`;
    }
  }
  
  // Get status color based on state
  function getStatusColor(state: string) {
    switch (state) {
      case AppState.IDLE:
        return 'bg-gray-100 text-gray-800';
      case AppState.RECORDING:
        return 'bg-red-100 text-red-800';
      case AppState.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case AppState.RESULTS:
        return 'bg-green-100 text-green-800';
      case AppState.ERROR:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Get status message based on state
  function getStatusMessage(state: string) {
    switch (state) {
      case AppState.IDLE:
        return 'Ready to record';
      case AppState.RECORDING:
        return `Recording${dots}`;
      case AppState.PROCESSING:
        return 'Processing speech...';
      case AppState.RESULTS:
        return 'Analysis complete';
      case AppState.ERROR:
        return 'Error occurred';
      default:
        return 'Unknown status';
    }
  }
</script>

<div class="flex items-center justify-center w-full mb-8">
  <div class="flex items-center px-4 py-2 rounded-full {getStatusColor(currentState)}">
    <span class="mr-2">
      {@html getStatusIcon(currentState)}
    </span>
    <span class="font-medium">{getStatusMessage(currentState)}</span>
  </div>
</div>
