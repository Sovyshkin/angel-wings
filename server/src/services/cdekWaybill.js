import cdek from './cdek.js'

const ORDER_READY_DELAYS_MS = [0, 2_000, 4_000, 8_000, 10_000]
const PRINT_READY_DELAYS_MS = [0, 1_000, 2_000, 4_000, 8_000]
const wait = duration => new Promise(resolve => setTimeout(resolve, duration))
const inFlight = new Map()
const printJobs = new Map()

function isPaidPaymentStatus(status) {
  return String(status || '').trim().toUpperCase() === 'PAID'
}

function cdekErrors(result) {
  return (result?.requests || []).flatMap(request => request.errors || [])
}

function cdekError(message, result, status = 502) {
  const details = cdekErrors(result).map(error => error.message || error.code).filter(Boolean)
  return Object.assign(new Error(details.join('; ') || message), { status })
}

// A successful POST only queues a print job. Wait for both the registered order
// and the print job to reach their final state before reporting success.
export async function createReadyCdekWaybill(orderUuid, {
  cdekClient = cdek,
  waitFor = wait,
  orderDelays = ORDER_READY_DELAYS_MS,
  printDelays = PRINT_READY_DELAYS_MS
} = {}) {
  if (!orderUuid) throw Object.assign(new Error('Заказ СДЭК не зарегистрирован'), { status: 409 })
  if (printJobs.has(orderUuid)) return printJobs.get(orderUuid)

  const operation = generateReadyCdekWaybill(orderUuid, { cdekClient, waitFor, orderDelays, printDelays })
  printJobs.set(orderUuid, operation)
  try { return await operation } finally { printJobs.delete(orderUuid) }
}

async function generateReadyCdekWaybill(orderUuid, { cdekClient, waitFor, orderDelays, printDelays }) {
  let readyOrder = false
  for (const delay of orderDelays) {
    if (delay) await waitFor(delay)
    let result
    try {
      result = await cdekClient.getOrder(orderUuid)
    } catch (error) {
      if (error?.status === 404) continue
      throw error
    }
    if (cdekErrors(result).length) throw cdekError('СДЭК отклонил заказ', result)
    if (result?.entity?.cdek_number) {
      readyOrder = true
      break
    }
  }
  if (!readyOrder) throw Object.assign(new Error('СДЭК ещё обрабатывает заказ. Повторите запрос накладной позже.'), { status: 503 })

  const created = await cdekClient.getPrintForm(orderUuid)
  if (cdekErrors(created).length) throw cdekError('СДЭК отклонил запрос на накладную', created)
  const printUuid = created?.entity?.uuid
  if (!printUuid) throw Object.assign(new Error('СДЭК не вернул UUID печатной формы'), { status: 502 })

  for (const delay of printDelays) {
    if (delay) await waitFor(delay)
    let result
    try {
      result = await cdekClient.getPrintFormStatus(printUuid)
    } catch (error) {
      if (error?.status === 404) continue
      throw error
    }
    const states = (result?.entity?.statuses || []).map(status => status.code)
    if (states.includes('INVALID') || (result?.requests || []).some(request => request.state === 'INVALID')) {
      throw cdekError('СДЭК отклонил печатную форму', result)
    }
    if (states.includes('REMOVED')) {
      throw Object.assign(new Error('Срок действия печатной формы истёк. Запросите её снова.'), { status: 409 })
    }
    if (states.includes('READY') && result?.entity?.url) return { printUuid }
  }
  throw Object.assign(new Error('СДЭК ещё формирует накладную. Повторите попытку позже.'), { status: 503, printUuid })
}

async function requestCdekWaybill(order) {
  try {
    const { printUuid } = await createReadyCdekWaybill(order.cdekOrderUuid)
    console.log('[CDEK] Waybill ready after payment', JSON.stringify({
      orderId: order.id,
      cdekOrderUuid: order.cdekOrderUuid,
      printUuid
    }))
  } catch (error) {
    console.error('[CDEK] Waybill generation failed', JSON.stringify({
      orderId: order.id,
      cdekOrderUuid: order.cdekOrderUuid,
      printUuid: error?.printUuid || null,
      message: error?.message || String(error)
    }))
  }
}

export function queueCdekWaybillAfterPayment(order, previousStatus) {
  if (!order?.cdekOrderUuid || !isPaidPaymentStatus(order.paymentStatus)) return
  if (isPaidPaymentStatus(previousStatus) || inFlight.has(order.cdekOrderUuid)) return

  const operation = requestCdekWaybill(order)
  inFlight.set(order.cdekOrderUuid, operation)
  void operation.finally(() => inFlight.delete(order.cdekOrderUuid))
}
