function toMs(value) {
  const ms = new Date(value || 0).getTime()
  return Number.isFinite(ms) ? ms : 0
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

  if (code.includes('DELIVERED')) return 'DELIVERED'

  if (
    code.includes('NOT_DELIVERED') ||
    code.includes('CANCEL') ||
    code.includes('RETURN') ||
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

