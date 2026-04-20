import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Minimal-Weather-App-Using-REACT/docs/' : '/',
  plugins: [react()],
}))
