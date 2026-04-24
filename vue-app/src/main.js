import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import AOS from 'aos'

import 'aos/dist/aos.css'

AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100,
  delay: 100,
  disable: false,
  startEvent: 'load',
  touch: true,
  keyboard: true,
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
