import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import './assets/styles/main.css'
import AOS from 'aos'

import 'aos/dist/aos.css'

AOS.init({
  duration: 600,
  easing: 'ease-out-cubic',
  once: true,
  offset: 80,
  delay: 50,
  disable: false,
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

axios.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status
    const message = error?.response?.data?.error || error?.response?.data?.message || ''
    const isInvalidToken = typeof message === 'string' && message.toLowerCase().includes('invalid token')

    if (status === 401 && isInvalidToken) {
      const authStore = useAuthStore(pinia)
      authStore.logout()

      if (router.currentRoute.value.path !== '/auth') {
        router.push('/auth')
      }
    }

    return Promise.reject(error)
  }
)

app.mount('#app')
