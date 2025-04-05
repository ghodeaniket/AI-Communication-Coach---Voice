import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
    includeSource: ['src/**/*.{js,ts,svelte}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
