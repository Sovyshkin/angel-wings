import test from 'node:test'
import assert from 'node:assert/strict'
import { createPartnerOrdersDocx, createPartnerOrdersPdf } from './partnerOrdersDocuments.js'

const report = {
  title: 'Отчёт по заказам партнёра Тест',
  totals: { revenue: 10000, tax: 1141.2, acquiring: 270, paidCount: 1, estimatedCount: 1 },
  orders: [{
    id: 1, partnerName: 'Тест', createdAt: new Date('2026-10-18T12:00:00Z'),
    status: 'В обработке', paymentStatus: 'Оплачен', promoCode: 'ТЕСТ',
    total: 10000, revenue: 10000, tax: 1141.2, acquiring: 270,
    acquiringSource: 'Оценка: 2.7%', balance: 8588.8, commission: 500,
    items: [{ title: 'Эпиталон 10 мг', quantity: 2, price: 5000, gross: 10000, discount: 0, net: 10000 }]
  }]
}

test('PDF and Word exports are valid non-empty documents', async () => {
  const [pdf, docx] = await Promise.all([createPartnerOrdersPdf(report), createPartnerOrdersDocx(report)])
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.equal(docx.subarray(0, 2).toString(), 'PK')
  assert.ok(pdf.length > 10000)
  assert.ok(docx.length > 5000)
})
