import test from 'node:test'
import assert from 'node:assert/strict'
import { publicProductSpecs, stripInternalProductFields } from './publicProduct.js'

test('public product payload excludes base and dosage cost prices', () => {
  const product = { id: 1, title: 'Товар', costPrice: 1500, specs: JSON.stringify({ dosages: [{ dosage: '5 мг', price: 4500, costPrice: 1200 }] }) }
  const publicProduct = { ...stripInternalProductFields(product), specs: publicProductSpecs(product.specs) }
  assert.equal(publicProduct.costPrice, undefined)
  assert.deepEqual(publicProduct.specs.dosages, [{ dosage: '5 мг', price: 4500 }])
})
