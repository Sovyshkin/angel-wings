import assert from 'node:assert/strict'
import test from 'node:test'
import { reconcilePaidCdekOrders } from './cdekRegistrationWorker.js'

test('only recent paid checkout pickup orders are selected for recovery', async () => {
  let where
  const prisma = {
    order: {
      findMany: async query => {
        where = query.where
        return [{ id: 629 }]
      }
    }
  }
  const registered = []
  await reconcilePaidCdekOrders(prisma, {
    registerOrder: async (_prisma, id) => {
      registered.push(id)
      return { created: true }
    },
    now: Date.UTC(2026, 9, 28),
    logger: { info() {}, error() {} }
  })
  assert.equal(where.origin, 'CHECKOUT')
  assert.equal(where.paymentStatus, 'PAID')
  assert.equal(where.cdekOrderUuid, null)
  assert.deepEqual(where.status.in, ['PENDING', 'PROCESSING', 'SHIPPED'])
  assert.deepEqual(registered, [629])
})

test('failed CDEK registration is retried later, not on every poll', async () => {
  const prisma = { order: { findMany: async () => [{ id: 629 }] } }
  const attempts = new Map()
  let calls = 0
  const registerOrder = async () => {
    calls++
    throw new Error('CDEK unavailable')
  }
  const logger = { info() {}, error() {} }
  await reconcilePaidCdekOrders(prisma, { registerOrder, attempts, now: 1_000_000, logger })
  await reconcilePaidCdekOrders(prisma, { registerOrder, attempts, now: 1_120_000, logger })
  assert.equal(calls, 1)
  await reconcilePaidCdekOrders(prisma, { registerOrder, attempts, now: 1_600_000, logger })
  assert.equal(calls, 2)
})
