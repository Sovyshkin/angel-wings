export function normalizeSearchText(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е')
}

export function includesSearchText(value, normalizedQuery) {
  return normalizeSearchText(value).includes(normalizedQuery)
}

// SQLite's LIKE/NOCASE folds ASCII but not Cyrillic. Use JavaScript for Unicode queries.
export function needsUnicodeSearch(value) {
  return /[^\x00-\x7f]/.test(String(value || ''))
}

export function matchesAnySearchText(normalizedQuery, values) {
  return values.some(value => includesSearchText(value, normalizedQuery))
}
