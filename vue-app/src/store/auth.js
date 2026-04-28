import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('peptidi_user') || 'null'))
  const token = ref(localStorage.getItem('peptidi_token') || '')

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function login(email, password) {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
      user.value = data.user
      token.value = data.token
      localStorage.setItem('peptidi_user', JSON.stringify(data.user))
      localStorage.setItem('peptidi_token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      return data
    } catch (e) {
      const message = e.response?.data?.error || e.message || 'Ошибка авторизации'
      throw new Error(translateError(message))
    }
  }

  function translateError(message) {
    const errors = {
      'Invalid credentials': 'Неверный email или пароль',
      'User not found': 'Пользователь не найден',
      'Incorrect password': 'Неверный пароль',
      'Email already exists': 'Пользователь с таким email уже существует',
      'Validation error': 'Ошибка валидации',
      'email': 'Неверный формат email',
      'password': 'Пароль должен содержать минимум 8 символов',
      'Network Error': 'Ошибка сети. Проверьте подключение к интернету',
    }
    const lowerMessage = message.toLowerCase()
    for (const [key, value] of Object.entries(errors)) {
      if (lowerMessage.includes(key.toLowerCase())) {
        return value
      }
    }
    return 'Произошла ошибка. Попробуйте снова.'
  }

  async function register(userData) {
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, userData)
      user.value = data.user
      token.value = data.token
      localStorage.setItem('peptidi_user', JSON.stringify(data.user))
      localStorage.setItem('peptidi_token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      return data
    } catch (e) {
      const message = e.response?.data?.error || e.response?.data?.message || e.message || 'Ошибка регистрации'
      throw new Error(translateError(message))
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('peptidi_user')
    localStorage.removeItem('peptidi_token')
    delete axios.defaults.headers.common['Authorization']
  }

  async function updateUser(data) {
    const { data: updated } = await axios.put(`${API_URL}/auth/me`, data)
    user.value = updated.user
    localStorage.setItem('peptidi_user', JSON.stringify(updated.user))
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`)
      user.value = data.user
      localStorage.setItem('peptidi_user', JSON.stringify(data.user))
    } catch (e) {
      logout()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    fetchUser
  }
})