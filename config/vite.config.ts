import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    lib: {
      entry: 'canvas-txt/index.ts',
      name: 'canvasTxt',
      fileName: 'canvas-txt',
    },
  },
  plugins: [dts()],
})
