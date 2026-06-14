import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/oriex-embedded-ai-lab/',
  plugins: [react()],
})
