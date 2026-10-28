import { randomUUID } from 'node:crypto'
import cdek from './cdek.js'
import { queueCdekWaybillAfterPayment } from './cdekWaybill.js'

const inFlight = new Map()

const money = value => Math.round((Number(value) || 0) * 100) / 100

async function acquireRegistrationLock(prisma, orderId) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "cdek_registration_locks" (
      "orderId" INTEGER NOT NULL PRIMARY KEY,
      "token" TEXT NOT NULL,
      "expiresAtMs" INTEGER NOT NULL
    )
  `)
  const token = randomUUID()
  const now = Date.now()
  const acquired = await prisma.$executeRaw`
    INSERT INTO "cdek_registration_locks" ("orderId", "token", "expiresAtMs")
    VALUES (${orderId}, ${token}, ${now + 120_000})
    ON CONFLICT("orderId") DO UPDATE SET
      "token" = excluded."token",
      "expiresAtMs" = excluded."expiresAtMs"
    WHERE "cdek_registration_locks"."expiresAtMs" < ${now}
  `
  if (!acquired) throw Object.assign(new Error('Регистрация заказа в СДЭК уже выполняется. Повторите попытку позже.'), { status: 409 })
  return async () => {
    try {
      await prisma.$executeRaw`DELETE FROM "cdek_registration_locks" WHERE "orderId" = ${orderId} AND "token" = ${token}`
    } catch (error) {
      console.error('[CDEK] Could not release registration lock', JSON.stringify({ orderId, message: error?.message }))
    }
  }
}

export function buildCdekOrderPayload(order, pickupPoint) {
  if (!order?.deliveryTariffCode || (!order.deliveryPickupPoint && !order.shippingAddress)) {
    throw new Error('Для заказа не выбраны адрес доставки и тариф СДЭК')
  }
  if (!Number.isFinite(Number(order.deliveryPrice)) || Number(order.deliveryPrice) <= 0) {
    throw Object.assign(new Error('Стоимость доставки СДЭК не рассчитана. Укажите её в заказе до создания накладной, чтобы доставка не была оформлена за счёт отправителя.'), { status: 400 })
  }
  const phoneDigits = String(order.customerPhone || '').replace(/\D/g, '')
  const phone = phoneDigits.length === 11 && phoneDigits.startsWith('8')
    ? `+7${phoneDigits.slice(1)}`
    : phoneDigits.length === 11 && phoneDigits.startsWith('7')
      ? `+${phoneDigits}`
      : phoneDigits.length === 10 && phoneDigits.startsWith('9')
        ? `+7${phoneDigits}`
        : null
  if (!phone || !order.customerName || !order.customerEmail || !order.items?.length) {
    throw new Error('Для регистрации СДЭК не хватает данных получателя или товаров')
  }

  const units = order.items.flatMap(item => Array.from(
    { length: Math.max(0, Number(item.quantity) || 0) },
    (_, index) => ({
      name: `${item.product?.title || 'Товар'}${item.dosage ? ` (${item.dosage})` : ''}`,
      ware_key: `${item.product?.sku || item.productId}-${item.dosage || 'base'}-${item.id}-${index + 1}`,
      basePrice: Math.max(0, Number(item.price) || 0),
      weight: Math.max(1, Number(item.product?.weight) || 1)
    })
  ))
  if (!units.length) throw new Error('В заказе нет товаров для отправки')

  const goodsCents = Math.max(0, Math.round((
    Number(order.total || 0) + Number(order.partnerBonusAmount || 0) + Number(order.userPointsUsed || 0)
  ) * 100))
  const baseTotal = units.reduce((sum, unit) => sum + unit.basePrice, 0)
  let allocated = 0
  const items = units.map((unit, index) => {
    const cents = index === units.length - 1
      ? goodsCents - allocated
      : Math.floor(goodsCents * (baseTotal > 0 ? unit.basePrice / baseTotal : 0))
    allocated += cents
    return {
      name: unit.name,
      ware_key: unit.ware_key,
      cost: cents / 100,
      amount: 1,
      weight: unit.weight
    }
  })
  const location = pickupPoint?.location || {}
  return {
    number: `order-${order.id}`,
    tariff_code: order.deliveryTariffCode,
    recipient_name: order.customerName,
    recipient_phone: phone,
    recipient_email: order.customerEmail,
    ...(order.deliveryPickupPoint
      ? { delivery_point: order.deliveryPickupPoint }
      : { address: order.shippingAddress }),
    to_location: {
      code: location.city_code || location.cityCode || null,
      city: location.city || order.deliveryCity || null,
      country: location.country || null,
      country_code: location.country_code || null
    },
    packages: [{ weight: units.reduce((sum, unit) => sum + unit.weight, 0), items }],
    delivery_recipient_cost: money(order.deliveryPrice)
  }
}

export async function ensureCdekOrderRegistered(prisma, orderId, { cdekClient = cdek } = {}) {
  if (inFlight.has(orderId)) return inFlight.get(orderId)
  const operation = (async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    })
    if (!order) throw Object.assign(new Error('Заказ не найден'), { status: 404 })
    if (order.cdekOrderUuid) return { uuid: order.cdekOrderUuid, created: false, source: 'database' }
    if ((!order.deliveryPickupPoint && !order.shippingAddress) || !order.deliveryTariffCode) {
      throw Object.assign(new Error('Для заказа не выбраны адрес доставки и тариф СДЭК'), { status: 400 })
    }
    if (['CANCELLED', 'RETURNED'].includes(order.status)) {
      throw Object.assign(new Error('Отменённый заказ нельзя зарегистрировать в СДЭК'), { status: 409 })
    }

    const releaseLock = await acquireRegistrationLock(prisma, orderId)
    try {
    // Another process may have linked the order before the lock was acquired.
    const current = await prisma.order.findUnique({ where: { id: orderId }, select: { cdekOrderUuid: true } })
    if (current?.cdekOrderUuid) return { uuid: current.cdekOrderUuid, created: false, source: 'database' }
    const number = `order-${order.id}`
    let result = await cdekClient.findOrderByShopNumber(number)
    let source = 'cdek'
    if (!result) {
      const pickupPoint = order.deliveryPickupPoint
        ? await cdekClient.getPickupPoint(order.deliveryPickupPoint)
        : null
      const payload = buildCdekOrderPayload(order, pickupPoint)
      result = await cdekClient.createOrder(payload)
      source = 'created'
    }

    const errors = (result?.requests || []).flatMap(request => request.errors || [])
    if (errors.length) {
      throw Object.assign(new Error(errors.map(error => error.message || error.code).join('; ')), { status: 502 })
    }
    let uuid = result?.entity?.uuid || result?.uuid
    if (!uuid) {
      const found = await cdekClient.findOrderByShopNumber(number)
      uuid = found?.entity?.uuid || found?.uuid
    }
    if (!uuid || !/^[0-9a-f-]{36}$/i.test(String(uuid))) {
      throw Object.assign(new Error('СДЭК не подтвердил UUID заказа; повторите проверку позже'), { status: 502 })
    }
    if (result?.entity?.number && result.entity.number !== number) {
      throw Object.assign(new Error('Номер заказа СДЭК не совпадает с номером на сайте'), { status: 409 })
    }

    const linked = await prisma.order.updateMany({
      where: { id: orderId, cdekOrderUuid: null },
      data: { cdekOrderUuid: uuid }
    })
    if (!linked.count) {
      const current = await prisma.order.findUnique({ where: { id: orderId }, select: { cdekOrderUuid: true } })
      if (current?.cdekOrderUuid !== uuid) {
        throw Object.assign(new Error('Заказ уже привязан к другому UUID СДЭК'), { status: 409 })
      }
      return { uuid, created: false, source: 'database' }
    }
    if (String(order.paymentStatus).toUpperCase() === 'PAID') {
      queueCdekWaybillAfterPayment({ id: orderId, cdekOrderUuid: uuid, paymentStatus: 'PAID' }, 'PENDING')
    }
    return { uuid, created: source === 'created', source }
    } finally {
      await releaseLock()
    }
  })()
  inFlight.set(orderId, operation)
  try { return await operation } finally { inFlight.delete(orderId) }
}
