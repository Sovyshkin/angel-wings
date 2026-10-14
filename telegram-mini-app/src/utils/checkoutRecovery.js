const PENDING_UNPAID_ORDER_KEY = 'angel_wings_pending_unpaid_order'
const MAX_PENDING_UNPAID_ORDER_AGE_MS = 1000 * 60 * 60 * 24 * 7

function storageAvailable() {
  return typeof localStorage !== 'undefined'
}

function isExpired(payload) {
  const savedAt = new Date(payload?.savedAt || payload?.createdAt || 0).getTime()
  return !Number.isFinite(savedAt) || Date.now() - savedAt > MAX_PENDING_UNPAID_ORDER_AGE_MS
}

export function savePendingUnpaidOrder(payload) {
  if (!storageAvailable() || !payload?.orderId) return

  try {
    localStorage.setItem(PENDING_UNPAID_ORDER_KEY, JSON.stringify({
      ...payload,
      orderId: String(payload.orderId),
      amount: Number(payload.amount || 0),
      savedAt: new Date().toISOString()
    }))
  } catch {
    // Восстановление оплаты не должно ломать оформление заказа.
  }
}

export function getPendingUnpaidOrder() {
  if (!storageAvailable()) return null

  try {
    const payload = JSON.parse(localStorage.getItem(PENDING_UNPAID_ORDER_KEY) || 'null')
    if (!payload?.orderId || isExpired(payload)) {
      clearPendingUnpaidOrder()
      return null
    }

    return payload
  } catch {
    clearPendingUnpaidOrder()
    return null
  }
}

export function clearPendingUnpaidOrder(orderId = null) {
  if (!storageAvailable()) return

  try {
    if (orderId) {
      const payload = JSON.parse(localStorage.getItem(PENDING_UNPAID_ORDER_KEY) || 'null')
      if (payload?.orderId && String(payload.orderId) !== String(orderId)) return
    }

    localStorage.removeItem(PENDING_UNPAID_ORDER_KEY)
  } catch {
    localStorage.removeItem(PENDING_UNPAID_ORDER_KEY)
  }
}
