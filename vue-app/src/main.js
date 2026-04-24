import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import AOS from 'aos'

import 'aos/dist/aos.css'

const initAOS = () => {
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50,
    delay: 50,
    startEvent: 'DOMContentLoaded',
    animatedClassName: 'aos',
    initClassName: 'aos-init',
    useClassNames: true,
    disableMutationObserver: false,
    throttleDelay: 99,
    debounceDelay: 99,
  })
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initAOS, 100)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAOS, 100)
  })
}
