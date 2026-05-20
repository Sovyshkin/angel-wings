import axios from 'axios'

const TOCHKA_API_URL = 'https://enter.tochka.com/uapi/acquiring/v1.0'

class TochkaService {
  constructor() {
    this.jwtToken = process.env.TOCHKA_JWT_TOKEN
    this.customerCode = process.env.TOCHKA_CUSTOMER_CODE
    this.clientId = process.env.TOCHKA_CLIENT_ID
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.jwtToken}`,
      'Content-Type': 'application/json',
      'X-Client-Id': this.clientId
    }
  }

  async createPayment(amount, orderId, purpose, redirectUrl, failRedirectUrl) {
    try {
      // Debug: log what we're sending
      console.log('Tochka createPayment called with:')
      console.log('- jwtToken:', this.jwtToken ? 'SET (length=' + this.jwtToken.length + ')' : 'MISSING')
      console.log('- customerCode:', this.customerCode)
      console.log('- clientId:', this.clientId)
      
      // Tochka API expects request wrapped in "Data" object with lowercase fields inside
      // paymentMode must be lowercase: 'sbp', 'card'
      // For localhost testing, keep http (don't force https)
      // In production, you should use real HTTPS domain
      const requestData = {
        Data: {
          amount: parseFloat(amount),
          customerCode: this.customerCode,
          paymentMode: ['card', 'sbp'],
          purpose: purpose,
          redirectUrl: redirectUrl,
          failRedirectUrl: failRedirectUrl,
          paymentLinkId: `ORDER-${orderId}`
        }
      }
      
      console.log('Tochka request data:', JSON.stringify(requestData, null, 2))
      
      const response = await axios.post(
        `${TOCHKA_API_URL}/payments`,
        requestData,
        {
          headers: this.getHeaders()
        }
      )

      console.log('Tochka response:', JSON.stringify(response.data, null, 2))

      // Handle different response formats
      const paymentUrl = response.data?.Data?.paymentUrl || response.data?.paymentUrl || response.data?.PaymentUrl
      const paymentId = response.data?.Data?.paymentId || response.data?.paymentId || response.data?.PaymentId

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
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.Errors?.[0]?.message || 'Ошибка создания платежа'
      }
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await axios.get(
        `${TOCHKA_API_URL}/payments/${paymentId}`,
        {
          headers: this.getHeaders()
        }
      )

      return {
        success: true,
        status: response.data?.Data?.Status || response.data?.status,
        amount: response.data?.Data?.Amount || response.data?.amount
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
