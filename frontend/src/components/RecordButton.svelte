<script lang="ts">
  export let isRecording = false;
  export let onToggleRecording: () => void;
  
  function handleClick() {
    console.log('RecordButton clicked, calling onToggleRecording');
    if (typeof onToggleRecording === 'function') {
      onToggleRecording();
    } else {
      console.error('onToggleRecording is not a function', onToggleRecording);
    }
  }
</script>

<button 
  class="btn {isRecording ? 'btn-error' : 'btn-primary'} rounded-full w-16 h-16"
  on:click={handleClick}
>
  {#if isRecording}
    <span>Stop</span>
  {:else}
    <span>Record</span>
  {/if}
</button>
