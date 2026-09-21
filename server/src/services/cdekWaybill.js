import cdek from './cdek.js'

const CDEK_PRINT_RETRY_DELAYS_MS = [0, 4_000, 12_000, 28_000]

const wait = (duration) => new Promise(resolve => setTimeout(resolve, duration))

function isPaidPaymentStatus(status) {
  return String(status || '').trim().toUpperCase() === 'PAID'
}

async function requestCdekWaybill(order) {
  for (const [attempt, delay] of CDEK_PRINT_RETRY_DELAYS_MS.entries()) {
    if (delay) await wait(delay)

    try {
      const printForm = await cdek.getPrintForm(order.cdekOrderUuid)
      console.log('[CDEK] Waybill print requested after payment', JSON.stringify({
        orderId: order.id,
        cdekOrderUuid: order.cdekOrderUuid,
        printUuid: printForm?.entity?.uuid || null,
        attempt: attempt + 1
      }))
      return
    } catch (error) {
      console.warn('[CDEK] Waybill print request failed', JSON.stringify({
        orderId: order.id,
        cdekOrderUuid: order.cdekOrderUuid,
        attempt: attempt + 1,
        message: error?.data?.message || error?.message || String(error)
      }))
    }
  }

  console.error('[CDEK] Waybill was not queued after all retries', JSON.stringify({
    orderId: order.id,
    cdekOrderUuid: order.cdekOrderUuid
  }))
}

// The bank can deliver duplicate webhook events. Generate the document only
// on a transition into PAID; retries only cover CDEK's asynchronous order
// registration, not duplicate print requests.
export function queueCdekWaybillAfterPayment(order, previousStatus) {
  if (!order?.cdekOrderUuid || !isPaidPaymentStatus(order.paymentStatus)) return
  if (isPaidPaymentStatus(previousStatus)) return

  void requestCdekWaybill(order)
}
