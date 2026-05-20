import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router/index.js'
import { useAuthStore } from './store/auth'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

axios.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      const authStore = useAuthStore(pinia)
      authStore.logout()

      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }

    return Promise.reject(error)
  }
)

app.mount('#app')
