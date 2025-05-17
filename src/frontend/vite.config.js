import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "vue3-grid-layout/dist/vue-grid-layout.css";`
      }
    }
  },
  plugins: [vue()],
  server: {
    port: 54168,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "vue3-grid-layout/dist/style.css";`
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['vue3-grid-layout/dist/style.css'],
    }
  }
})