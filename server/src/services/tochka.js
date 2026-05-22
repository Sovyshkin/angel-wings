import axios from 'axios'

const TOCHKA_API_URL = 'https://enter.tochka.com/uapi/acquiring/v1.0'
const TOCHKA_OPEN_BANKING_URL = 'https://enter.tochka.com/uapi/open-banking/v1.0'

class TochkaService {
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

  async createPayment(amount, orderId, purpose, redirectUrl, failRedirectUrl) {
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

      if (merchantId) {
        requestData.Data.merchantId = merchantId
      }

      console.log('[TOCHKA] createPayment request prepared', JSON.stringify({
        orderId,
        customerCode,
        hasMerchantId: Boolean(merchantId),
        paymentLinkId: requestData.Data.paymentLinkId,
        redirectUrl,
        failRedirectUrl
      }))
      
      const response = await axios.post(
        `${TOCHKA_API_URL}/payments`,
        requestData,
        {
          headers: this.getHeaders()
        }
      )

      // Handle different response formats
      const paymentUrl =
        response.data?.Data?.paymentUrl ||
        response.data?.Data?.PaymentUrl ||
        response.data?.paymentUrl ||
        response.data?.PaymentUrl
      const paymentId =
        response.data?.Data?.operationId ||
        response.data?.Data?.paymentId ||
        response.data?.paymentId ||
        response.data?.PaymentId

      console.log('[TOCHKA] createPayment success', JSON.stringify({
        orderId,
        paymentId,
        hasPaymentUrl: Boolean(paymentUrl)
      }))

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
          headers: this.getHeaders()
        }
      )

      return {
        success: true,
        status: response.data?.Data?.status || response.data?.Data?.Status || response.data?.status,
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
