<script lang="ts">
  export let analytics: {
    speakingRate?: {
      wordsPerMinute: number;
      syllablesPerMinute?: number;
      rating?: string;
    };
    fillerWords?: {
      count: number;
      words?: string[];
      percentage: number;
    };
    pauses?: {
      count: number;
      totalDuration: number;
      avgDuration: number;
    };
    duration?: number;
  } = {};
  
  // Get speaking rate indicator color
  function getSpeakingRateColor(wpm: number) {
    if (wpm < 120) return 'text-blue-600'; // Slow
    if (wpm > 180) return 'text-red-600'; // Fast
    return 'text-green-600'; // Good
  }
  
  // Get speaking rate description
  function getSpeakingRateDescription(wpm: number) {
    if (wpm < 120) return 'Slower than average (120-180 WPM)';
    if (wpm > 180) return 'Faster than average (120-180 WPM)';
    return 'Good pace (120-180 WPM)';
  }
  
  // Format seconds to MM:SS
  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Get percentage bar width
  function getPercentageWidth(percentage: number) {
    return `width: ${Math.min(percentage, 100)}%`;
  }
  
  // Get color for filler words percentage
  function getFillerWordsColor(percentage: number) {
    if (percentage < 5) return 'bg-green-500';
    if (percentage < 10) return 'bg-yellow-500';
    return 'bg-red-500';
  }
</script>

<div class="bg-white p-6 rounded-lg shadow w-full">
  <h2 class="text-xl font-semibold mb-4">Speech Analytics</h2>
  
  {#if !analytics || (!analytics.speakingRate && !analytics.fillerWords && !analytics.pauses)}
    <p class="text-gray-500 italic">No analytics available</p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left column -->
      <div class="space-y-6">
        <!-- Speaking rate -->
        {#if analytics.speakingRate}
          <div>
            <h3 class="text-md font-semibold mb-2">Speaking Rate</h3>
            <div class="flex items-end">
              <span class="text-3xl font-bold {getSpeakingRateColor(analytics.speakingRate.wordsPerMinute)}">
                {analytics.speakingRate.wordsPerMinute}
              </span>
              <span class="ml-1 text-gray-600">WPM</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">
              {getSpeakingRateDescription(analytics.speakingRate.wordsPerMinute)}
            </p>
            
            {#if analytics.speakingRate.syllablesPerMinute}
              <div class="mt-2 text-sm">
                <span class="text-gray-600">Syllables per minute: </span>
                <span class="font-semibold">{analytics.speakingRate.syllablesPerMinute}</span>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Duration -->
        {#if analytics.duration}
          <div>
            <h3 class="text-md font-semibold mb-2">Duration</h3>
            <div class="flex items-end">
              <span class="text-3xl font-bold text-gray-800">
                {formatDuration(analytics.duration)}
              </span>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Right column -->
      <div class="space-y-6">
        <!-- Filler words -->
        {#if analytics.fillerWords}
          <div>
            <h3 class="text-md font-semibold mb-2">Filler Words</h3>
            <div class="flex items-end mb-1">
              <span class="text-3xl font-bold text-gray-800">
                {analytics.fillerWords.count}
              </span>
              <span class="ml-2 text-gray-600 text-sm">(about {analytics.fillerWords.percentage.toFixed(1)}% of words)</span>
            </div>
            
            <!-- Percentage bar -->
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div class="h-2.5 rounded-full {getFillerWordsColor(analytics.fillerWords.percentage)}" 
                   style={getPercentageWidth(analytics.fillerWords.percentage)}>
              </div>
            </div>
            
            {#if analytics.fillerWords.words && analytics.fillerWords.words.length > 0}
              <div class="mt-2">
                <h4 class="text-sm font-medium mb-1">Common fillers:</h4>
                <div class="flex flex-wrap gap-1">
                  {#each analytics.fillerWords.words as word}
                    <span class="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                      {word}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Pauses -->
        {#if analytics.pauses}
          <div>
            <h3 class="text-md font-semibold mb-2">Pauses</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Count</p>
                <p class="text-xl font-semibold">{analytics.pauses.count}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Average Duration</p>
                <p class="text-xl font-semibold">{analytics.pauses.avgDuration.toFixed(1)}s</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
