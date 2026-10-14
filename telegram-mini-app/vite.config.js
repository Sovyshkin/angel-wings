import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  publicDir: resolve(dirname(fileURLToPath(import.meta.url)), '../vue-app/public'),
  server: {
    port: 5174,
    proxy: { '/api': 'http://localhost:3000', '/uploads': 'http://localhost:3000' }
  }
})
