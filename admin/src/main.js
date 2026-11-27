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

axios.interceptors.request.use(config => {
  const authStore = useAuthStore(pinia)
  if (authStore.isObserver && !['get', 'head', 'options'].includes(String(config.method || 'get').toLowerCase())) {
    const error = new Error('Наблюдатель может только просматривать данные')
    error.response = { status: 403, data: { error: error.message } }
    return Promise.reject(error)
  }
  return config
})

axios.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status
    const reason = String(error?.response?.data?.error || error?.response?.data?.message || '').toLowerCase()
    const sessionIsInvalid = status === 401 && [
      'invalid token',
      'no token provided',
      'user not found'
    ].some(message => reason.includes(message))

    if (sessionIsInvalid) {
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
