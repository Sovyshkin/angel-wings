import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router.js'
import { useAuthStore } from './store/auth.js'
import './assets/main.css'
import './assets/mini.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)
// Telegram accounts use separate local storage keys from the public website.

axios.interceptors.response.use(response => response, async error => {
  if (error?.response?.status === 401 && error?.config?.url !== '/api/auth/telegram') {
    auth.logout()
    window.dispatchEvent(new Event('telegram-auth-expired'))
  }
  return Promise.reject(error)
})

app.mount('#app')
