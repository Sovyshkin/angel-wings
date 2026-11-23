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
        order.commission = { id: 7, partnerId: commission.partnerId, percentage: commission.percentage }
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

test('recalculation moves an existing commission to the partner assigned to the order', async () => {
  const order = {
    id: 870, userId: 415, partnerId: 7, status: 'PROCESSING', paymentStatus: 'PAID',
    total: 45240, deliveryPrice: 690, deliveryTariffCode: null,
    deliveryPickupPoint: null, cdekOrderUuid: null,
    commission: { id: 455, partnerId: 3, percentage: 15 }
  }
  let saved = { partnerId: 3, userId: 415, percentage: 15, amount: 6682.5 }
  const db = {
    order: { findUnique: async () => order },
    partner: { findUnique: async () => ({ id: 7, percentage: 11, isActive: true }) },
    partnerCommission: {
      upsert: async ({ update }) => {
        saved = { ...saved, ...update }
        return saved
      }
    }
  }

  await ensurePartnerCommissionForPaidOrder(db, 870)
  assert.equal(saved.partnerId, 7)
  assert.equal(saved.userId, 415)
  assert.equal(saved.percentage, 11)
  assert.equal(saved.amount, 4900.5)
})
