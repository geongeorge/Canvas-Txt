import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// @ts-ignore
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    })
  ],
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
