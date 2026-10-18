import test from 'node:test'
import assert from 'node:assert/strict'
import { getOrderItemUnitCost } from './productCost.js'

const product = {
  costPrice: 1800,
  specs: JSON.stringify({ dosages: [
    { dosage: '5 мг', price: 4500, costPrice: 1200 },
    { dosage: '10 мг', price: 7000, costPrice: 2500 },
    { dosage: '15 мг', price: 9000 }
  ] })
}

test('uses different unit costs for each dosage', () => {
  assert.equal(getOrderItemUnitCost({ product, dosage: '5 мг' }), 1200)
  assert.equal(getOrderItemUnitCost({ product, dosage: '10 мг' }), 2500)
})

test('falls back to base cost when dosage has no cost or does not exist', () => {
  assert.equal(getOrderItemUnitCost({ product, dosage: '15 мг' }), 1800)
  assert.equal(getOrderItemUnitCost({ product, dosage: '20 мг' }), 1800)
  assert.equal(getOrderItemUnitCost({ product, dosage: null }), 1800)
})

test('zero dosage cost is intentional, not replaced with base cost', () => {
  assert.equal(getOrderItemUnitCost({ product: { ...product, specs: { dosages: [{ dosage: 'Пробник', costPrice: 0 }] } }, dosage: 'Пробник' }), 0)
})
