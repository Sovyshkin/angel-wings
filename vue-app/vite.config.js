import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function inlineEntryCss() {
  return {
    name: 'inline-entry-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      const htmlAsset = bundle['index.html']
      if (!htmlAsset || htmlAsset.type !== 'asset') return

      let html = String(htmlAsset.source)
      const entryCssLinks = [...html.matchAll(/<link rel="stylesheet" crossorigin href="\/assets\/([^"]+\.css)">/g)]

      for (const [, fileName] of entryCssLinks) {
        const assetKey = `assets/${fileName}`
        const cssAsset = bundle[assetKey]
        if (!cssAsset || cssAsset.type !== 'asset') continue

        const linkTag = `<link rel="stylesheet" crossorigin href="/${assetKey}">`
        html = html.replace(linkTag, `<style>${String(cssAsset.source)}</style>`)
        delete bundle[assetKey]
      }

      htmlAsset.source = html
    }
  }
}

export default defineConfig({
  plugins: [vue(), inlineEntryCss()],
  server: {
    port: 5173,
    allowedHosts: ['squishy-yummy-coliseum.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
