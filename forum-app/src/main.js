import { createApp } from 'vue'
import App from './App.vue'
import 'lenis/dist/lenis.css'
import './styles/main.css'
import './styles/sections.css'
import { installCustomSelects } from '../../shared/customSelect.js'
createApp(App).mount('#app')
installCustomSelects()
