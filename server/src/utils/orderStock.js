const MAX_STOCK = 2147483647

function stockError(message, status = 409) {
  return Object.assign(new Error(message), { status })
}

function parseDosages(specs) {
  try {
    const parsed = JSON.parse(specs || '{}')
    return { parsed, dosages: Array.isArray(parsed?.dosages) ? parsed.dosages : [] }
  } catch {
    throw stockError('Не удалось прочитать дозировки товара. Проверьте карточку товара.')
  }
}

export function assertOrderStockAvailable(product, dosage, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw stockError('Некорректное количество товара', 400)
  const { dosages } = parseDosages(product.specs)
  const selected = String(dosage || '').trim()
  if (dosages.length) {
    const matches = dosages.filter(item => String(item?.dosage || '').trim() === selected)
    if (matches.length !== 1) throw stockError(`Выберите существующую дозировку товара «${product.title}»`, 400)
    const available = Number(matches[0].quantity)
    if (!Number.isSafeInteger(available) || available < quantity) {
      throw stockError(`Недостаточно товара «${product.title} · ${selected}» на складе`)
    }
  } else if (selected) {
    throw stockError(`У товара «${product.title}» нет дозировки «${selected}»`, 400)
  }
  if (product.stock < quantity) throw stockError(`Недостаточно товара «${product.title}» на складе`)
}

// Negative quantity reserves stock, positive quantity returns it. Call inside the order transaction.
export async function applyOrderStockChanges(tx, changes) {
  const byProduct = new Map()
  for (const change of changes) {
    const productId = Number(change.productId)
    const quantity = Number(change.quantity)
    const variantQuantity = change.variantQuantity === undefined ? quantity : Number(change.variantQuantity)
    if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isSafeInteger(quantity) || Math.abs(quantity) > MAX_STOCK ||
        !Number.isSafeInteger(variantQuantity) || Math.abs(variantQuantity) > Math.abs(quantity) ||
        (variantQuantity && Math.sign(variantQuantity) !== Math.sign(quantity))) {
      throw stockError('Некорректное изменение остатка товара', 400)
    }
    if (!quantity) continue
    const dosage = String(change.dosage || '').trim()
    const key = dosage
    if (!byProduct.has(productId)) byProduct.set(productId, new Map())
    const variants = byProduct.get(productId)
    const current = variants.get(key) || { quantity: 0, variantQuantity: 0 }
    variants.set(key, { quantity: current.quantity + quantity, variantQuantity: current.variantQuantity + variantQuantity })
  }

  for (const [productId, movements] of byProduct) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, stock: true, specs: true }
    })
    if (!product) throw stockError(`Товар #${productId} не найден`, 404)
    const { parsed, dosages } = parseDosages(product.specs)
    const nextDosages = dosages.map(item => ({ ...item }))
    let totalDelta = 0
    for (const [dosage, movement] of movements) {
      totalDelta += movement.quantity
      const delta = movement.variantQuantity
      if (!delta) continue
      if (dosages.length) {
        const matches = dosages.map((item, index) => ({ item, index }))
          .filter(({ item }) => String(item?.dosage || '').trim() === dosage)
        if (matches.length !== 1) throw stockError(`Выберите существующую дозировку товара «${product.title}»`, 400)
        const { item, index } = matches[0]
        const available = Number(item.quantity)
        if (!Number.isSafeInteger(available) || available < 0 || available > MAX_STOCK) {
          throw stockError(`Некорректный остаток «${product.title} · ${dosage}»`)
        }
        const next = available + delta
        if (next < 0) throw stockError(`Недостаточно товара «${product.title} · ${dosage}» на складе`)
        if (next > MAX_STOCK) throw stockError(`Остаток «${product.title} · ${dosage}» превышает допустимый предел`)
        nextDosages[index].quantity = next
      } else if (dosage) {
        throw stockError(`У товара «${product.title}» нет дозировки «${dosage}»`, 400)
      }
    }
    const nextStock = product.stock + totalDelta
    if (nextStock < 0) throw stockError(`Недостаточно товара «${product.title}» на складе`)
    if (nextStock > MAX_STOCK) throw stockError(`Остаток товара «${product.title}» превышает допустимый предел`)
    const result = await tx.product.updateMany({
      where: { id: productId, stock: product.stock, specs: product.specs },
      data: {
        stock: nextStock,
        ...(dosages.length ? { specs: JSON.stringify({ ...parsed, dosages: nextDosages }) } : {})
      }
    })
    if (!result.count) throw stockError(`Остаток товара «${product.title}» изменился. Повторите действие`)
  }
}
