import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import cdek from '../src/services/cdek.js'
import { ensureCdekOrderRegistered } from '../src/services/cdekOrderRegistration.js'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const daysArg = args.find(arg => arg.startsWith('--days='))
const idsArg = args.find(arg => arg.startsWith('--ids='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 30
const days = daysArg ? Number(daysArg.split('=')[1]) : 14
const ids = idsArg ? idsArg.slice('--ids='.length).split(',').map(Number) : []
if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(days) || days < 1 || days > 365 || ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
  process.stderr.write('Use --limit=1..100, --days=1..365 and optional --ids=618,619\n')
  process.exit(2)
}

// The CDEK client logs complete request bodies, including customer contacts.
// Keep this operational report limited to IDs, statuses and error codes.
console.log = () => {}
const print = value => process.stdout.write(`${JSON.stringify(value)}\n`)
const prisma = new PrismaClient()
try {
  const orders = await prisma.order.findMany({
    where: {
      origin: 'CHECKOUT',
      paymentStatus: 'PAID',
      cdekOrderUuid: null,
      deliveryPickupPoint: { not: null },
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      ...(ids.length ? { id: { in: ids } } : { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } })
    },
    select: { id: true, createdAt: true, deliveryPickupPoint: true, deliveryTariffCode: true },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
  print({ mode: apply ? 'APPLY' : 'DRY_RUN', count: orders.length, limit, days, ids })
  for (const order of orders) {
    try {
      if (!order.deliveryTariffCode) {
        print({ orderId: order.id, status: 'INVALID_LOCAL_DATA', reason: 'Missing delivery tariff' })
        continue
      }
      if (!apply) {
        const found = await cdek.findOrderByShopNumber(`order-${order.id}`)
        print({ orderId: order.id, createdAt: order.createdAt, status: found ? 'EXISTS_IN_CDEK_NEEDS_LINK' : 'MISSING_IN_CDEK', pickupPoint: order.deliveryPickupPoint })
      } else {
        const result = await ensureCdekOrderRegistered(prisma, order.id)
        print({ orderId: order.id, status: result.created ? 'CREATED_AND_LINKED' : 'LINKED_EXISTING', cdekOrderUuid: result.uuid })
      }
    } catch (error) {
      const errors = (error?.data?.requests || []).flatMap(request => request.errors || [])
      print({ orderId: order.id, status: 'ERROR', httpStatus: error?.status || null, errors: errors.map(item => ({ code: item.code, message: item.message })), message: errors.length ? null : error?.message || 'Unknown error' })
    }
  }
} finally {
  await prisma.$disconnect()
}
