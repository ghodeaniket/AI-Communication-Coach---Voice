// Import reflect-metadata for DI decorator support
import 'reflect-metadata';

import './app.css';
import App from './App.svelte';
import { initializeContainer } from './services/ServiceRegistry';
import { createFrontendConfig } from './utils/env-validation';

// Initialize the config
const config = createFrontendConfig();
console.log('Application config:', config);

// Initialize the DI container
const container = initializeContainer();

// Initialize application components
const app = new App({
  target: document.getElementById('app') as HTMLElement,
  props: {
    container,
    config
  }
});

export default app;
