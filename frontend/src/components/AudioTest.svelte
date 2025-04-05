<script>
  import { onMount } from 'svelte';
  
  let testStatus = 'Ready';
  let mediaRecorder = null;
  let chunks = [];
  let audioUrl = '';
  
  async function testMicrophone() {
    testStatus = 'Requesting permission...';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStatus = 'Permission granted! Starting test recording...';
      
      // Create a simple media recorder
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        audioUrl = URL.createObjectURL(blob);
        testStatus = 'Test complete! You can play back the recording below.';
      };
      
      // Record for 3 seconds
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }
      }, 3000);
    } catch (error) {
      testStatus = `Error: ${error.message}`;
      console.error('Microphone test error:', error);
    }
  }
</script>

<div class="bg-yellow-50 p-4 rounded-lg mb-6">
  <h3 class="text-lg font-semibold mb-2">Microphone Test</h3>
  <p class="mb-3">Status: <span class="font-medium">{testStatus}</span></p>
  
  <button 
    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-3"
    on:click={testMicrophone}
  >
    Test Microphone
  </button>
  
  {#if audioUrl}
    <div class="mt-2">
      <audio controls src={audioUrl}></audio>
    </div>
  {/if}
</div>
