import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import path from "path";

export default defineConfig({
  plugins: [vue()],
  root: 'src',
  resolve:{
    alias: [
    // @ts-ignore
      { find: 'canvas-txt', replacement:  path.resolve(__dirname, "../src/canvas-txt/index.ts"), },
    ]
  },
  build: {
    outDir: '../dist-docs',
  }
})
