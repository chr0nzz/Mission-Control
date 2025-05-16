import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Allow access from any host
    port: 54976, // Use the provided port
    // Configure CORS and iframe settings if needed later
    // fs: {
    //   allow: ['..'], // Allow serving files from parent directories if necessary
    // },
  },
});