import assert from 'node:assert/strict'
import test from 'node:test'
import { applyOrderStockChanges, assertOrderStockAvailable } from './orderStock.js'

function fakeTransaction(initial) {
  const products = new Map(initial.map(product => [product.id, { ...product }]))
  return {
    products,
    product: {
      async findUnique({ where }) { return products.get(where.id) ? { ...products.get(where.id) } : null },
      async updateMany({ where, data }) {
        const product = products.get(where.id)
        if (!product || product.stock !== where.stock || product.specs !== where.specs) return { count: 0 }
        Object.assign(product, data)
        return { count: 1 }
      }
    }
  }
}

function product() {
  return {
    id: 1, title: 'Пептид', stock: 7,
    specs: JSON.stringify({ purity: '99%', dosages: [
      { dosage: '20 мг', quantity: 2, price: 100 },
      { dosage: '40 мг', quantity: 5, price: 200 }
    ] })
  }
}

test('reserves the selected dosage and total, leaving the other dosage unchanged', async () => {
  const tx = fakeTransaction([product()])
  await applyOrderStockChanges(tx, [{ productId: 1, dosage: '20 мг', quantity: -1 }])
  const updated = tx.products.get(1)
  assert.equal(updated.stock, 6)
  assert.deepEqual(JSON.parse(updated.specs).dosages.map(item => item.quantity), [1, 5])
  assert.equal(JSON.parse(updated.specs).purity, '99%')
})

test('groups duplicate cart lines before checking availability', async () => {
  const tx = fakeTransaction([product()])
  await assert.rejects(applyOrderStockChanges(tx, [
    { productId: 1, dosage: '20 мг', quantity: -2 },
    { productId: 1, dosage: '20 мг', quantity: -1 }
  ]), /20 мг.*на складе/)
  assert.equal(tx.products.get(1).stock, 7)
})

test('returns stock to the original dosage and handles changing a line dosage', async () => {
  const tx = fakeTransaction([product()])
  await applyOrderStockChanges(tx, [
    { productId: 1, dosage: '20 мг', quantity: 1 },
    { productId: 1, dosage: '40 мг', quantity: -1 }
  ])
  assert.equal(tx.products.get(1).stock, 7)
  assert.deepEqual(JSON.parse(tx.products.get(1).specs).dosages.map(item => item.quantity), [3, 4])
})

test('rejects an unknown or missing dosage rather than consuming the total only', async () => {
  const tx = fakeTransaction([product()])
  await assert.rejects(applyOrderStockChanges(tx, [{ productId: 1, quantity: -1 }]), /Выберите существующую дозировку/)
  await assert.rejects(applyOrderStockChanges(tx, [{ productId: 1, dosage: '60 мг', quantity: -1 }]), /Выберите существующую дозировку/)
  assert.throws(() => assertOrderStockAvailable(product(), '20 мг', 3), /20 мг.*на складе/)
})

test('a second reservation cannot consume the same final unit', async () => {
  const tx = fakeTransaction([{ id: 1, title: 'Товар', stock: 1, specs: JSON.stringify({ dosages: [{ dosage: '20 мг', quantity: 1 }] }) }])
  await applyOrderStockChanges(tx, [{ productId: 1, dosage: '20 мг', quantity: -1 }])
  await assert.rejects(applyOrderStockChanges(tx, [{ productId: 1, dosage: '20 мг', quantity: -1 }]), /на складе/)
  assert.equal(tx.products.get(1).stock, 0)
})

test('non-variant products continue using their total stock', async () => {
  const tx = fakeTransaction([{ id: 2, title: 'Товар', stock: 3, specs: '{}' }])
  await applyOrderStockChanges(tx, [{ productId: 2, quantity: -2 }])
  assert.equal(tx.products.get(2).stock, 1)
})
