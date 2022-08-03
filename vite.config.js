import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    lib: {
      entry: resolve(__dirname, 'src/canvas-txt/index.js'),
      name: 'canvasTxt',
      formats: ['es', 'umd'],
      fileName: 'canvas-txt'
    }
  }
})
