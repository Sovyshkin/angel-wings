import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOrderWaybill, createOrderWaybillDocx, createOrderWaybillPdf } from './orderWaybill.js'

const order = {
  id: 543,
  createdAt: new Date('2026-10-02T10:00:00Z'),
  customerName: 'Тестовый покупатель',
  shippingAddress: 'г. Москва',
  customerPhone: '+79999999999',
  paymentStatus: 'PENDING',
  total: 16900,
  discountAmount: 1000,
  deliveryPrice: 900,
  items: [
    { productId: 1, product: { title: 'Эпиталон' }, dosage: '10 мг', quantity: 2, price: 5000 },
    { productId: 2, product: { title: 'Тестовый товар' }, quantity: 1, price: 7000 }
  ]
}

test('waybill totals reconcile with the stored order amount and payment status', () => {
  const data = buildOrderWaybill(order)
  assert.equal(data.goods, 1700000)
  assert.equal(data.delivery, 90000)
  assert.equal(data.discount, 100000)
  assert.equal(data.total, 1690000)
  assert.equal(data.vat, Math.round(1690000 * 5 / 105))
  assert.equal(data.payment, 'Не оплачен')
  assert.match(data.items[0].name, /Эпиталон, 10 мг/)
})

test('PDF and Word waybills are valid documents', async () => {
  const data = buildOrderWaybill(order)
  const [pdf, docx] = await Promise.all([createOrderWaybillPdf(data), createOrderWaybillDocx(data)])
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.equal(docx.subarray(0, 2).toString(), 'PK')
  assert.ok(pdf.length > 5000)
  assert.ok(docx.length > 5000)
})
