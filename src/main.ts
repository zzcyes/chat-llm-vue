import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './views/ChatWebSocket.vue'
import 'normalize.css'
import '@arco-design/web-vue/dist/arco.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
