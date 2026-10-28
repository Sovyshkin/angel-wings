import { ensureCdekOrderRegistered } from './cdekOrderRegistration.js'

const RECENT_DAYS = 14
const POLL_MS = 120_000
const RETRY_MS = 600_000
const MAX_PER_POLL = 10

export async function reconcilePaidCdekOrders(prisma, {
  registerOrder = ensureCdekOrderRegistered,
  attempts = new Map(),
  now = Date.now(),
  logger = console
} = {}) {
  const orders = await prisma.order.findMany({
    where: {
      origin: 'CHECKOUT',
      paymentStatus: 'PAID',
      cdekOrderUuid: null,
      deliveryPickupPoint: { not: null },
      deliveryTariffCode: { not: null },
      status: { in: ['PENDING', 'PROCESSING'] },
      createdAt: { gte: new Date(now - RECENT_DAYS * 86_400_000) }
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  const pending = orders.filter(order => now - (attempts.get(order.id) || 0) >= RETRY_MS).slice(0, MAX_PER_POLL)
  for (const order of pending) {
    attempts.set(order.id, now)
    try {
      const result = await registerOrder(prisma, order.id)
      attempts.delete(order.id)
      logger.info('[CDEK] Paid order linked', JSON.stringify({ orderId: order.id, created: result.created }))
    } catch (error) {
      const errors = (error?.data?.requests || []).flatMap(request => request.errors || [])
      logger.error('[CDEK] Paid order registration failed', JSON.stringify({
        orderId: order.id,
        httpStatus: error?.status || null,
        codes: errors.map(item => item.code).filter(Boolean)
      }))
    }
  }

  for (const id of attempts.keys()) {
    if (!orders.some(order => order.id === id)) attempts.delete(id)
  }
  return { checked: pending.length, remaining: orders.length }
}

export function startCdekRegistrationWorker(prisma) {
  const attempts = new Map()
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await reconcilePaidCdekOrders(prisma, { attempts })
    } catch (error) {
      console.error('[CDEK] Paid order reconciliation failed', error?.message || 'Unknown error')
    } finally {
      running = false
    }
  }
  setTimeout(run, 15_000).unref()
  setInterval(run, POLL_MS).unref()
}
