import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('peptidi_admin_user') || 'null'))
  const token = ref(localStorage.getItem('peptidi_admin_token') || '')
  
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isCopywriter = computed(() => user.value?.role === 'COPYWRITER')
  const landingPath = computed(() => isCopywriter.value ? '/blog' : '/dashboard')
  
  async function login(email, password) {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password, adminLogin: true })
    if (data.requiresLoginVerification) return data
    setAuth(data)
    return data
  }

  function setAuth(data) {
    user.value = data.user
    token.value = data.token
    localStorage.setItem('peptidi_admin_user', JSON.stringify(data.user))
    localStorage.setItem('peptidi_admin_token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  async function refreshUser() {
    if (!token.value) return false
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`)
      if (data.user?.role !== 'ADMIN' && !(data.user?.role === 'COPYWRITER' && data.adminPanel === true)) {
        logout()
        return false
      }
      user.value = data.user
      localStorage.setItem('peptidi_admin_user', JSON.stringify(data.user))
      return true
    } catch {
      logout()
      return false
    }
  }

  async function verifyLogin(email, code, challengeToken) {
    const { data } = await axios.post(`${API_URL}/auth/verify-email`, {
      email,
      code,
      purpose: 'login_verification',
      challengeToken,
      adminLogin: true
    })
    setAuth(data)
    return data
  }

  async function resendLoginCode(email, challengeToken) {
    const { data } = await axios.post(`${API_URL}/auth/resend-verification`, {
      email,
      purpose: 'login_verification',
      challengeToken,
      adminLogin: true
    })
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
  
  return { user, token, isAuthenticated, isAdmin, isCopywriter, landingPath, login, verifyLogin, resendLoginCode, refreshUser, logout }
})
