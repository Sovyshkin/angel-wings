import test from 'node:test'
import assert from 'node:assert/strict'
import { grantConsultationRewardsForPaidOrder } from './consultationReward.js'

test('paid manually created order awards eligible consultation points in the same transaction', async () => {
  let balance = 0
  const transactions = []
  const tx = {
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
