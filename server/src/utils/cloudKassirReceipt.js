import cloudKassirService from '../services/cloudKassir.js'

export const CLOUD_KASSIR_ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          title: true
        }
      }
    }
  }
}

export function normalizePaidStatus(status) {
  return String(status || '').trim().toUpperCase()
}

export function shouldSendIncomeReceipt(previousStatus, nextStatus) {
  return normalizePaidStatus(previousStatus) !== 'PAID' && normalizePaidStatus(nextStatus) === 'PAID'
}

export async function sendCloudKassirIncomeReceiptForOrder(prisma, orderId, source = 'payment') {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: CLOUD_KASSIR_ORDER_INCLUDE
  })

  if (!order) {
    console.warn('[CLOUDKASSIR] receipt skipped: order not found', JSON.stringify({ orderId, source }))
    return null
  }

  return cloudKassirService.sendIncomeReceipt(order, { source })
}

export async function sendCloudKassirIncomeReceiptOnPaidTransition(
  prisma,
  orderId,
  previousStatus,
  nextStatus,
  source = 'payment'
) {
  if (!shouldSendIncomeReceipt(previousStatus, nextStatus)) return null
  return sendCloudKassirIncomeReceiptForOrder(prisma, orderId, source)
}
