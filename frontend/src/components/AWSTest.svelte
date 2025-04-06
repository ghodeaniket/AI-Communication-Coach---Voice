<script lang="ts">
  import { onMount } from 'svelte';
  import { awsService } from '../services/AWSService';
  import { config } from '../config/environment';
  
  let status = 'Not Tested';
  let message = '';
  let isLoading = false;
  let awsConfig = config.aws;
  
  async function testConnection() {
    try {
      isLoading = true;
      status = 'Testing...';
      
      const result = await awsService.testConnection();
      
      status = result.success ? 'Connected' : 'Failed';
      message = result.message;
    } catch (error) {
      status = 'Error';
      message = error instanceof Error ? error.message : String(error);
    } finally {
      isLoading = false;
    }
  }
  
  onMount(() => {
    if (config.useLocalServices) {
      testConnection();
    }
  });
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">AWS LocalStack Connection</h2>
    
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div>Endpoint:</div>
      <div class="font-mono text-sm">{awsConfig.endpoint || 'Not configured'}</div>
      
      <div>Region:</div>
      <div class="font-mono text-sm">{awsConfig.region}</div>
      
      <div>Status:</div>
      <div class="font-bold" class:text-green-600={status === 'Connected'} class:text-red-600={status === 'Failed' || status === 'Error'}>
        {status}
      </div>
    </div>
    
    {#if message}
      <div class="bg-base-200 p-3 rounded-lg overflow-x-auto">
        <pre class="text-xs">{message}</pre>
      </div>
    {/if}
    
    <div class="card-actions justify-end mt-4">
      <button class="btn btn-primary" on:click={testConnection} disabled={isLoading}>
        {#if isLoading}
          <span class="loading loading-spinner loading-sm"></span>
        {/if}
        Test Connection
      </button>
    </div>
  </div>
</div>
