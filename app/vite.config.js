import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // '/' for local development; the GitHub Pages build sets VITE_BASE=/skee-block/ (see .github/workflows/pages.yml).
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
