<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { IStateService } from '../interfaces';
  import { AppState } from '../services/StateService';
  import container from '../di-container';
  
  // Component state
  let currentState = '';
  let stateData: Record<string, any> = {};
  let stateHistory: Array<{state: string, timestamp: number}> = [];
  
  // Services
  let stateService: IStateService;
  
  // Observer reference for cleanup
  let stateObserver = {
    update: (state: string, data: Record<string, any>) => {
      currentState = state;
      stateData = data;
      stateHistory = stateService.getStateHistory();
    }
  };
  
  onMount(() => {
    // Get state service from container
    stateService = container.resolve<IStateService>('IStateService');
    
    // Subscribe to state changes
    stateService.subscribe(stateObserver);
    
    // Initialize component state
    currentState = stateService.getCurrentState();
    stateHistory = stateService.getStateHistory();
  });
  
  onDestroy(() => {
    // Unsubscribe when component is destroyed
    if (stateService) {
      stateService.unsubscribe(stateObserver);
    }
  });
  
  // Methods to transition to different states
  function transitionToIdle() {
    stateService.transition(AppState.IDLE);
    stateService.clearStateData();
  }
  
  function transitionToRecording() {
    stateService.transition(AppState.RECORDING);
    stateService.setStateData('recordingStartTime', Date.now());
  }
  
  function transitionToProcessing() {
    stateService.transition(AppState.PROCESSING);
    stateService.setStateData('processingStage', 'transcribing');
  }
  
  function transitionToResults() {
    stateService.transition(AppState.RESULTS);
    stateService.setStateData('transcription', 'This is a sample transcription.');
    stateService.setStateData('feedback', { 
      overall: 'Good job!',
      points: ['Clear speech', 'Good pace'] 
    });
  }
  
  function transitionToError() {
    stateService.transition(AppState.ERROR);
    stateService.setStateData('error', { 
      message: 'Something went wrong',
      code: 'DEMO_ERROR' 
    });
  }
  
  function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
</script>

<div class="p-4 bg-white rounded shadow-md max-w-2xl mx-auto">
  <h2 class="text-xl font-bold mb-4">State Management Demo</h2>
  
  <div class="mb-8">
    <div class="mb-2">
      <span class="font-semibold">Current State:</span>
      <span class="ml-2 py-1 px-2 rounded text-white font-mono text-sm"
            class:bg-gray-500={currentState === AppState.IDLE}
            class:bg-red-500={currentState === AppState.RECORDING}
            class:bg-blue-500={currentState === AppState.PROCESSING}
            class:bg-green-500={currentState === AppState.RESULTS}
            class:bg-amber-500={currentState === AppState.ERROR}>
        {currentState || AppState.IDLE}
      </span>
    </div>
    
    <div class="flex space-x-2 mt-4">
      <button 
        class="px-3 py-1 bg-gray-500 text-white rounded"
        on:click={transitionToIdle}>
        IDLE
      </button>
      <button 
        class="px-3 py-1 bg-red-500 text-white rounded"
        on:click={transitionToRecording}
        disabled={currentState !== AppState.IDLE && currentState !== AppState.RESULTS && currentState !== AppState.ERROR}>
        RECORDING
      </button>
      <button 
        class="px-3 py-1 bg-blue-500 text-white rounded"
        on:click={transitionToProcessing}
        disabled={currentState !== AppState.RECORDING}>
        PROCESSING
      </button>
      <button 
        class="px-3 py-1 bg-green-500 text-white rounded"
        on:click={transitionToResults}
        disabled={currentState !== AppState.PROCESSING}>
        RESULTS
      </button>
      <button 
        class="px-3 py-1 bg-amber-500 text-white rounded"
        on:click={transitionToError}>
        ERROR
      </button>
    </div>
  </div>
  
  <div class="grid grid-cols-2 gap-4">
    <div class="p-3 bg-gray-50 rounded">
      <h3 class="font-semibold mb-2">State Data</h3>
      {#if Object.keys(stateData).length === 0}
        <p class="text-gray-500 text-sm">No state data</p>
      {:else}
        <pre class="text-xs bg-slate-800 text-white p-2 rounded overflow-auto max-h-48">
          {JSON.stringify(stateData, null, 2)}
        </pre>
      {/if}
    </div>
    
    <div class="p-3 bg-gray-50 rounded">
      <h3 class="font-semibold mb-2">State History</h3>
      <ul class="text-sm max-h-48 overflow-auto">
        {#each stateHistory as entry}
          <li class="mb-1 py-1 border-b border-gray-200">
            <span class="font-mono">{formatTimestamp(entry.timestamp)}</span>: 
            <span 
              class="py-0.5 px-1 rounded text-white text-xs"
              class:bg-gray-500={entry.state === AppState.IDLE}
              class:bg-red-500={entry.state === AppState.RECORDING}
              class:bg-blue-500={entry.state === AppState.PROCESSING}
              class:bg-green-500={entry.state === AppState.RESULTS}
              class:bg-amber-500={entry.state === AppState.ERROR}>
              {entry.state}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>
