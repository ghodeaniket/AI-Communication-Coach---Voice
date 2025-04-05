<script lang="ts">
  import type { RecordingResultSummary } from '../services/ResultsService';
  
  // Props
  export let savedResults: RecordingResultSummary[] = [];
  export let onLoadResult: (id: string) => void = () => {};
  
  // Format date for display
  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Format duration (seconds) to mm:ss
  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Handle keyboard events for accessibility
  function handleKeyDown(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLoadResult(id);
    }
  }
</script>

<div class="space-y-3">
  {#if savedResults.length === 0}
    <p class="text-gray-500 text-sm text-center py-4">No saved recordings yet</p>
  {:else}
    {#each savedResults as result}
      <button 
        class="bg-gray-50 p-3 rounded border border-gray-200 hover:bg-gray-100 transition cursor-pointer w-full text-left"
        on:click={() => onLoadResult(result.id)}
        on:keydown={(e) => handleKeyDown(e, result.id)}
        aria-label={`Load recording from ${formatDate(result.timestamp)}`}
      >
        <div class="flex justify-between items-start mb-1">
          <span class="text-sm font-medium text-gray-700 truncate">
            {formatDate(result.timestamp)}
          </span>
          {#if result.overallScore !== undefined}
            <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded 
                       {result.overallScore >= 80 ? 'bg-green-100 text-green-800' : 
                         result.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                         'bg-red-100 text-red-800'}">
              {result.overallScore}
            </span>
          {/if}
        </div>
        
        <p class="text-xs text-gray-500 mb-1">
          Duration: {formatDuration(result.duration)}
        </p>
        
        <p class="text-xs text-gray-600 line-clamp-2">
          {result.textPreview}
        </p>
      </button>
    {/each}
  {/if}
</div>
