import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    sourcemap: true,
    lib: {
      entry: 'canvas-txt/index.ts',
      name: 'canvasTxt',
      formats: ['es', 'umd'],
      fileName: (format) => `canvas-txt${format === 'es' ? '.esm.min.js' : '.umd.min.js' }`,
    },
  },
})
