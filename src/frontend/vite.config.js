// https://vitejs.dev/config/
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
  // publicDir: 'public', // Relative to root

  // Optional: Configure build output directory if not default 'dist'
  // build: {
  //   outDir: 'dist',
  // },

  // Optional: Server options for dev
  server: {
    port: 54168, // Dev server port for frontend
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: { // Proxy backend API calls during development
      '/api': {
        target: 'http://localhost:3000', // Your backend server address
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // if backend doesn't have /api prefix
      }
    }
  },

  // Optional: Resolve aliases if you use them
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Alias @ to src/frontend/src
    }
  },

  // CSS specific options - usually not needed for basic node_modules imports
  css: {
    // postcss: './postcss.config.js', // Vite automatically detects postcss.config.js
    preprocessorOptions: {
      // Example for SCSS if you were using it
      scss: {
        additionalData: `@import "vue3-grid-layout/dist/style.css";`
      }
    }
  }
})