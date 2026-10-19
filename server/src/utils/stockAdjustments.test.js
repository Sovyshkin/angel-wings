import test from 'node:test'
import assert from 'node:assert/strict'
import { applyStockAdjustments, parseStockAdjustmentRequest } from './stockAdjustments.js'

function fakeTransaction(initial) {
  const products = new Map(initial.map(item => [item.id, { ...item }]))
  return {
    products,
    product: {
      async findUnique({ where }) { return products.get(where.id) || null },
      async updateMany({ where, data }) {
        const product = products.get(where.id)
        if (!product) return { count: 0 }
        if (typeof where.stock === 'number' && product.stock !== where.stock) return { count: 0 }
        if (where.stock?.lte !== undefined && product.stock > where.stock.lte) return { count: 0 }
        product.stock = data.stock?.increment !== undefined ? product.stock + data.stock.increment : data.stock
        return { count: 1 }
      }
    }
  }
}

test('validates an incoming batch for several products', () => {
  assert.deepEqual(parseStockAdjustmentRequest({
    mode: 'increase',
    entries: [{ productId: 4, quantity: 30 }, { productId: 9, quantity: 30 }]
  }), {
    mode: 'increase',
    entries: [{ productId: 4, quantity: 30 }, { productId: 9, quantity: 30 }]
  })
})

test('setting zero stock requires the previously shown stock', () => {
  assert.deepEqual(parseStockAdjustmentRequest({
    mode: 'set', entries: [{ productId: 4, quantity: 0, expectedStock: 12 }]
  }).entries, [{ productId: 4, quantity: 0, expectedStock: 12 }])
  assert.throws(() => parseStockAdjustmentRequest({
    mode: 'set', entries: [{ productId: 4, quantity: 0 }]
  }), /Обновите текущие остатки/)
})

test('rejects duplicate products, fractions, negatives and empty receipts', () => {
  assert.throws(() => parseStockAdjustmentRequest({
    mode: 'increase', entries: [{ productId: 4, quantity: 1 }, { productId: 4, quantity: 2 }]
  }), /повторяющийся ID/)
  for (const quantity of [0, -1, 1.5, '30']) {
    assert.throws(() => parseStockAdjustmentRequest({
      mode: 'increase', entries: [{ productId: 4, quantity }]
    }), /Количество должно/)
  }
})

test('adds the same receipt to several different current stocks', async () => {
  const tx = fakeTransaction([{ id: 4, title: 'Первый', stock: 5 }, { id: 9, title: 'Второй', stock: 12 }])
  const request = parseStockAdjustmentRequest({ mode: 'increase', entries: [{ productId: 4, quantity: 30 }, { productId: 9, quantity: 30 }] })
  const changes = await applyStockAdjustments(tx, request)
  assert.deepEqual(changes.map(({ previousStock, stock }) => [previousStock, stock]), [[5, 35], [12, 42]])
})

test('sets a stock only when the displayed value is still current', async () => {
  const tx = fakeTransaction([{ id: 4, title: 'Первый', stock: 12 }])
  const request = parseStockAdjustmentRequest({ mode: 'set', entries: [{ productId: 4, quantity: 0, expectedStock: 12 }] })
  assert.deepEqual((await applyStockAdjustments(tx, request))[0].stock, 0)
  await assert.rejects(applyStockAdjustments(tx, request), /изменился/)
})

test('rejects a receipt above the database integer limit', async () => {
  const tx = fakeTransaction([{ id: 4, title: 'Первый', stock: 2147483647 }])
  await assert.rejects(applyStockAdjustments(tx, parseStockAdjustmentRequest({
    mode: 'increase', entries: [{ productId: 4, quantity: 1 }]
  })), /превышает допустимый предел/)
})
