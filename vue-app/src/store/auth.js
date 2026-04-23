import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('peptidi_user') || 'null'))
  const token = ref(localStorage.getItem('peptidi_token') || '')
  
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  function login(userData, authToken) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('peptidi_user', JSON.stringify(userData))
    localStorage.setItem('peptidi_token', authToken)
  }
  
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('peptidi_user')
    localStorage.removeItem('peptidi_token')
  }
  
  function updateUser(data) {
    user.value = { ...user.value, ...data }
    localStorage.setItem('peptidi_user', JSON.stringify(user.value))
  }
  
  return { user, token, isAuthenticated, login, logout, updateUser }
})