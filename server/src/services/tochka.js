import axios from 'axios'
import cloudKassirService from './cloudKassir.js'

const TOCHKA_API_URL = 'https://enter.tochka.com/uapi/acquiring/v1.0'
const TOCHKA_OPEN_BANKING_URL = 'https://enter.tochka.com/uapi/open-banking/v1.0'
const TOCHKA_STATUS_TIMEOUT_MS = Number(process.env.TOCHKA_STATUS_TIMEOUT_MS || 5000)

function toCents(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}

function fromCents(value) {
  return Number((Math.max(0, Number(value) || 0) / 100).toFixed(2))
}

function sanitizeReceiptText(value, fallback = 'Товар') {
  return (String(value || fallback).replace(/\s+/g, ' ').trim() || fallback).slice(0, 256)
}

class TochkaService {
  buildReceipt(order, paymentAmount) {
    const email = String(order?.customerEmail || '').trim()
    if (!email) {
      throw new Error('В заказе не указан email для отправки чека')
    }

    // Use the same discount allocation as CloudKassir so both fiscal receipts
    // contain identical positions and always match the payment amount.
    const cloudKassirPayload = cloudKassirService.buildIncomeReceiptPayload({
      ...order,
      total: paymentAmount
    })
    const sourceItems = cloudKassirPayload?.customerReceipt?.items || []
    const items = sourceItems.map(item => ({
      name: sanitizeReceiptText(item.label),
      amount: Number(item.price),
      quantity: Number(item.quantity),
      paymentMethod: 'full_payment',
      paymentObject: item.object === 4 ? 'service' : 'commodity',
      measure: 'шт.'
    }))

    const targetCents = toCents(paymentAmount)
    const itemsCents = sourceItems.reduce((sum, item) => sum + toCents(item.amount), 0)
    const missingCents = targetCents - itemsCents

    // This is mainly needed for partial additional payments where the payment
    // can exceed the current set of fiscal positions selected from the order.
    if (missingCents > 0) {
      items.push({
        name: sanitizeReceiptText(`Доплата по заказу #${order?.id || ''}`),
        amount: fromCents(missingCents),
        quantity: 1,
        paymentMethod: 'full_payment',
        paymentObject: 'service',
        measure: 'шт.'
      })
    }

    if (!items.length) {
      throw new Error('В заказе нет позиций для чека')
    }

    const receipt = {
      Client: {
        email,
        name: String(order?.customerName || '').trim() || undefined,
        phone: cloudKassirPayload?.customerReceipt?.phone
      },
      Items: items
    }

    const taxSystemCode = String(process.env.TOCHKA_TAX_SYSTEM_CODE || 'usn_income').trim()
    if (taxSystemCode) receipt.taxSystemCode = taxSystemCode

    const vatType = String(process.env.TOCHKA_VAT_TYPE || '').trim()
    if (vatType) {
      receipt.Items = receipt.Items.map(item => ({ ...item, vatType }))
    }

    return receipt
  }

  pickFirstString(candidates = []) {
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return null
  }

  extractPaymentUrl(payload) {
    const candidates = [
      payload?.Data?.paymentUrl,
      payload?.Data?.PaymentUrl,
      payload?.Data?.paymentLink,
      payload?.Data?.PaymentLink,
      payload?.Data?.url,
      payload?.Data?.Url,
      payload?.Data?.redirectUrl,
      payload?.paymentUrl,
      payload?.PaymentUrl,
      payload?.paymentLink,
      payload?.PaymentLink,
      payload?.url,
      payload?.Url
    ]

    const direct = candidates.find(value => typeof value === 'string' && value.startsWith('http'))
    if (direct) return direct

    const scan = (obj) => {
      if (!obj || typeof obj !== 'object') return null
      for (const value of Object.values(obj)) {
        if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value
        if (value && typeof value === 'object') {
          const nested = scan(value)
          if (nested) return nested
        }
      }
      return null
    }

    return scan(payload)
  }

  extractPaymentId(payload) {
    const direct = this.pickFirstString([
      payload?.Data?.paymentId,
      payload?.Data?.PaymentId,
      payload?.paymentId,
      payload?.PaymentId,
      payload?.Data?.operationId,
      payload?.Data?.OperationId,
      payload?.operationId,
      payload?.OperationId
    ])
    if (direct) return direct

    const paymentUrl = this.extractPaymentUrl(payload)
    if (paymentUrl) {
      try {
        const parsed = new URL(paymentUrl)
        const uuid = parsed.searchParams.get('uuid')
        if (uuid) return uuid
      } catch {
        // ignore invalid URL
      }
    }

    return null
  }

  extractPaymentStatus(payload) {
    const direct = this.pickFirstString([
      payload?.Data?.status,
      payload?.Data?.Status,
      payload?.Data?.paymentStatus,
      payload?.Data?.PaymentStatus,
      payload?.Data?.operationStatus,
      payload?.Data?.OperationStatus,
      payload?.Data?.Payment?.status,
      payload?.Data?.Payment?.Status,
      payload?.Data?.Operation?.status,
      payload?.Data?.Operation?.Status,
      payload?.status,
      payload?.Status
    ])
    if (direct) return direct

    const scan = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object' || depth > 4) return null
      for (const [key, value] of Object.entries(obj)) {
        if (
          typeof value === 'string' &&
          /status/i.test(key) &&
          value.trim()
        ) {
          return value.trim()
        }
        if (value && typeof value === 'object') {
          const nested = scan(value, depth + 1)
          if (nested) return nested
        }
      }
      return null
    }

