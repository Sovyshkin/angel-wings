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
      deliveryPrice: true,
      commission: { select: { id: true, percentage: true } }
    }
  })

  if (!order || !order.partnerId || !order.userId) return null
  if (normalizePaymentStatus(order.paymentStatus) !== PAID_PAYMENT_STATUS) return null

  const partner = await prismaLike.partner.findUnique({
    where: { id: order.partnerId },
    select: { id: true, percentage: true, isActive: true }
  })

  if (!partner?.isActive) return null

  const percentage = Number(partner.percentage) > 0 ? Number(partner.percentage) : 5.0
  const deliveryPart = Math.max(0, Number(order.deliveryPrice || 0))
  const commissionBase = Math.max(0, Number(order.total || 0) - deliveryPart)
  const amount = commissionBase * (percentage / 100)

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
