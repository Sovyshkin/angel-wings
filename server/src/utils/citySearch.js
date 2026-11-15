// Common names help with colloquial and historical spellings. All other cities
// are still searched in CDEK, so this list does not limit available countries.
const aliases = [
  ['Санкт-Петербург', 'RU', 'спб', 'питер', 'петербург', 'ленинград', 'saint petersburg', 'st petersburg', 'st. petersburg'],
  ['Москва', 'RU', 'мск', 'moscow', 'moskva'],
  ['Екатеринбург', 'RU', 'екб', 'екат', 'свердловск', 'ekaterinburg', 'yekaterinburg'],
  ['Новосибирск', 'RU', 'нск', 'новосиб', 'novosibirsk'],
  ['Нижний Новгород', 'RU', 'нн', 'горький', 'nizhny novgorod'],
  ['Ростов-на-Дону', 'RU', 'ростов на дону', 'rostov on don'],
  ['Набережные Челны', 'RU', 'челны', 'naberezhnye chelny'],
  ['Казань', 'RU', 'kazan', 'qazan'],
  ['Улан-Удэ', 'RU', 'улан удэ', 'ulan ude'],
  ['Йошкар-Ола', 'RU', 'йошкар ола', 'yoshkar ola'],
  ['Ханты-Мансийск', 'RU', 'ханты мансийск', 'khanty mansiysk'],
  ['Южно-Сахалинск', 'RU', 'южно сахалинск', 'yuzhno sakhalinsk'],
  ['Петропавловск-Камчатский', 'RU', 'петропавловск камчатский', 'petropavlovsk kamchatsky'],
  ['Комсомольск-на-Амуре', 'RU', 'комсомольск на амуре', 'komsomolsk on amur'],
  ['Алматы', 'KZ', 'алма ата', 'алма-ата', 'алматы', 'almaty', 'alma ata'],
  ['Астана', 'KZ', 'нур султан', 'нур-султан', 'целиноград', 'astana', 'nur sultan'],
  ['Шымкент', 'KZ', 'чимкент', 'shymkent', 'chimkent'],
  ['Актобе', 'KZ', 'актюбинск', 'aktobe', 'aktyubinsk'],
  ['Усть-Каменогорск', 'KZ', 'оскемен', 'усть каменогорск', 'ust kamenogorsk', 'oskemen'],
  ['Бишкек', 'KG', 'фрунзе', 'bishkek', 'frunze'],
  ['Ташкент', 'UZ', 'tashkent', 'toshkent'],
  ['Самарканд', 'UZ', 'samarkand', 'samarqand'],
  ['Минск', 'BY', 'minsk'],
  ['Ереван', 'AM', 'yerevan', 'erevan'],
  ['Тбилиси', 'GE', 'tbilisi'],
  ['Дубай', 'AE', 'dubai'],
  ['Абу-Даби', 'AE', 'абу даби', 'abu dhabi'],
  ['Стамбул', 'TR', 'istanbul', 'константинополь'],
  ['Анталья', 'TR', 'antalya', 'анталия']
].map(([city, countryCode, ...names]) => ({ city, countryCode, names: [city, ...names] }))

export const normalizeCitySearch = value => String(value || '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ё/g, 'е')
  .replace(/[‐‑–—-]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')

const transliteration = { а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ж:'zh', з:'z', и:'i', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ы:'y', э:'e', ю:'yu', я:'ya', ь:'', ъ:'' }
const toLatin = value => String(value).toLowerCase().replace(/[а-яё]/g, char => transliteration[char] ?? char)

export function cityLookupPlans(query, countryCode = '') {
  const normalized = normalizeCitySearch(query)
  if (normalized.length < 2) return []
  const country = String(countryCode || '').toUpperCase()
  const matches = aliases
    .filter(entry => (!country || entry.countryCode === country) && entry.names.some(name => normalizeCitySearch(name).startsWith(normalized)))
    .sort((a, b) => Number(b.names.some(name => normalizeCitySearch(name) === normalized)) - Number(a.names.some(name => normalizeCitySearch(name) === normalized)))
    .slice(0, 3)
  const plans = matches.map(entry => ({ name: entry.city, countryCode: entry.countryCode }))
  if (!plans.some(plan => normalizeCitySearch(plan.name) === normalized)) plans.push({ name: String(query).trim(), countryCode: country })
  return [...new Map(plans.map(plan => [`${normalizeCitySearch(plan.name)}:${plan.countryCode}`, plan])).values()]
}

export async function searchCdekCities(query, lookup, { countryCode = '', limit = 20 } = {}) {
  const plans = cityLookupPlans(query, countryCode)
  if (!plans.length) return []
  const settled = await Promise.allSettled(plans.map(plan => lookup(plan.name, { country_code: plan.countryCode })))
  const results = settled.flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [])
  if (!results.length && /[а-яё]/i.test(query)) {
    const fallback = toLatin(query)
    if (normalizeCitySearch(fallback) !== normalizeCitySearch(query)) {
      try { results.push(...await lookup(fallback, { country_code: countryCode })) } catch { /* Keep the original error below. */ }
    }
  }
  if (!results.length && settled.every(result => result.status === 'rejected')) throw settled[0].reason
  const seen = new Set()
  return results.filter(city => {
    if (!city?.code || seen.has(String(city.code))) return false
    seen.add(String(city.code))
    return true
  }).slice(0, limit)
}
