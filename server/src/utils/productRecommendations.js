import { publicProductSpecs, stripInternalProductFields } from './publicProduct.js'

export const RECOMMENDATION_LIMIT = 8

export function parseRecommendationIds(value, fieldName = 'Рекомендации') {
  if (value === undefined) return null
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      throw Object.assign(new Error(`${fieldName}: неверный формат`), { status: 400 })
    }
  }
  if (!Array.isArray(parsed) || parsed.length > RECOMMENDATION_LIMIT) {
    throw Object.assign(new Error(`${fieldName}: выберите не более ${RECOMMENDATION_LIMIT} товаров`), { status: 400 })
  }
  const ids = parsed.map(Number)
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    throw Object.assign(new Error(`${fieldName}: список товаров содержит ошибку или повторы`), { status: 400 })
  }
  return ids
}

export async function saveProductRecommendations(tx, sourceProductId, lists) {
  const changes = Object.entries(lists).filter(([, ids]) => ids !== null)
  if (!changes.length) return

  const ids = [...new Set(changes.flatMap(([, items]) => items))]
  if (ids.includes(sourceProductId)) {
    throw Object.assign(new Error('Нельзя рекомендовать товар самому себе'), { status: 400 })
  }
  if (ids.length) {
    const existingCount = await tx.product.count({ where: { id: { in: ids } } })
    if (existingCount !== ids.length) {
      throw Object.assign(new Error('Один из выбранных товаров не найден'), { status: 400 })
    }
  }

  for (const [placement, targetIds] of changes) {
    await tx.productRecommendation.deleteMany({ where: { sourceProductId, placement } })
    if (targetIds.length) {
      await tx.productRecommendation.createMany({
        data: targetIds.map((targetProductId, position) => ({
          sourceProductId,
          targetProductId,
          placement,
          position
        }))
      })
    }
  }
}

export function publicRecommendationProduct(product) {
  const value = stripInternalProductFields(product)
  let images = []
  try {
    images = JSON.parse(product.images || '[]')
  } catch {
    images = []
  }
  return {
    ...value,
    images: Array.isArray(images) ? images : [],
    specs: publicProductSpecs(product.specs)
  }
}

export function isRecommendationAvailable(product) {
  if (!product?.active) return false
  let specs
  try {
    specs = typeof product.specs === 'string' ? JSON.parse(product.specs || '{}') : product.specs
  } catch {
    specs = null
  }
  const dosages = specs?.dosages
  if (Array.isArray(dosages) && dosages.length) {
    return dosages.some(item => Number(item?.quantity || 0) > 0)
  }
  return Number(product.stock || 0) > 0
}
