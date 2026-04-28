import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('peptidi_admin_user') || 'null'))
  const token = ref(localStorage.getItem('peptidi_admin_token') || '')
  
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  
  async function login(email, password) {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
    user.value = data.user
    token.value = data.token
    localStorage.setItem('peptidi_admin_user', JSON.stringify(data.user))
    localStorage.setItem('peptidi_admin_token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }
  
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('peptidi_admin_user')
    localStorage.removeItem('peptidi_admin_token')
    delete axios.defaults.headers.common['Authorization']
  }
  
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }
  
  return { user, token, isAuthenticated, isAdmin, login, logout }
})