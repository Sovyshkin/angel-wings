const PAID_PAYMENT_STATUS = 'PAID'

function normalizePaymentStatus(value) {
  return String(value || '').trim().toUpperCase()
}

export async function ensurePartnerCommissionForPaidOrder(prismaLike, orderId) {
  const safeOrderId = Number.parseInt(orderId, 10)
  if (!Number.isFinite(safeOrderId)) return null

  const order = await prismaLike.order.findUnique({
    where: { id: safeOrderId },
    select: {
      id: true,
      userId: true,
      partnerId: true,
      paymentStatus: true,
      total: true,
      unbilledAdjustment: true,
      deliveryPrice: true,
      deliveryTariffCode: true,
      deliveryPickupPoint: true,
      cdekOrderUuid: true,
      commission: { select: { id: true, percentage: true } }
    }
  })

  if (!order || !order.partnerId || !order.userId) return null
  if (normalizePaymentStatus(order.paymentStatus) !== PAID_PAYMENT_STATUS) return null

  const partner = await prismaLike.partner.findUnique({
    where: { id: order.partnerId },
    select: { id: true, percentage: true, isActive: true }
  })

  if (!partner || (!partner.isActive && !order.commission)) return null

  // Keep the rate assigned when this order first earned commission. A later
  // partner-rate change must not retroactively reprice an existing order.
  const percentage = Number(order.commission?.percentage) > 0
    ? Number(order.commission.percentage)
    : (Number(partner.percentage) > 0 ? Number(partner.percentage) : 5.0)
  // CDEK is paid separately and is not included in order.total.
  const isExternalDelivery = Boolean(order.deliveryTariffCode || order.deliveryPickupPoint || order.cdekOrderUuid)
  const deliveryPart = isExternalDelivery ? 0 : Math.max(0, Number(order.deliveryPrice || 0))
  // Admin-added products are part of the order total even when the original
  // bank payment is intentionally left unchanged.
  const commissionBaseCents = Math.max(0, Math.round(Number(order.total || 0) * 100) - Math.round(deliveryPart * 100))
  const amount = Math.round(commissionBaseCents * percentage / 100) / 100

  return prismaLike.partnerCommission.upsert({
    where: { orderId: order.id },
    update: {
      amount,
      percentage
    },
    create: {
      partnerId: partner.id,
      orderId: order.id,
      userId: order.userId,
      amount,
      percentage
    }
  })
}

export async function syncPartnerCommissionForOrder(prismaLike, orderId) {
  const safeOrderId = Number.parseInt(orderId, 10)
  if (!Number.isFinite(safeOrderId)) return null

  const order = await prismaLike.order.findUnique({
    where: { id: safeOrderId },
    select: { id: true, paymentStatus: true }
  })

  if (!order) return null

  if (normalizePaymentStatus(order.paymentStatus) === PAID_PAYMENT_STATUS) {
    return ensurePartnerCommissionForPaidOrder(prismaLike, order.id)
  }

  await prismaLike.partnerCommission.deleteMany({
    where: { orderId: order.id }
  })
  return null
}
