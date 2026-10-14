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

function isCdekRecipientPaidDelivery(order) {
  const tariffName = String(order?.deliveryTariffName || '').toLowerCase()
  return Boolean(order?.cdekOrderUuid || order?.deliveryPickupPoint || tariffName.includes('сдэк'))
}

export function createPurchasePayloadFromOrder(order) {
  const orderId = String(order?.id || '').trim()
  const items = Array.isArray(order?.items) ? order.items : []
  if (!orderId || !items.length) return null

  const sitePaidShipping = isCdekRecipientPaidDelivery(order)
    ? 0
    : normalizeMoney(order?.deliveryPrice)
  const revenue = normalizeMoney(order?.total)
  const goodsRevenue = Math.max(0, normalizeMoney(revenue - sitePaidShipping))
  const grossGoodsTotal = items.reduce((sum, item) => {
    return sum + normalizeMoney(item?.price) * normalizeQuantity(item?.quantity)
  }, 0)

  let allocatedCents = 0
  const products = items.map((item, index) => {
    const quantity = normalizeQuantity(item?.quantity)
    const grossLineTotal = normalizeMoney(item?.price) * quantity
    const isLast = index === items.length - 1
    const lineCents = isLast
      ? Math.max(0, Math.round(goodsRevenue * 100) - allocatedCents)
      : Math.max(0, Math.round(goodsRevenue * 100 * (grossGoodsTotal > 0 ? grossLineTotal / grossGoodsTotal : 0)))
    allocatedCents += lineCents

    return toEcommerceProduct({
      id: item?.product?.id || item?.productId || item?.id,
      sku: item?.product?.sku,
      title: item?.product?.title || item?.title,
      dosage: item?.dosage,
      quantity,
      categories: item?.product?.categories || []
    }, {
      quantity,
      price: quantity > 0 ? lineCents / 100 / quantity : 0
    })
  }).filter(Boolean)

  return {
    orderId,
    revenue,
    tax: 0,
    shipping: sitePaidShipping,
    coupon: order?.promoCode?.code || '',
    products
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
