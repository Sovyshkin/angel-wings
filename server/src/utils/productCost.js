export function getOrderItemUnitCost(item) {
  const product = item?.product
  const fallback = Math.max(0, Number(product?.costPrice) || 0)
  const dosage = String(item?.dosage || '').trim()
  if (!dosage || !product?.specs) return fallback

  let specs
  try {
    specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs
  } catch {
    return fallback
  }
  const variant = Array.isArray(specs?.dosages)
    ? specs.dosages.find(entry => String(entry?.dosage || '').trim() === dosage)
    : null
  if (!variant || variant.costPrice === null || variant.costPrice === undefined || variant.costPrice === '') return fallback
  const cost = Number(variant.costPrice)
  return Number.isFinite(cost) && cost >= 0 ? cost : fallback
}
