<script lang="ts">
  export let isRecording = false;
  export let onToggleRecording: () => void;
  
  let buttonClicked = false;
  
  function handleClick() {
    buttonClicked = true;
    console.log('RecordButton clicked, calling onToggleRecording');
    
    if (typeof onToggleRecording === 'function') {
      try {
        onToggleRecording();
        // Reset the buttonClicked state after 2 seconds 
        setTimeout(() => {
          buttonClicked = false;
        }, 2000);
      } catch (error) {
        console.error('Error in onToggleRecording:', error);
        buttonClicked = false;
      }
    } else {
      console.error('onToggleRecording is not a function', onToggleRecording);
      buttonClicked = false;
    }
  }
</script>

<button 
  class="btn {isRecording ? 'btn-error' : buttonClicked ? 'btn-warning' : 'btn-primary'} rounded-full w-16 h-16"
  on:click={handleClick}
  disabled={buttonClicked && !isRecording}
>
  {#if isRecording}
    <span>Stop</span>
  {:else if buttonClicked}
    <span>Wait...</span>
  {:else}
    <span>Record</span>
  {/if}
</button>

<p class="mt-2 text-sm text-gray-500">
  {#if buttonClicked && !isRecording}
    Requesting microphone permission...
  {/if}
</p>
