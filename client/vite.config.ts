import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'node:path'

// Используем текущую рабочую директорию
const rootDir = process.cwd()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'client/src'),
      '@shared': path.resolve(rootDir, 'shared'),
      '@assets': path.resolve(rootDir, 'attached_assets'),
    },
  },
  root: path.resolve(rootDir, 'client'),
  build: {
    outDir: path.resolve(rootDir, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
})
