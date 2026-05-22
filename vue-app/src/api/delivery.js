import axios from 'axios'

const deliveryApi = axios.create({
  baseURL: '/api/delivery'
})

export default deliveryApi
