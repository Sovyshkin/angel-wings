import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // Admin is served from the root of admin.angel-wings.ru. Absolute asset URLs
  // keep bundles loadable when a Vue history route is refreshed directly.
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/catalog-api': {
        target: 'https://angel-wings.ru',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/catalog-api/, '/api')
      }
    }
  }
})
