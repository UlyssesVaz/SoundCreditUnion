import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
// Import manifest using standard require if needed, or just keep standard import and ignore TS warning for now.
// Let's try standard import first, it often just works in newer Node.
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    sourcemap: true,
  },
});