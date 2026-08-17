import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build also works from a subfolder (GitHub Pages, shared hosting).
  base: './',
  server: { port: 5173, open: true },
  build: { outDir: 'dist', assetsInlineLimit: 2048 },
})
