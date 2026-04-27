import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('peptidi_cart') || '[]'))
  const lastAddedId = ref(null)
  
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  
  function addItem(product) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
    lastAddedId.value = product.id
    save()
  }
  
  function removeItem(productId) {
    items.value = items.value.filter(i => i.id !== productId)
    save()
  }
  
  function updateQuantity(productId, quantity) {
    const item = items.value.find(i => i.id === productId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      save()
    }
  }
  
  function clear() {
    items.value = []
    save()
  }
  
  function save() {
    localStorage.setItem('peptidi_cart', JSON.stringify(items.value))
  }
  
  return { items, total, count, lastAddedId, addItem, removeItem, updateQuantity, clear }
})
