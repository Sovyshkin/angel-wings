import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = '/api'

export const useProductStore = defineStore('products', () => {
  const products = ref([])
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchProducts(category = '') {
    loading.value = true
    error.value = null
    try {
      const params = category ? { category } : {}
      const { data } = await axios.get(`${API_URL}/products`, { params })
      products.value = data.products || []
    } catch (e) {
      error.value = e.message
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await axios.get(`${API_URL}/categories`)
      categories.value = data.categories || []
    } catch (e) {
      categories.value = []
    }
  }

  async function fetchProduct(slug) {
    const { data } = await axios.get(`${API_URL}/products/${slug}`)
    return data.product
  }

  async function createProduct(productData) {
    const { data } = await axios.post(`${API_URL}/products`, productData)
    return data
  }

  async function deleteProduct(id) {
    await axios.delete(`${API_URL}/products/${id}`)
  }

  async function createCategory(data) {
    const { data: result } = await axios.post(`${API_URL}/categories`, data)
    return result
  }

  async function deleteCategory(id) {
    await axios.delete(`${API_URL}/categories/${id}`)
  }

  async function createOrder(items, customer, userId = null) {
    const orderData = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: customer.address,
      notes: customer.comment
    }
    if (userId) {
      orderData.userId = userId
    }
    try {
      const { data } = await axios.post(`${API_URL}/orders`, orderData)
      return data
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message)
    }
  }

  async function fetchOrders() {
    try {
      const { data } = await axios.get(`${API_URL}/orders/my`)
      return data.orders
    } catch (e) {
      return []
    }
  }

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    fetchProduct,
    createProduct,
    deleteProduct,
    createCategory,
    deleteCategory,
    createOrder,
    fetchOrders
  }
})