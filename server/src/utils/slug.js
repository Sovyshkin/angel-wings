const CYRILLIC_TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
}

export function slugify(value, fallback = 'item') {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .split('')
    .map(char => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return normalized || fallback
}

export async function generateUniqueSlug(value, exists, fallback = 'item') {
  const baseSlug = slugify(value, fallback)
  let slug = baseSlug
  let suffix = 2

  while (await exists(slug)) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return slug
}
