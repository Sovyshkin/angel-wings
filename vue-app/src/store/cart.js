import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('peptidi_cart') || '[]'))
  const lastAddedId = ref(null)
  
  // Delivery info
  const delivery = ref(JSON.parse(localStorage.getItem('peptidi_delivery') || '{}'))
  const deliveryPrice = ref(0)
  const deliveryMethods = ref([])
  
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const totalWithDelivery = computed(() => total.value + deliveryPrice.value)
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  
  // Calculate total weight for delivery (in grams)
  const totalWeight = computed(() =>
    items.value.reduce((sum, item) => {
      const itemWeight = Math.max(0, parseInt(item.weight) || 0)
      return sum + itemWeight * item.quantity
    }, 0)
  )
  
  function getItemKey(item) {
    return `${item.id}::${item.selectedDosage || ''}`
  }

  function addItem(product) {
    const normalizedWeight = Math.max(0, parseInt(product.weight) || 0)
    const productKey = getItemKey(product)
    const existing = items.value.find(i => getItemKey(i) === productKey)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, weight: normalizedWeight, quantity: 1, cartKey: productKey })
    }
    lastAddedId.value = product.id
    save()
  }
  
  function removeItem(productId, selectedDosage = null) {
    const key = `${productId}::${selectedDosage || ''}`
    items.value = items.value.filter(i => getItemKey(i) !== key)
    save()
  }
  
  function updateQuantity(productId, quantity, selectedDosage = null) {
    const key = `${productId}::${selectedDosage || ''}`
    const item = items.value.find(i => getItemKey(i) === key)
    if (item) {
      item.quantity = Math.max(1, quantity)
      save()
    }
  }
  
  function setDelivery(info) {
    delivery.value = info
    saveDelivery()
  }
  
  function setDeliveryPrice(price) {
    deliveryPrice.value = price
  }
  
  function setDeliveryMethods(methods) {
    deliveryMethods.value = methods
  }
  
  function saveDelivery() {
    localStorage.setItem('peptidi_delivery', JSON.stringify(delivery.value))
  }
  
  function clear() {
    items.value = []
    delivery.value = {}
    deliveryPrice.value = 0
    deliveryMethods.value = []
    save()
    saveDelivery()
  }
  
  function save() {
    localStorage.setItem('peptidi_cart', JSON.stringify(items.value))
  }
  
  return { 
    items, total, totalWithDelivery, count, totalWeight, 
    lastAddedId, delivery, deliveryPrice, deliveryMethods,
    addItem, removeItem, updateQuantity, clear, 
    setDelivery, setDeliveryPrice, setDeliveryMethods, saveDelivery
  }
})
