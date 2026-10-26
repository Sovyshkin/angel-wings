import test from 'node:test'
import assert from 'node:assert/strict'
import { grantConsultationRewardsForPaidOrder } from './consultationReward.js'

test('paid checkout order awards eligible consultation points in the same transaction', async () => {
  let balance = 0
  const transactions = []
  const tx = {
    order: { findUnique: async () => ({ origin: 'CHECKOUT' }) },
    consultationRequest: {
      findMany: async () => [{ id: 17 }],
      updateMany: async () => ({ count: 1 })
    },
    user: { update: async ({ data }) => {
      balance += data.pointsBalance.increment
      return { id: 5, pointsBalance: balance }
    } },
    userPointTransaction: { create: async ({ data }) => { transactions.push(data) } }
  }
  const result = await grantConsultationRewardsForPaidOrder(tx, { id: 12, userId: 5, paymentStatus: 'PAID' }, { transaction: true })
  assert.deepEqual(result, { granted: 1, points: 4000 })
  assert.equal(balance, 4000)
  assert.equal(transactions[0].orderId, 12)
  assert.equal(transactions[0].type, 'CONSULTATION_REWARD')
})

test('manual order never grants consultation points, even when marked paid', async () => {
  const tx = {
    order: { findUnique: async () => ({ origin: 'ADMIN_MANUAL' }) },
    consultationRequest: { findMany: async () => { throw new Error('Manual order must not look up rewards') } }
  }
  const result = await grantConsultationRewardsForPaidOrder(tx, { id: 13, userId: 5, paymentStatus: 'PAID' }, { transaction: true })
  assert.deepEqual(result, { granted: 0, points: 0 })
})
