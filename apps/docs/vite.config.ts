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
  preview: {
    // The site is static and served publicly, so the DNS-rebinding
    // host check `vite preview` applies by default isn't needed.
    allowedHosts: true,
  },
})
