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

test('admin-added products increase commission without changing the bank payment', async () => {
  let saved
  const db = {
    order: { findUnique: async () => ({ id: 12, userId: 3, partnerId: 4, paymentStatus: 'PAID', total: 15000, paymentAmount: 2000, unbilledAdjustment: 5000, deliveryPrice: 0, deliveryTariffCode: null, deliveryPickupPoint: null, cdekOrderUuid: null }) },
    partner: { findUnique: async () => ({ id: 4, percentage: 5, isActive: true }) },
    partnerCommission: { upsert: async value => { saved = value; return value } }
  }
  await ensurePartnerCommissionForPaidOrder(db, 12)
  assert.equal(saved.create.amount, 750)
  assert.equal(saved.update.amount, 750)
})

test('repeated recalculation updates one order commission, preserving its original rate', async () => {
  const order = { id: 12, userId: 3, partnerId: 4, paymentStatus: 'PAID', total: 1000, deliveryPrice: 0, deliveryTariffCode: null, deliveryPickupPoint: null, cdekOrderUuid: null, commission: null }
  let commission = null
  let creations = 0
  let partnerPercentage = 12
  const db = {
    order: { findUnique: async () => order },
    partner: { findUnique: async () => ({ id: 4, percentage: partnerPercentage, isActive: true }) },
    partnerCommission: {
      upsert: async ({ create, update }) => {
        if (commission) commission = { ...commission, ...update }
        else {
          creations++
          commission = { ...create }
        }
        order.commission = { id: 7, percentage: commission.percentage }
        return commission
      }
    }
  }

  await ensurePartnerCommissionForPaidOrder(db, 12)
  assert.equal(commission.amount, 120)
  partnerPercentage = 20
  order.total = 1500
  await ensurePartnerCommissionForPaidOrder(db, 12)
  await ensurePartnerCommissionForPaidOrder(db, 12)
  assert.equal(creations, 1)
  assert.equal(commission.amount, 180)
  assert.equal(commission.percentage, 12)
})
