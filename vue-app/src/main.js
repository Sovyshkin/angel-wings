import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
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
app.use(createPinia())
app.use(router)
app.mount('#app')
