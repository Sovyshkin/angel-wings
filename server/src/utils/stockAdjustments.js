const MAX_STOCK = 2147483647
const MAX_BATCH_SIZE = 100

export function parseStockAdjustmentRequest(body) {
  const mode = body?.mode
  if (mode !== 'increase' && mode !== 'set') {
    throw Object.assign(new Error('Выберите способ изменения остатка'), { status: 400 })
  }

  const rawEntries = body?.entries
  if (!Array.isArray(rawEntries) || rawEntries.length < 1 || rawEntries.length > MAX_BATCH_SIZE) {
    throw Object.assign(new Error(`Выберите от 1 до ${MAX_BATCH_SIZE} товаров`), { status: 400 })
  }

  const seen = new Set()
  const entries = rawEntries.map(entry => {
    const productId = entry?.productId
    const dosage = entry?.dosage == null ? null : String(entry.dosage).trim()
    const quantity = entry?.quantity
    const expectedStock = entry?.expectedStock
    const key = `${productId}:${dosage || ''}`
    if (!Number.isInteger(productId) || productId < 1 || (dosage !== null && (!dosage || dosage.length > 200)) || seen.has(key)) {
      throw Object.assign(new Error('Список товаров содержит некорректную или повторяющуюся позицию'), { status: 400 })
    }
    seen.add(key)
    if (!Number.isInteger(quantity) || quantity < (mode === 'increase' ? 1 : 0) || quantity > MAX_STOCK) {
      throw Object.assign(new Error('Количество должно быть целым неотрицательным числом; для поступления — больше нуля'), { status: 400 })
    }
    if (mode === 'set' && (!Number.isInteger(expectedStock) || expectedStock < 0 || expectedStock > MAX_STOCK)) {
      throw Object.assign(new Error('Обновите текущие остатки перед установкой нового значения'), { status: 400 })
    }
    return { productId, ...(dosage ? { dosage } : {}), quantity, ...(mode === 'set' ? { expectedStock } : {}) }
  })

  return { mode, entries }
}

export async function applyStockAdjustments(tx, { mode, entries }) {
  const result = []
  for (const entry of entries) {
    const product = await tx.product.findUnique({
      where: { id: entry.productId },
      select: { id: true, title: true, stock: true, specs: true }
    })
    if (!product) {
      throw Object.assign(new Error(`Товар #${entry.productId} не найден`), { status: 404 })
    }

    let specs
    try { specs = JSON.parse(product.specs || '{}') } catch { specs = {} }
    const variants = Array.isArray(specs?.dosages) ? specs.dosages : []
    if (variants.length || entry.dosage) {
      const matches = variants.map((variant, index) => ({ variant, index }))
        .filter(({ variant }) => String(variant?.dosage || '').trim() === entry.dosage)
      if (matches.length !== 1) {
        throw Object.assign(new Error(`Выберите существующую дозировку товара «${product.title}»`), { status: 400 })
      }
      const { variant, index } = matches[0]
      const previousStock = Number(variant.quantity)
      if (!Number.isSafeInteger(previousStock) || previousStock < 0 || previousStock > MAX_STOCK) {
        throw Object.assign(new Error(`Некорректный остаток дозировки «${entry.dosage}»`), { status: 409, productId: entry.productId, dosage: entry.dosage })
      }
      if (mode === 'set' && previousStock !== entry.expectedStock) {
        throw Object.assign(new Error(`Остаток «${product.title} · ${entry.dosage}» изменился. Обновите данные.`), { status: 409, productId: entry.productId, dosage: entry.dosage })
      }
      const nextStock = mode === 'increase' ? previousStock + entry.quantity : entry.quantity
      const delta = nextStock - previousStock
      if (product.stock + delta < 0) {
        throw Object.assign(new Error(`Общий остаток «${product.title}» меньше изменения дозировки. Сверьте остатки в карточке товара.`), { status: 409, productId: entry.productId, dosage: entry.dosage })
      }
      if (nextStock > MAX_STOCK || product.stock + delta > MAX_STOCK) {
        throw Object.assign(new Error(`Остаток «${product.title} · ${entry.dosage}» превышает допустимый предел.`), { status: 409, productId: entry.productId, dosage: entry.dosage })
      }
      const nextSpecs = { ...specs, dosages: variants.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: nextStock } : item) }
      const updated = await tx.product.updateMany({
        where: { id: entry.productId, specs: product.specs, stock: product.stock },
        data: { specs: JSON.stringify(nextSpecs), stock: product.stock + delta }
      })
      if (!updated.count) {
        throw Object.assign(new Error(`Остаток «${product.title} · ${entry.dosage}» изменился. Обновите данные.`), { status: 409, productId: entry.productId, dosage: entry.dosage })
      }
      result.push({ id: product.id, title: product.title, dosage: entry.dosage, previousStock, stock: nextStock })
      continue
    }

    const where = mode === 'increase'
      ? { id: entry.productId, stock: { lte: MAX_STOCK - entry.quantity } }
      : { id: entry.productId, stock: entry.expectedStock }
    const data = mode === 'increase'
      ? { stock: { increment: entry.quantity } }
      : { stock: entry.quantity }
    const updated = await tx.product.updateMany({ where, data })
    if (!updated.count) {
      const message = mode === 'set'
        ? `Остаток товара «${product.title}» изменился. Обновите данные и повторите действие.`
        : `Остаток товара «${product.title}» превышает допустимый предел.`
      throw Object.assign(new Error(message), { status: 409, productId: entry.productId })
    }
    const current = await tx.product.findUnique({ where: { id: entry.productId }, select: { stock: true } })
    result.push({ id: product.id, title: product.title, previousStock: mode === 'increase' ? current.stock - entry.quantity : entry.expectedStock, stock: current.stock })
  }
  return result
}

export { MAX_STOCK }
