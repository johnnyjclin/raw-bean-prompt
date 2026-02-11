import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  base: './',
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'dotlottie': ['@lottiefiles/dotlottie-react', '@lottiefiles/dotlottie-web'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
