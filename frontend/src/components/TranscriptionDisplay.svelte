<script lang="ts">
  export let transcription = '';
  export let highlights: Array<{
    start: number;
    end: number;
    type: 'filler' | 'pause' | 'emphasis';
    tooltip?: string;
  }> = [];
  
  // Process transcription to add highlights
  function processTranscription() {
    if (!transcription || !highlights || highlights.length === 0) {
      return transcription;
    }
    
    // Sort highlights by start position (descending)
    const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);
    
    // Insert highlight markers starting from the end to maintain indices
    let result = transcription;
    for (const highlight of sortedHighlights) {
      const { start, end, type, tooltip } = highlight;
      const beforeText = result.substring(0, start);
      const highlightText = result.substring(start, end);
      const afterText = result.substring(end);
      
      const tooltipAttr = tooltip ? `title="${tooltip}"` : '';
      const highlightClass = `highlight highlight-${type}`;
      
      result = `${beforeText}<span class="${highlightClass}" ${tooltipAttr}>${highlightText}</span>${afterText}`;
    }
    
    return result;
  }
</script>

<style>
  .transcription-container {
    max-height: 300px;
    overflow-y: auto;
    line-height: 1.6;
  }
  
  :global(.highlight) {
    padding: 2px 0;
    border-radius: 2px;
  }
  
  :global(.highlight-filler) {
    background-color: rgba(255, 160, 122, 0.3);
    border-bottom: 2px solid #ff7f50;
  }
  
  :global(.highlight-pause) {
    background-color: rgba(135, 206, 250, 0.3);
    border-bottom: 2px solid #4169e1;
  }
  
  :global(.highlight-emphasis) {
    background-color: rgba(152, 251, 152, 0.3);
    border-bottom: 2px solid #3cb371;
  }
</style>

<div class="bg-white p-6 rounded-lg shadow w-full">
  <h2 class="text-xl font-semibold mb-3">Transcription</h2>
  
  {#if !transcription}
    <p class="text-gray-500 italic">No transcription available</p>
  {:else}
    <div class="transcription-container">
      <p class="whitespace-pre-line">
        <!-- Using @html to render the highlighted text -->
        {@html processTranscription()}
      </p>
    </div>
    
    {#if highlights.length > 0}
      <div class="mt-4 border-t pt-3">
        <h3 class="text-sm font-semibold mb-2">Highlight Legend:</h3>
        <div class="flex flex-wrap gap-4 text-sm">
          <div class="flex items-center">
            <span class="inline-block w-3 h-3 mr-1 bg-[#ff7f50]"></span>
            <span>Filler Words</span>
          </div>
          <div class="flex items-center">
            <span class="inline-block w-3 h-3 mr-1 bg-[#4169e1]"></span>
            <span>Pauses</span>
          </div>
          <div class="flex items-center">
            <span class="inline-block w-3 h-3 mr-1 bg-[#3cb371]"></span>
            <span>Emphasis</span>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
