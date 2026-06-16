const SESSION_KEY = 'angel_wings_analytics_session_id'

function getSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing

    const sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(16).slice(2)}`

    sessionStorage.setItem(SESSION_KEY, sessionId)
    return sessionId
  } catch {
    return null
  }
}

export function trackProductEvent(productId, event, options = {}) {
  const id = Number.parseInt(productId, 10)
  if (!Number.isFinite(id) || id <= 0 || !event) return

  const payload = JSON.stringify({
    productId: id,
    event,
    sessionId: getSessionId(),
    source: options.source || null,
    quantity: options.quantity || null
  })

  try {
    if (navigator?.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/product-event', blob)
      return
    }
  } catch {
    // Fall back to fetch below.
  }

  fetch('/api/analytics/product-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true
  }).catch(() => {})
}
