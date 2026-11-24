export const UNKNOWN_PAYMENT_PERCENT = 2.5

export const DEFAULT_ACQUIRING_SETTINGS = Object.freeze({
  sbpPercent: 0.4,
  cardPercent: 2.5
})

const METHODS = [
  { method: 'sbp', key: 'sbpPercent', untilKey: 'sbpUntil', nextKey: 'sbpNextPercent' },
  { method: 'card', key: 'cardPercent', untilKey: 'cardUntil', nextKey: 'cardNextPercent' }
]

export function moscowDate(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date)
}

export function nextMoscowDay(dateString) {
  const start = new Date(`${dateString}T00:00:00+03:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || Number.isNaN(start.getTime()) || moscowDate(start) !== dateString) {
    throw new Error('Укажите корректную дату окончания ставки')
  }
  return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

export function parseAcquiringSettings(input) {
  const result = {}
  for (const key of Object.keys(DEFAULT_ACQUIRING_SETTINGS)) {
    const value = input?.[key]
    if (typeof value === 'boolean' || value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100) {
      throw new Error(`${key}: укажите число от 0 до 100`)
    }
    result[key] = Number(value)
  }
  return result
}

export function parseAcquiringPlan(input, now = new Date()) {
  const rates = parseAcquiringSettings(input)
  const schedules = {}
  for (const { method, untilKey, nextKey } of METHODS) {
    const until = String(input?.[untilKey] || '').trim()
    const next = input?.[nextKey]
    if (!until && (next === '' || next === null || next === undefined)) {
      schedules[method] = null
      continue
    }
    if (!until || next === '' || next === null || next === undefined || typeof next === 'boolean' || !Number.isFinite(Number(next)) || Number(next) < 0 || Number(next) > 100) {
      throw new Error(`${method === 'sbp' ? 'СБП' : 'Банковская карта'}: укажите дату окончания и следующую ставку от 0 до 100%`)
    }
    const effectiveFrom = nextMoscowDay(until)
    if (until < moscowDate(now)) throw new Error('Дата окончания ставки не может быть в прошлом')
    schedules[method] = { effectiveFrom, percent: Number(next) }
  }
  return { rates, schedules }
}

export function getEffectiveAcquiringPercent(settings, method, date = new Date()) {
  const config = METHODS.find(entry => entry.method === method)
  if (!config) return UNKNOWN_PAYMENT_PERCENT
  let percent = Number(settings?.baseRates?.[config.key] ?? settings?.[config.key] ?? DEFAULT_ACQUIRING_SETTINGS[config.key])
  const at = new Date(date || Date.now()).getTime()
  for (const period of settings?.periods?.[method] || []) {
    if (new Date(period.effectiveFrom).getTime() <= at) percent = Number(period.percent)
    else break
  }
  return percent
}

export async function getAcquiringSettings(prisma) {
  const [saved, periods] = await Promise.all([
    prisma.acquiringSettings.findUnique({ where: { id: 1 } }),
    prisma.acquiringRatePeriod?.findMany({ orderBy: { effectiveFrom: 'asc' } }) || []
  ])
  const baseRates = saved
    ? { sbpPercent: saved.sbpPercent, cardPercent: saved.cardPercent }
    : { ...DEFAULT_ACQUIRING_SETTINGS }
  const grouped = { sbp: [], card: [] }
  for (const period of periods) {
    if (grouped[period.method]) grouped[period.method].push({ effectiveFrom: period.effectiveFrom, percent: period.percent })
  }
  const now = new Date()
  const result = { baseRates, periods: grouped }
  for (const { method, key, untilKey, nextKey } of METHODS) {
    result[key] = getEffectiveAcquiringPercent(result, method, now)
    const future = grouped[method].find(period => new Date(period.effectiveFrom) > now)
    result[untilKey] = future ? moscowDate(new Date(new Date(future.effectiveFrom).getTime() - 1)) : ''
    result[nextKey] = future ? future.percent : null
  }
  return result
}
