import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCdekOrderPayload, ensureCdekOrderRegistered } from './cdekOrderRegistration.js'

const uuid = '12345678-1234-1234-1234-123456789abc'
const lockMethods = { $executeRawUnsafe: async () => 0, $executeRaw: async () => 1 }
const order = {
  id: 618,
  origin: 'CHECKOUT',
  status: 'PROCESSING',
  paymentStatus: 'PENDING',
  cdekOrderUuid: null,
  deliveryPickupPoint: 'NRS1',
  deliveryTariffCode: 136,
  deliveryPrice: 250,
  deliveryCity: 'Новосибирск',
  customerName: 'Test Customer',
  customerPhone: '89991234567',
  customerEmail: 'test@example.com',
  total: 900,
  partnerBonusAmount: 0,
  userPointsUsed: 0,
  items: [{ id: 1, productId: 17, dosage: null, quantity: 2, price: 450, product: { title: 'Товар', sku: 'SKU', weight: 20 } }]
}

test('CDEK payload uses stored order and allocates the exact paid goods amount', () => {
  const payload = buildCdekOrderPayload(order, { location: { city_code: 270, city: 'Новосибирск' } })
  assert.equal(payload.number, 'order-618')
  assert.equal(payload.recipient_phone, '+79991234567')
  assert.equal(payload.delivery_point, 'NRS1')
  assert.equal(payload.packages[0].weight, 40)
  assert.equal(payload.packages[0].items.reduce((sum, item) => sum + item.cost, 0), 900)
  assert.equal(payload.delivery_recipient_cost, 250)
})

test('courier registration includes goods prices and charges delivery to recipient', () => {
  const payload = buildCdekOrderPayload({
    ...order,
    deliveryPickupPoint: null,
    shippingAddress: 'Новосибирск, ул. Ленина, 1',
    total: 850,
    partnerBonusAmount: 50
  }, null)
  assert.equal(payload.delivery_point, undefined)
  assert.equal(payload.address, 'Новосибирск, ул. Ленина, 1')
  assert.equal(payload.packages[0].items.reduce((sum, item) => sum + item.cost, 0), 900)
  assert.equal(payload.delivery_recipient_cost, 250)
})

test('registration refuses an unpriced delivery instead of making sender pay', () => {
  assert.throws(() => buildCdekOrderPayload({ ...order, deliveryPrice: 0 }, null), /Стоимость доставки СДЭК не рассчитана/)
})

test('existing CDEK order is linked without another create request', async () => {
  let linkedUuid = null
  let creates = 0
  const prisma = {
    ...lockMethods,
    order: {
      findUnique: async ({ select }) => select ? { cdekOrderUuid: linkedUuid } : { ...order, cdekOrderUuid: linkedUuid },
      updateMany: async ({ data }) => { linkedUuid = data.cdekOrderUuid; return { count: 1 } }
    }
  }
  const client = {
    findOrderByShopNumber: async () => ({ entity: { uuid, number: 'order-618' } }),
    createOrder: async () => { creates++; return { entity: { uuid } } }
  }
  const first = await ensureCdekOrderRegistered(prisma, order.id, { cdekClient: client })
  const second = await ensureCdekOrderRegistered(prisma, order.id, { cdekClient: client })
  assert.equal(first.uuid, uuid)
  assert.equal(first.source, 'cdek')
  assert.equal(second.source, 'database')
  assert.equal(creates, 0)
})

test('concurrent registration of one order sends only one create request', async () => {
  let creates = 0
  let linkedUuid = null
  const prisma = {
    ...lockMethods,
    order: {
      findUnique: async () => ({ ...order, cdekOrderUuid: linkedUuid }),
      updateMany: async ({ data }) => { linkedUuid = data.cdekOrderUuid; return { count: 1 } }
    }
  }
  const client = {
    findOrderByShopNumber: async () => null,
    getPickupPoint: async () => ({ location: { city_code: 270 } }),
    createOrder: async () => { creates++; await new Promise(resolve => setTimeout(resolve, 10)); return { entity: { uuid, number: 'order-618' } } }
  }
  const [first, second] = await Promise.all([
    ensureCdekOrderRegistered(prisma, order.id, { cdekClient: client }),
    ensureCdekOrderRegistered(prisma, order.id, { cdekClient: client })
  ])
  assert.equal(creates, 1)
  assert.equal(first.uuid, second.uuid)
})

test('courier registration uses the same trusted server payload', async () => {
  let submitted = null
  const prisma = {
    ...lockMethods,
    order: {
      findUnique: async ({ select }) => select
        ? { cdekOrderUuid: null }
        : { ...order, deliveryPickupPoint: null, shippingAddress: 'Новосибирск, ул. Ленина, 1' },
      updateMany: async () => ({ count: 1 })
    }
  }
  const client = {
    findOrderByShopNumber: async () => null,
    getPickupPoint: async () => { throw new Error('Pickup lookup must not run for courier orders') },
    createOrder: async payload => {
      submitted = payload
      return { entity: { uuid, number: 'order-618' } }
    }
  }
  await ensureCdekOrderRegistered(prisma, order.id, { cdekClient: client })
  assert.equal(submitted.address, 'Новосибирск, ул. Ленина, 1')
  assert.equal(submitted.packages[0].items[0].cost, 450)
  assert.equal(submitted.delivery_recipient_cost, 250)
})

test('unconfirmed CDEK response never links an order or retries POST automatically', async () => {
  let creates = 0
  let links = 0
  const prisma = {
    ...lockMethods,
    order: {
      findUnique: async () => ({ ...order }),
      updateMany: async () => { links++; return { count: 1 } }
    }
  }
  const client = {
    findOrderByShopNumber: async () => null,
    getPickupPoint: async () => ({ location: { city_code: 270 } }),
    createOrder: async () => { creates++; return { requests: [{ state: 'ACCEPTED' }] } }
  }
  await assert.rejects(ensureCdekOrderRegistered(prisma, order.id, { cdekClient: client }), /не подтвердил UUID/)
  assert.equal(creates, 1)
  assert.equal(links, 0)
})
