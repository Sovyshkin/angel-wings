export function stripInternalProductFields(product) {
  const { costPrice, packageLength, packageWidth, packageHeight, ...publicProduct } = product
  return publicProduct
}

export function publicProductSpecs(rawSpecs) {
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
          return publicDosage
        }) }
      : {})
  }
}
