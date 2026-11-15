export function stripInternalProductFields(product) {
  const { costPrice, packageLength, packageWidth, packageHeight, ...publicProduct } = product
  return publicProduct
}

const money = value => Math.round(value * 100) / 100
const positivePrice = value => value === '' || value == null ? null : Number(value)

export function effectiveDosagePricing(item, product) {
  const rawPrice = positivePrice(item?.price)
  if (rawPrice === null || !Number.isFinite(rawPrice) || rawPrice < 0) {
    const basePrice = Number(product?.price)
    const baseCompare = Number(product?.comparePrice)
    return { price: null, comparePrice: basePrice > 0 && baseCompare > basePrice ? baseCompare : null }
  }
  const ownCompare = positivePrice(item?.comparePrice)
  if (Number.isFinite(ownCompare) && ownCompare > rawPrice) return { price: rawPrice, comparePrice: ownCompare }
  const basePrice = Number(product?.price)
  const baseCompare = Number(product?.comparePrice)
  if (basePrice > 0 && baseCompare > basePrice) {
    return { price: money(rawPrice * basePrice / baseCompare), comparePrice: rawPrice }
  }
  return { price: rawPrice, comparePrice: null }
}

export function getEffectiveDosagePrice(product, dosage) {
  if (!dosage || !product?.specs) return null
  try {
    const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs
    const item = specs?.dosages?.find(value => String(value?.dosage || '').trim() === String(dosage).trim())
    return item ? effectiveDosagePricing(item, product).price : null
  } catch { return null }
}

export function publicProductSpecs(rawSpecs, product = null) {
  let specs
  try {
    specs = typeof rawSpecs === 'string' ? JSON.parse(rawSpecs || '{}') : rawSpecs || {}
  } catch {
    return {}
  }
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return {}
  return {
    ...specs,
    ...(Array.isArray(specs.dosages)
      ? { dosages: specs.dosages.map(item => {
          if (!item || typeof item !== 'object') return item
          const { costPrice, ...publicDosage } = item
          if (!product) return publicDosage
          const pricing = effectiveDosagePricing(item, product)
          return { ...publicDosage, ...pricing }
        }) }
      : {})
  }
}
