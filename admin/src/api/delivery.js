import axios from 'axios'

const deliveryApi = axios.create({
  baseURL: '/api/delivery'
})

deliveryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('peptidi_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default deliveryApi
