import axios from 'axios'

const CLOUDKASSIR_API_URL = process.env.CLOUDKASSIR_API_URL || 'https://api.cloudpayments.ru'
const DEFAULT_CALCULATION_PLACE = 'https://www.angel-wings.ru/'
const DEFAULT_INN = '773323389224'

function toCents(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

function fromCents(value) {
  return Number((Math.max(0, Number(value) || 0) / 100).toFixed(2))
}

function sanitizeLabel(value) {
  const label = String(value || 'Товар').replace(/\s+/g, ' ').trim()
  return (label || 'Товар').slice(0, 128)
}

function sanitizePhone(value) {
  const raw = String(value || '').trim()
  if (!raw) return undefined

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`
  if (raw.startsWith('+')) return raw.replace(/[^\d+]/g, '')
  return raw.replace(/[^\d+]/g, '')
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function isRecipientPaidCdekDelivery(order) {
  const tariffName = String(order?.deliveryTariffName || '').toLowerCase()
  return Boolean(
    order?.deliveryPickupPoint ||
    order?.cdekOrderUuid ||
    tariffName.includes('сдэк') ||
    tariffName.includes('склад-склад')
  )
}

function resolveVat() {
  const raw = String(process.env.CLOUDKASSIR_VAT ?? 'none').trim().toLowerCase()
  if (!raw || ['none', 'null', 'no_vat', 'без ндс', 'безндс'].includes(raw)) return null

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function allocateDiscount(lines, totalCents) {
  const grossCents = lines.reduce((sum, line) => sum + line.grossCents, 0)
  const targetTotalCents = Math.max(0, Math.min(grossCents, totalCents))
  const discountCents = Math.max(0, grossCents - targetTotalCents)

  if (discountCents <= 0) {
    return lines.map(line => ({ ...line, netCents: line.grossCents }))
  }

  const goodsGrossCents = lines
    .filter(line => line.object === 1)
    .reduce((sum, line) => sum + line.grossCents, 0)
  const goodsDiscountCents = Math.min(discountCents, goodsGrossCents)
  const otherDiscountCents = discountCents - goodsDiscountCents

  const distributeDiscount = (line, index, groupLines, groupDiscountCents, groupGrossCents) => {
    if (groupDiscountCents <= 0 || groupGrossCents <= 0) return 0
    const alreadyAllocated = groupLines
      .slice(0, index)
      .reduce((sum, currentLine) => sum + (currentLine.allocatedDiscountCents || 0), 0)

    return index === groupLines.length - 1
      ? groupDiscountCents - alreadyAllocated
      : Math.floor((line.grossCents / groupGrossCents) * groupDiscountCents)
  }

  const goodsLines = lines.filter(line => line.object === 1).map(line => ({ ...line }))
  const otherLines = lines.filter(line => line.object !== 1).map(line => ({ ...line }))
  const otherGrossCents = otherLines.reduce((sum, line) => sum + line.grossCents, 0)

  goodsLines.forEach((line, index) => {
    line.allocatedDiscountCents = distributeDiscount(line, index, goodsLines, goodsDiscountCents, goodsGrossCents)
  })
  otherLines.forEach((line, index) => {
    line.allocatedDiscountCents = distributeDiscount(line, index, otherLines, otherDiscountCents, otherGrossCents)
  })

  const discountByKey = new Map([...goodsLines, ...otherLines].map((line, index) => [line.key || index, line.allocatedDiscountCents || 0]))

  const discounted = lines.map((line, index) => {
    return {
      ...line,
      netCents: Math.max(0, line.grossCents - (discountByKey.get(line.key || index) || 0))
    }
  })

  const currentTotal = discounted.reduce((sum, line) => sum + line.netCents, 0)
  const diff = targetTotalCents - currentTotal
  if (diff !== 0) {
    const lineForAdjustment = discounted.find(line => line.netCents + diff >= 0) || discounted[discounted.length - 1]
    lineForAdjustment.netCents += diff
  }

  return discounted
}

function splitLineByQuantity(line) {
  const quantity = Math.max(1, Number(line.quantity) || 1)
  const netCents = Math.max(0, Number(line.netCents) || 0)
  if (netCents <= 0) return []

  const baseUnitCents = Math.floor(netCents / quantity)
  const remainder = netCents - baseUnitCents * quantity

  if (remainder === 0) {
    return [{
      ...line,
      quantity,
      priceCents: baseUnitCents,
      amountCents: netCents
    }]
  }

  const parts = []
  const baseQuantity = quantity - remainder
  if (baseQuantity > 0 && baseUnitCents > 0) {
    parts.push({
      ...line,
      quantity: baseQuantity,
      priceCents: baseUnitCents,
      amountCents: baseUnitCents * baseQuantity
    })
  }

  parts.push({
    ...line,
    quantity: remainder,
    priceCents: baseUnitCents + 1,
    amountCents: (baseUnitCents + 1) * remainder
  })

  return parts
}

class CloudKassirService {
  isConfigured() {
    return Boolean(
      process.env.CLOUDKASSIR_PUBLIC_ID &&
      process.env.CLOUDKASSIR_API_SECRET &&
      (process.env.CLOUDKASSIR_INN || DEFAULT_INN)
    )
  }

  buildIncomeReceiptPayload(order) {
    const vat = resolveVat()
    const goodsLines = (order?.items || []).map((item) => {
      const productTitle = item.product?.title || 'Товар'
      const dosage = item.dosage ? `, ${item.dosage}` : ''
      const quantity = Math.max(1, Number(item.quantity) || 1)
      const unitCents = toCents(item.price)

      return {
        key: `item-${item.id || item.productId || productTitle}-${item.dosage || ''}`,
        label: sanitizeLabel(`${productTitle}${dosage}`),
        quantity,
        grossCents: Math.max(0, unitCents * quantity),
        object: 1
      }
    }).filter(line => line.grossCents > 0)

    const deliveryCents = isRecipientPaidCdekDelivery(order) ? 0 : toCents(order?.deliveryPrice)
    const deliveryLine = deliveryCents > 0
      ? [{
          key: 'delivery',
          label: sanitizeLabel(order?.deliveryTariffName || 'Доставка'),
          quantity: 1,
          grossCents: deliveryCents,
          object: 4
        }]
      : []

    const lines = [...goodsLines, ...deliveryLine]
    const totalCents = toCents(order?.total)
    const adjustedLines = allocateDiscount(lines, totalCents)
    const receiptItems = adjustedLines.flatMap(splitLineByQuantity).map(line => ({
      label: line.label,
      price: fromCents(line.priceCents),
      quantity: line.quantity,
      amount: fromCents(line.amountCents),
      vat,
      method: parseOptionalNumber(process.env.CLOUDKASSIR_PAYMENT_METHOD) ?? 4,
      object: line.object,
      unitCode: 0
    }))

    const receiptTotal = receiptItems.reduce((sum, item) => sum + toCents(item.amount), 0)

    const customerReceipt = {
      items: receiptItems,
      amounts: {
        electronic: fromCents(receiptTotal)
      },
      calculationPlace: process.env.CLOUDKASSIR_CALCULATION_PLACE || DEFAULT_CALCULATION_PLACE,
      isInternetPayment: true,
      email: String(order?.customerEmail || '').trim() || undefined,
      phone: sanitizePhone(order?.customerPhone),
      customerInfo: sanitizeLabel(order?.customerName || 'Покупатель')
    }

    const taxationSystem = parseOptionalNumber(process.env.CLOUDKASSIR_TAXATION_SYSTEM)
    if (taxationSystem !== undefined) {
      customerReceipt.taxationSystem = taxationSystem
    }

    return {
      inn: process.env.CLOUDKASSIR_INN || DEFAULT_INN,
      invoiceId: String(order?.id || ''),
      accountId: order?.userId ? String(order.userId) : undefined,
      type: 'Income',
      customerReceipt
    }
  }

  async sendIncomeReceipt(order, options = {}) {
    const orderId = order?.id || null
    if (!this.isConfigured()) {
      console.warn('[CLOUDKASSIR] receipt skipped: credentials are not configured', JSON.stringify({ orderId }))
      return { success: false, skipped: true, error: 'CloudKassir не настроен' }
    }

    const payload = this.buildIncomeReceiptPayload(order)
    if (!payload.customerReceipt.items.length) {
      console.warn('[CLOUDKASSIR] receipt skipped: no receipt items', JSON.stringify({ orderId }))
      return { success: false, skipped: true, error: 'Нет позиций для чека' }
    }

    const requestId = options.requestId || `angel-wings-order-${orderId}-income`
    console.log('[CLOUDKASSIR] receipt request', JSON.stringify({
      orderId,
      requestId,
      itemsCount: payload.customerReceipt.items.length,
      amount: payload.customerReceipt.amounts.electronic,
      source: options.source || null
    }))

    try {
      const response = await axios.post(
        `${CLOUDKASSIR_API_URL}/kkt/receipt`,
        payload,
        {
          auth: {
            username: process.env.CLOUDKASSIR_PUBLIC_ID,
            password: process.env.CLOUDKASSIR_API_SECRET
          },
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          },
          timeout: Number(process.env.CLOUDKASSIR_TIMEOUT_MS || 10000)
        }
      )

      console.log('[CLOUDKASSIR] receipt response', JSON.stringify({
        orderId,
        success: Boolean(response.data?.Success),
        message: response.data?.Message || null,
        receiptId: response.data?.Model?.Id || null,
        receiptUrl: response.data?.Model?.ReceiptLocalUrl || null
      }))

      return {
        success: Boolean(response.data?.Success),
        receiptId: response.data?.Model?.Id || null,
        receiptUrl: response.data?.Model?.ReceiptLocalUrl || null,
        message: response.data?.Message || null,
        raw: response.data
      }
    } catch (error) {
      console.error('[CLOUDKASSIR] receipt error', JSON.stringify({
        orderId,
        message: error.response?.data?.Message || error.message,
        status: error.response?.status || null,
        data: error.response?.data || null
      }))

      return {
        success: false,
        error: error.response?.data?.Message || error.message || 'Ошибка CloudKassir',
        raw: error.response?.data || null
      }
    }
  }
}

export default new CloudKassirService()
