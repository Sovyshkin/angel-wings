import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins: [vue()], server: { port: 5185, proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true }, '/catalog-api': { target: 'https://angel-wings.ru', changeOrigin: true, secure: true, rewrite: path => path.replace(/^\/catalog-api/, '/api') }, '/uploads': { target: 'http://localhost:3000', changeOrigin: true } } } })
