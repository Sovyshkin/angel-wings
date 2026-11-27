const DIRECT_KEYS = {
  directCampaignId: ['direct_campaign_id', 'directCampaignId', 'campaign_id'],
  directGroupId: ['direct_group_id', 'directGroupId', 'gbid'],
  directAdId: ['direct_ad_id', 'directAdId', 'ad_id'],
  directPhraseId: ['direct_phrase_id', 'directPhraseId', 'phrase_id']
}

export function normalizeDirectAttribution(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const result = {}
  for (const [field, keys] of Object.entries(DIRECT_KEYS)) {
    const value = keys.map(key => String(source[key] ?? '').trim()).find(Boolean)
    result[field] = value && /^\d{1,30}$/.test(value) ? value : null
  }
  const clickId = String(source.yclid ?? '').trim()
  result.yclid = clickId && /^[a-zA-Z0-9_-]{1,160}$/.test(clickId) ? clickId : null
  return result
}

export function normalizeLeadAttribution(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const text = (...keys) => {
    const value = keys.map(key => String(source[key] ?? '').trim()).find(Boolean)
    return value ? value.slice(0, 160) : null
  }
  return {
    utmSource: text('utm_source', 'utmSource'),
    utmMedium: text('utm_medium', 'utmMedium'),
    utmCampaign: text('utm_campaign', 'utmCampaign'),
    ...normalizeDirectAttribution(source)
  }
}