    return scan(payload)
  }

  getEnv() {
    return {
      jwtToken: process.env.TOCHKA_JWT_TOKEN,
      customerCode: process.env.TOCHKA_CUSTOMER_CODE,
      clientId: process.env.TOCHKA_CLIENT_ID
    }
  }

  getHeaders() {
    const { jwtToken, clientId } = this.getEnv()
    return {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      'X-Client-Id': clientId
    }
  }

  async resolveBusinessCustomerCode() {
    const { customerCode } = this.getEnv()
    if (customerCode) return customerCode

    const response = await axios.get(
      `${TOCHKA_OPEN_BANKING_URL}/customers`,
      { headers: this.getHeaders() }
    )

    const customers = response.data?.Data?.Customer || response.data?.Data?.customers || []
    const businessCustomer = customers.find(item =>
      String(item?.customerType || '').toLowerCase() === 'business'
    )

    if (!businessCustomer?.customerCode) {
      throw new Error('Не найден customerCode для customerType=Business')
    }

    return businessCustomer.customerCode
  }

  async resolveActiveMerchantId(customerCode) {
    try {
      const response = await axios.get(
        `${TOCHKA_API_URL}/retailers`,
        {
          headers: this.getHeaders(),
          params: { customerCode }
        }
      )

      const retailers = response.data?.Data?.Retailer || response.data?.Data?.retailers || []
      const activeRetailer = retailers.find(item =>
        String(item?.status || '').toUpperCase() === 'REG' && Boolean(item?.isActive)
      )

      return activeRetailer?.merchantId || null
    } catch (error) {
      console.warn('Tochka resolveActiveMerchantId warning:', error.response?.data || error.message)
      return null
    }
  }

  async createPayment(amount, orderId, purpose, redirectUrl, failRedirectUrl, order = null) {
    try {
      const { jwtToken, clientId } = this.getEnv()
      console.log('[TOCHKA] createPayment start', JSON.stringify({
        orderId,
        amount,
        hasJwtToken: Boolean(jwtToken),
        hasClientId: Boolean(clientId),
        hasCustomerCode: Boolean(process.env.TOCHKA_CUSTOMER_CODE)
      }))

      if (!jwtToken || !clientId) {
        return {
          success: false,
          error: 'Не настроены TOCHKA_JWT_TOKEN или TOCHKA_CLIENT_ID'
        }
      }

      const customerCode = await this.resolveBusinessCustomerCode()
      const merchantId = await this.resolveActiveMerchantId(customerCode)
      const uniqueSuffix = Date.now()
      const receipt = order ? this.buildReceipt(order, amount) : null

      const requestData = {
        Data: {
          amount: parseFloat(amount),
          customerCode,
          paymentMode: ['card', 'sbp'],
          purpose: purpose,
          redirectUrl: redirectUrl,
          failRedirectUrl: failRedirectUrl,
          paymentLinkId: `ORDER-${orderId}-${uniqueSuffix}`
        }
      }

      if (receipt) {
        Object.assign(requestData.Data, receipt)
      }

      if (merchantId) {
        requestData.Data.merchantId = merchantId
      }

      console.log('[TOCHKA] createPayment request prepared', JSON.stringify({
        orderId,
        customerCode,
        hasMerchantId: Boolean(merchantId),
        hasReceipt: Boolean(receipt),
        receiptItemsCount: receipt?.Items?.length || 0,
        hasReceiptEmail: Boolean(receipt?.Client?.email),
        paymentLinkId: requestData.Data.paymentLinkId,
        redirectUrl,
        failRedirectUrl
      }))
      
      const response = await axios.post(
        `${TOCHKA_API_URL}${receipt ? '/payments_with_receipt' : '/payments'}`,
        requestData,
        {
          headers: this.getHeaders()
        }
      )

      // Handle different response formats
      const paymentUrl = this.extractPaymentUrl(response.data)
      const paymentId = this.extractPaymentId(response.data)

      console.log('[TOCHKA] createPayment success', JSON.stringify({
        orderId,
        paymentId,
        hasPaymentUrl: Boolean(paymentUrl)
      }))

      if (!paymentUrl) {
        console.error('[TOCHKA] createPayment missing payment URL', JSON.stringify({
          orderId,
          paymentId,
          response: response.data
        }))
        return {
          success: false,
          error: 'Точка не вернула ссылку на оплату',
          debug: response.data || null
        }
      }

      return {
        success: true,
        paymentUrl,
        paymentId
      }
    } catch (error) {
      console.error('Tochka payment creation error:', error.response?.data || error.message)
      
      // Log full error for debugging
      if (error.response?.data) {
        console.log('Full Tochka error response:', JSON.stringify(error.response.data, null, 2))
      }

      const apiErrors = error.response?.data?.Errors
      const apiErrorsText = Array.isArray(apiErrors)
        ? apiErrors.map(item => item?.message).filter(Boolean).join(' ')
        : ''
      
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          apiErrorsText ||
          error.response?.data?.Errors?.[0]?.message ||
          error.message ||
          'Ошибка создания платежа',
        debug: error.response?.data || null
      }
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      console.log('[TOCHKA] getPaymentStatus start', JSON.stringify({ paymentId }))
      const response = await axios.get(
        `${TOCHKA_API_URL}/payments/${paymentId}`,
        {
          headers: this.getHeaders(),
          timeout: TOCHKA_STATUS_TIMEOUT_MS
        }
      )

      const status = this.extractPaymentStatus(response.data)
      return {
        success: true,
        status,
        amount: response.data?.Data?.amount || response.data?.Data?.Amount || response.data?.amount
      }
    } catch (error) {
      console.error('Tochka payment status error:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || 'Ошибка проверки статуса'
      }
    }
  }
}

export default new TochkaService()
