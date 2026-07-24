const PURCHASE_STORAGE_PREFIX = 'angel_wings_ecommerce_purchase_'
const PENDING_PURCHASE_KEY = 'angel_wings_pending_purchase'

function getProductCategory(product) {
  const categories = Array.isArray(product?.categories) ? product.categories : []
  const firstCategory = categories[0]

  return product?.category?.name ||
    product?.categoryName ||
    firstCategory?.name ||
    firstCategory?.slug ||
    ''
}

function normalizeMoney(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100) / 100) : 0
}

function normalizeQuantity(value) {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) && number > 0 ? number : 1
}

export function toEcommerceProduct(product, options = {}) {
  if (!product) return null

  const id = String(product.sku || product.id || product.productId || '').trim()
  if (!id) return null

  const nameParts = [product.title || product.name || `Товар ${id}`]
  const dosage = product.selectedDosage || product.dosage
  if (dosage) nameParts.push(`(${dosage})`)

  return {
    id,
    name: nameParts.join(' '),
    price: normalizeMoney(options.price ?? product.price),
    brand: 'Angel Wings',
    category: options.category ?? getProductCategory(product),
    variant: dosage || undefined,
    quantity: normalizeQuantity(options.quantity ?? product.quantity)
  }
}

function pushEcommerceAction(action, products, actionField = null) {
  if (typeof window === 'undefined') return

  const normalizedProducts = (Array.isArray(products) ? products : [products])
    .map(product => product?.id ? product : toEcommerceProduct(product))
    .filter(Boolean)

  if (!normalizedProducts.length) return

  window.dataLayer = window.dataLayer || []

  const ecommerce = {
    currencyCode: 'RUB',
    [action]: {
      products: normalizedProducts
    }
  }

  if (actionField) {
    ecommerce[action].actionField = actionField
  }

  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({
    event: action,
    ecommerce
  })
}

export function pushAddToCart(product, quantity = 1) {
  pushEcommerceAction('add', toEcommerceProduct(product, { quantity }))
}

export function pushRemoveFromCart(product, quantity = 1) {
  pushEcommerceAction('remove', toEcommerceProduct(product, { quantity }))
}

export function pushProductDetail(product) {
  pushEcommerceAction('detail', toEcommerceProduct(product, { quantity: 1 }))
}

export function createPendingPurchasePayload(order, items, options = {}) {
  const orderId = String(order?.id || options.orderId || '').trim()
  if (!orderId) return null

  return {
    orderId,
    revenue: normalizeMoney(options.revenue ?? order?.total),
    tax: 0,
    shipping: normalizeMoney(options.shipping ?? order?.deliveryPrice),
    coupon: options.coupon || '',
    products: items
      .map(item => toEcommerceProduct(item))
      .filter(Boolean)
  }
}

export function savePendingPurchase(payload) {
  if (typeof sessionStorage === 'undefined' || !payload?.orderId) return

  try {
    sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(payload))
  } catch {
    // Ecommerce tracking must never break checkout.
  }
}

export function getPendingPurchase(orderId) {
  if (typeof sessionStorage === 'undefined') return null

  try {
    const payload = JSON.parse(sessionStorage.getItem(PENDING_PURCHASE_KEY) || 'null')
    if (!payload?.orderId) return null
    if (orderId && String(payload.orderId) !== String(orderId)) return null
    return payload
  } catch {
    return null
  }
}

export function clearPendingPurchase() {
  if (typeof sessionStorage === 'undefined') return

  try {
    sessionStorage.removeItem(PENDING_PURCHASE_KEY)
  } catch {
    // noop
  }
}

export function pushPurchase(payload) {
  if (typeof localStorage === 'undefined' || !payload?.orderId) return false

  const purchaseKey = `${PURCHASE_STORAGE_PREFIX}${payload.orderId}`

  try {
    if (localStorage.getItem(purchaseKey)) return false
  } catch {
    // Continue without duplicate protection if storage is unavailable.
  }

  pushEcommerceAction('purchase', payload.products, {
    id: String(payload.orderId),
    revenue: normalizeMoney(payload.revenue),
    tax: normalizeMoney(payload.tax),
    shipping: normalizeMoney(payload.shipping),
    coupon: payload.coupon || undefined
  })

  try {
    localStorage.setItem(purchaseKey, new Date().toISOString())
    clearPendingPurchase()
  } catch {
    // noop
  }

  return true
}
