import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('grid-')
        }
      }
    })],
  
server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  /*css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "vue3-grid-layout/dist/style.css";`
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['vue-grid-layout/dist/vue-grid-layout.css'],
    }
  }*/
})