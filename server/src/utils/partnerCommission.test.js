import test from 'node:test'
import assert from 'node:assert/strict'
import { ensurePartnerCommissionForPaidOrder } from './partnerCommission.js'

test('CDEK delivery paid outside site is not deducted from partner commission base', async () => {
  let saved
  const db = {
    order: { findUnique: async () => ({ id: 12, userId: 3, partnerId: 4, paymentStatus: 'PAID', total: 10000, deliveryPrice: 690, deliveryTariffCode: 136, deliveryPickupPoint: null, cdekOrderUuid: null }) },
    partner: { findUnique: async () => ({ id: 4, percentage: 5, isActive: true }) },
    partnerCommission: { upsert: async value => { saved = value; return value } }
  }
  await ensurePartnerCommissionForPaidOrder(db, 12)
  assert.equal(saved.create.amount, 500)
})

test('site-paid delivery is excluded from partner commission base', async () => {
  let saved
  const db = {
    order: { findUnique: async () => ({ id: 12, userId: 3, partnerId: 4, paymentStatus: 'PAID', total: 10690, deliveryPrice: 690, deliveryTariffCode: null, deliveryPickupPoint: null, cdekOrderUuid: null }) },
    partner: { findUnique: async () => ({ id: 4, percentage: 5, isActive: true }) },
    partnerCommission: { upsert: async value => { saved = value; return value } }
  }
  await ensurePartnerCommissionForPaidOrder(db, 12)
  assert.equal(saved.create.amount, 500)
})

test('admin-added products do not increase commission on an already paid order', async () => {
  let saved
  const db = {
    order: { findUnique: async () => ({ id: 12, userId: 3, partnerId: 4, paymentStatus: 'PAID', total: 15000, paymentAmount: 2000, unbilledAdjustment: 5000, deliveryPrice: 0, deliveryTariffCode: null, deliveryPickupPoint: null, cdekOrderUuid: null }) },
    partner: { findUnique: async () => ({ id: 4, percentage: 5, isActive: true }) },
    partnerCommission: { upsert: async value => { saved = value; return value } }
  }
  await ensurePartnerCommissionForPaidOrder(db, 12)
  assert.equal(saved.create.amount, 500)
})
