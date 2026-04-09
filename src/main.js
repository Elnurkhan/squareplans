import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.config.globalProperties.$base = import.meta.env.BASE_URL
app.mount('#app')
