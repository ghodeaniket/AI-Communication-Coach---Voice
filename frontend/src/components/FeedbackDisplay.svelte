<script lang="ts">
  export let feedback: {
    overall: string;
    improvements: string[];
    strengths: string[];
    score?: number;
  } = {
    overall: '',
    improvements: [],
    strengths: []
  };
  
  // Get background color based on score
  function getScoreBackground(score: number) {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
</script>

<div class="bg-white p-6 rounded-lg shadow w-full">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">Feedback</h2>
    
    {#if feedback.score !== undefined}
      <div class="flex items-center">
        <span class="text-sm mr-2">Overall Score:</span>
        <span class="px-3 py-1 rounded-full font-semibold {getScoreBackground(feedback.score)}">
          {feedback.score}
        </span>
      </div>
    {/if}
  </div>
  
  {#if !feedback.overall && !feedback.improvements.length && !feedback.strengths.length}
    <p class="text-gray-500 italic">No feedback available</p>
  {:else}
    {#if feedback.overall}
      <div class="mb-4 p-4 bg-gray-50 rounded">
        <p>{feedback.overall}</p>
      </div>
    {/if}
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Strengths -->
      <div>
        <h3 class="text-md font-semibold mb-2 text-green-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Strengths
        </h3>
        
        {#if feedback.strengths.length > 0}
          <ul class="list-disc list-inside space-y-1">
            {#each feedback.strengths as strength}
              <li>{strength}</li>
            {/each}
          </ul>
        {:else}
          <p class="text-gray-500 text-sm italic">No strengths identified</p>
        {/if}
      </div>
      
      <!-- Improvements -->
      <div>
        <h3 class="text-md font-semibold mb-2 text-amber-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          Areas for Improvement
        </h3>
        
        {#if feedback.improvements.length > 0}
          <ul class="list-disc list-inside space-y-1">
            {#each feedback.improvements as improvement}
              <li>{improvement}</li>
            {/each}
          </ul>
        {:else}
          <p class="text-gray-500 text-sm italic">No improvements suggested</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
