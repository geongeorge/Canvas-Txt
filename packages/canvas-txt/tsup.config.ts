import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'canvasTxt',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2022',
})
