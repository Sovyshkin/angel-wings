export function priceSnapshot(product) {
  let specs = product.specs
  if (typeof specs === 'string') {
    try { specs = JSON.parse(specs) } catch { specs = {} }
  }
  return {
    price: Number(product.price),
    comparePrice: product.comparePrice == null ? null : Number(product.comparePrice),
    costPrice: Number(product.costPrice || 0),
    dosages: Array.isArray(specs?.dosages) ? specs.dosages.map(item => ({
      dosage: item.dosage,
      price: item.price ?? null,
      comparePrice: item.comparePrice ?? null,
      costPrice: item.costPrice ?? null
    })) : []
  }
}

export async function recordPriceChange(tx, beforeProduct, afterProduct, source) {
  const before = priceSnapshot(beforeProduct)
  const after = priceSnapshot(afterProduct)
  if (JSON.stringify(before) === JSON.stringify(after)) return
  await tx.productPriceChange.create({ data: {
    productId: beforeProduct.id,
    before: JSON.stringify(before),
    after: JSON.stringify(after),
    source
  } })
}
