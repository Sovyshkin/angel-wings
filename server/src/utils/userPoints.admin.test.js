import test from 'node:test'
import assert from 'node:assert/strict'
import { debitUserPointsByAdmin, USER_POINT_TYPES } from './userPoints.js'

function createTx({ balance = 1000, offers = [] } = {}) {
  const state = { balance, offers: offers.map(offer => ({ ...offer })), transaction: null }
  const tx = {
    user: {
      findUnique: async () => ({ pointsBalance: state.balance }),
      updateMany: async ({ where, data }) => {
        if (typeof where.pointsBalance === 'number' && state.balance !== where.pointsBalance) return { count: 0 }
        if (typeof where.pointsBalance === 'object' && state.balance < where.pointsBalance.gte) return { count: 0 }
        state.balance -= data.pointsBalance.decrement
        return { count: 1 }
      }
    },
    pointCampaignOffer: {
      findMany: async () => state.offers,
      updateMany: async ({ where, data }) => {
        const offer = state.offers.find(item => item.id === where.id)
        if (!offer || offer.remainingPoints < where.remainingPoints.gte) return { count: 0 }
        offer.remainingPoints -= data.remainingPoints.decrement
        return { count: 1 }
      }
    },
    userPointTransaction: {
      create: async ({ data }) => { state.transaction = data }
    }
  }
  return { tx, state }
}

test('manual debit consumes expiring campaign points first and records the administrator', async () => {
  const { tx, state } = createTx({
    offers: [{ id: 7, expiresAt: new Date(Date.now() + 86400000), remainingPoints: 400 }]
  })
  const result = await debitUserPointsByAdmin(tx, { userId: 12, amount: 500, message: 'Корректировка', createdById: 3 })
  assert.equal(result.balance, 500)
  assert.equal(state.offers[0].remainingPoints, 0)
  assert.deepEqual(state.transaction, {
    userId: 12,
    amount: -500,
    balanceAfter: 500,
    type: USER_POINT_TYPES.ADMIN_DEBIT,
    message: 'Корректировка',
    createdById: 3
  })
})

test('manual debit rejects expired campaign points', async () => {
  const { tx, state } = createTx({
    balance: 400,
    offers: [{ id: 8, expiresAt: new Date(Date.now() - 86400000), remainingPoints: 400 }]
  })
  await assert.rejects(
    debitUserPointsByAdmin(tx, { userId: 12, amount: 1 }),
    { message: 'Недостаточно действующих баллов для списания' }
  )
  assert.equal(state.balance, 400)
  assert.equal(state.transaction, null)
})

test('reset clears the full balance and prevents later campaign expiry from debiting again', async () => {
  const { tx, state } = createTx({
    balance: 900,
    offers: [
      { id: 9, expiresAt: new Date(Date.now() - 86400000), remainingPoints: 200 },
      { id: 10, expiresAt: new Date(Date.now() + 86400000), remainingPoints: 300 }
    ]
  })
  const result = await debitUserPointsByAdmin(tx, { userId: 12, reset: true, message: 'Обнуление', createdById: 3 })
  assert.deepEqual(result, { amount: 900, balance: 0 })
  assert.deepEqual(state.offers.map(offer => offer.remainingPoints), [0, 0])
  assert.equal(state.transaction.amount, -900)
})
