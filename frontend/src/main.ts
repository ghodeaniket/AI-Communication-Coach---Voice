// Import reflect-metadata for DI decorator support
import 'reflect-metadata';

// Import application dependencies
import './app.css';
import App from './App.svelte';
import { initializeContainer } from './services/ServiceRegistry';
import { createFrontendConfig } from './utils/env-validation';

// Debug helper function (declared in index.html)
declare global {
  interface Window {
    debugLog?: (message: string) => void;
  }
}

// Log function that works with or without the debug overlay
function log(message: string) {
  console.log(message);
  if (window.debugLog) {
    window.debugLog(message);
  }
}

// Initialize the config
log('Creating frontend config...');
let config;
try {
  config = createFrontendConfig();
  log('Config created successfully');
  console.log('Application config:', config);
} catch (error) {
  const errorMessage = `Config error: ${error instanceof Error ? error.message : String(error)}`;
  log(errorMessage);
  config = {}; // Fallback config
}

// Initialize the DI container
log('Initializing container...');
const container = initializeContainer();
log('Container initialized');

// Initialize application component
log('Creating App component...');
const app = new App({
  target: document.getElementById('app') as HTMLElement,
  props: {
    container,
    config
  }
});
log('App component created successfully');

export default app;
