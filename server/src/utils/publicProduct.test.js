import test from 'node:test'
import assert from 'node:assert/strict'
import { getEffectiveDosagePrice, publicProductSpecs, stripInternalProductFields } from './publicProduct.js'

test('public product payload excludes base and dosage cost prices', () => {
  const product = { id: 1, title: 'Товар', costPrice: 1500, specs: JSON.stringify({ dosages: [{ dosage: '5 мг', price: 4500, costPrice: 1200 }] }) }
  const publicProduct = { ...stripInternalProductFields(product), specs: publicProductSpecs(product.specs) }
  assert.equal(publicProduct.costPrice, undefined)
  assert.deepEqual(publicProduct.specs.dosages, [{ dosage: '5 мг', price: 4500 }])
})

test('product sale applies to each dosage without changing stored prices or stacking own sale', () => {
  const product = { price: 9000, comparePrice: 10000, specs: JSON.stringify({ dosages: [
    { dosage: '10 мг', price: 16000, costPrice: 4000 },
    { dosage: '20 мг', price: 13000, comparePrice: 15000 },
    { dosage: '30 мг', price: null }
  ] }) }
  assert.deepEqual(publicProductSpecs(product.specs, product).dosages.map(item => [item.price, item.comparePrice ?? null]), [
    [14400, 16000], [13000, 15000], [null, 10000]
  ])
  assert.equal(getEffectiveDosagePrice(product, '10 мг'), 14400)
  assert.equal(getEffectiveDosagePrice(product, '30 мг'), null)
  assert.equal(JSON.parse(product.specs).dosages[0].price, 16000)
  assert.equal(publicProductSpecs(product.specs, { ...product, comparePrice: null }).dosages[0].price, 16000)
})
