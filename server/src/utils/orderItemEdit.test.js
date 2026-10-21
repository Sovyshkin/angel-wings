import test from 'node:test'
import assert from 'node:assert/strict'
import { chargedOrderItemsUnchanged } from './orderItemEdit.js'

const charged = { productId: 1, dosage: '10 мг', quantity: 2, price: 1500 }
const gift = { productId: 2, dosage: null, quantity: 1, price: 0 }

test('allows adding and removing free items without changing charged lines', () => {
  assert.equal(chargedOrderItemsUnchanged([charged], [charged, gift]), true)
  assert.equal(chargedOrderItemsUnchanged([charged, gift], [charged]), true)
  assert.equal(chargedOrderItemsUnchanged([charged, gift], [gift, charged]), true)
})

test('rejects changes to a charged line after invoicing', () => {
  assert.equal(chargedOrderItemsUnchanged([charged], [{ ...charged, quantity: 3 }]), false)
  assert.equal(chargedOrderItemsUnchanged([charged], [{ ...charged, price: 0 }]), false)
  assert.equal(chargedOrderItemsUnchanged([charged], [{ ...charged, productId: 3 }]), false)
  assert.equal(chargedOrderItemsUnchanged([charged], [{ ...charged, dosage: '20 мг' }]), false)
  assert.equal(chargedOrderItemsUnchanged([charged], []), false)
})
