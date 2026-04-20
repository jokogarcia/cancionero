import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['coda_simple.svg', 'coda_192.png'],
      manifest: {
        name: 'Coda',
        short_name: 'Coda',
        description: 'PWA for creating, viewing and sharing song chords with lyrics',
        theme_color: '#aa3bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'coda_192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'coda_512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'coda_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
