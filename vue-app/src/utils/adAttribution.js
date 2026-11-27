export const ATTRIBUTION_STORAGE_KEY = 'angel_wings_attribution'
export const ATTRIBUTION_KEYS = [
  'aw_m', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'direct_campaign_id', 'direct_group_id', 'direct_ad_id', 'direct_phrase_id', 'yclid'
]

export function getStoredAttribution() {
  if (typeof window === 'undefined') return {}
  try {
    const stored = JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '{}')
    const capturedAt = new Date(stored.capturedAt).getTime()
    if (!Number.isFinite(capturedAt) || Date.now() - capturedAt > 30 * 86400000 || capturedAt > Date.now()) return {}
    return Object.fromEntries(ATTRIBUTION_KEYS.filter(key => stored[key]).map(key => [key, stored[key]]))
  } catch {
    return {}
  }
}
