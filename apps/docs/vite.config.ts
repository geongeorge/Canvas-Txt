import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Use the library source directly so the playground hot-reloads
      // alongside library changes during development.
      'canvas-txt': path.resolve(__dirname, '../../packages/canvas-txt/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
