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
    const quantity = entry?.quantity
    const expectedStock = entry?.expectedStock
    if (!Number.isInteger(productId) || productId < 1 || seen.has(productId)) {
      throw Object.assign(new Error('Список товаров содержит некорректный или повторяющийся ID'), { status: 400 })
    }
    seen.add(productId)
    if (!Number.isInteger(quantity) || quantity < (mode === 'increase' ? 1 : 0) || quantity > MAX_STOCK) {
      throw Object.assign(new Error('Количество должно быть целым неотрицательным числом; для поступления — больше нуля'), { status: 400 })
    }
    if (mode === 'set' && (!Number.isInteger(expectedStock) || expectedStock < 0 || expectedStock > MAX_STOCK)) {
      throw Object.assign(new Error('Обновите текущие остатки перед установкой нового значения'), { status: 400 })
    }
    return { productId, quantity, ...(mode === 'set' ? { expectedStock } : {}) }
  })

  return { mode, entries }
}

export async function applyStockAdjustments(tx, { mode, entries }) {
  const result = []
  for (const entry of entries) {
    const product = await tx.product.findUnique({
      where: { id: entry.productId },
      select: { id: true, title: true, stock: true }
    })
    if (!product) {
      throw Object.assign(new Error(`Товар #${entry.productId} не найден`), { status: 404 })
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
