<script lang="ts">
  export let isRecording = false;
  export let onToggleRecording: () => void;
</script>

<button 
  class="btn {isRecording ? 'btn-error' : 'btn-primary'} rounded-full w-16 h-16"
  on:click={onToggleRecording}
>
  {#if isRecording}
    <span>Stop</span>
  {:else}
    <span>Record</span>
  {/if}
</button>
