import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export const PROXY_API_PREFIX = '/cxyz/chat-llm-node'
export const BASE_PROJECT_PREFIX = '/projects/chat-llm-vue'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ArcoResolver()]
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true
        })
      ]
    }),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: 'analysis.html', //分析图生成的文件名
      open: true //如果存在本地服务端口，将在打包后自动展示
    })
  ],
  base: BASE_PROJECT_PREFIX,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: `@import "@arco-design/web-vue/es/style/index.less";`
      }
    }
  },
  server: {
    proxy: {
      [PROXY_API_PREFIX]: {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${PROXY_API_PREFIX}`), '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
