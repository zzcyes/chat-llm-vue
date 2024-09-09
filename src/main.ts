import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'normalize.css'
import '@arco-design/web-vue/dist/arco.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
