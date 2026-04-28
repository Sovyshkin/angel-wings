import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const savedTheme = localStorage.getItem('peptidi_theme')
  const isDark = ref(savedTheme ? savedTheme === 'dark' : prefersDark)
  
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('peptidi_theme', isDark.value ? 'dark' : 'light')
  }
  
  watch(isDark, (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, { immediate: true })
  
  return { isDark, toggle }
})