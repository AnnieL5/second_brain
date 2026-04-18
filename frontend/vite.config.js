import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/folders': 'http://localhost:8000',
      '/entries': 'http://localhost:8000',
      '/store':   'http://localhost:8000',
      '/search':  'http://localhost:8000',
    }
  }
})