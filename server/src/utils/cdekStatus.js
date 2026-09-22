function toMs(value) {
  const ms = new Date(value || 0).getTime()
  return Number.isFinite(ms) ? ms : 0
}

const FINAL_LOCAL_STATUSES = new Set(['DELIVERED', 'RETURNED', 'CANCELLED'])

export function isFinalLocalOrderStatus(status) {
  return FINAL_LOCAL_STATUSES.has(String(status || '').trim().toUpperCase())
}

// CDEK may temporarily return a technical creation status even for an order
// which has already been closed locally. Such a response must never demote a
// final order back to processing or shipping.
export function canApplyCdekStatus(currentLocalStatus, nextLocalStatus) {
  if (!nextLocalStatus || nextLocalStatus === currentLocalStatus) return false
  return !isFinalLocalOrderStatus(currentLocalStatus)
}

function messageFromEntry(entry) {
  if (typeof entry === 'string') return entry.trim()
  if (!entry || typeof entry !== 'object') return null

  for (const key of ['message', 'description', 'comment', 'text', 'error']) {
    if (typeof entry[key] === 'string' && entry[key].trim()) return entry[key].trim()
  }

  return null
}

// CDEK sends validation problems at different nesting levels depending on the
// request type. Return a clean, de-duplicated list for the admin interface.
export function extractCdekMessages(payload) {
  const messages = new Set()
  const visited = new WeakSet()

  const visit = (value, key = '') => {
    if (typeof value === 'string') {
      if (['errors', 'error', 'warnings', 'warning', 'messages'].includes(key) && value.trim()) {
        messages.add(value.trim())
      }
      return
    }
    if (!value || typeof value !== 'object' || visited.has(value)) return
    visited.add(value)

    if (['errors', 'error', 'warnings', 'warning', 'messages'].includes(key)) {
      const message = messageFromEntry(value)
      if (message) messages.add(message)
    }

    for (const [childKey, childValue] of Object.entries(value)) {
      if (['errors', 'error', 'warnings', 'warning', 'messages', 'entity', 'packages'].includes(childKey)) {
        if (Array.isArray(childValue)) childValue.forEach(item => visit(item, childKey))
        else visit(childValue, childKey)
      }
    }
  }

  visit(payload)
  return [...messages]
}

export function extractLatestCdekStatus(payload) {
  const direct = payload?.entity?.status || payload?.status
  if (direct) {
    if (typeof direct === 'string') {
      return { code: String(direct).toUpperCase(), name: null, dateTime: null, source: 'direct' }
    }

    const directCode = direct?.code || direct?.status || direct?.name
    if (directCode) {
      return {
        code: String(directCode).toUpperCase(),
        name: direct?.name || null,
        dateTime: direct?.date_time || direct?.date || null,
        source: 'direct'
      }
    }
  }

  const statuses = Array.isArray(payload?.entity?.statuses) ? payload.entity.statuses : []
  if (!statuses.length) return null

  const latest = [...statuses].sort((a, b) => toMs(a?.date_time || a?.date) - toMs(b?.date_time || b?.date)).at(-1)
  if (!latest) return null

  const code = latest?.code || latest?.status || latest?.name
  if (!code) return null

  return {
    code: String(code).toUpperCase(),
    name: latest?.name || null,
    dateTime: latest?.date_time || latest?.date || null,
    source: 'statuses'
  }
}

export function mapCdekStatusToLocal(cdekStatusCode) {
  const code = String(cdekStatusCode || '').toUpperCase()
  if (!code) return null

  if (
    code.includes('RETURN') ||
    code.includes('NOT_DELIVERED') ||
    code.includes('НЕ ВРУЧЕН') ||
    code.includes('ВОЗВРАТ')
  ) {
    return 'RETURNED'
  }

  if (code === 'DELIVERED' || code.includes('ORDER_DELIVERED')) return 'DELIVERED'

  if (
    code.includes('CANCEL') ||
    code.includes('INVALID') ||
    code.includes('REMOVED')
  ) {
    return 'CANCELLED'
  }

  if (
    code.includes('READY_FOR_PICKUP') ||
    code.includes('IN_TRANSIT') ||
    code.includes('ON_WAY') ||
    code.includes('AT_PICKUP') ||
    code.includes('IN_CITY')
  ) {
    return 'SHIPPED'
  }

  if (
    code.includes('CREATED') ||
    code.includes('ACCEPTED') ||
    code.includes('NEW')
  ) {
    return 'PROCESSING'
  }

  return null
}
