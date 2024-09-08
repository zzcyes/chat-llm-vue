/// <reference types="@arco-design/web-vue/es/type" />
/// <reference types="vite/client" />

declare module 'markdown-it'
declare module '@arco-design/web-vue'
declare module '@arco-design/web-vue/es/icon'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
