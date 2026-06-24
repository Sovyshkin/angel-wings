import https from 'node:https'
import crypto from 'node:crypto'
import axios from 'axios'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDeliveryLabel(order) {
  const tariffName = String(order?.deliveryTariffName || '').trim()
  const pickupName = String(order?.deliveryPickupName || '').trim()
  const city = String(order?.deliveryCity || '').trim()
  const deliveryPrice = Number(order?.deliveryPrice || 0)

  if (/курьер/i.test(tariffName) || /курьер/i.test(pickupName) || deliveryPrice === 690) {
    return 'Курьер по Москве'
  }
  if (/самовывоз/i.test(tariffName) || /самовывоз/i.test(pickupName)) {
    return 'Самовывоз'
  }
  if (order?.cdekOrderUuid || /cdek/i.test(tariffName)) {
    return 'Доставка СДЭК'
  }
  if (tariffName) return tariffName
  if (pickupName) return pickupName
  if (city) return `Доставка: ${city}`
  return 'Доставка не указана'
}

function getPaymentLabel(order) {
  const paymentStatus = String(order?.paymentStatus || '').trim().toUpperCase()
  if (paymentStatus === 'PAID') return '✅ Оплачен'
  if (paymentStatus === 'CASH_ON_DELIVERY') return '💵 Наличными при получении'
  if (paymentStatus === 'FAILED') return '❌ Не оплачен'
  if (paymentStatus === 'PENDING') return '⏳ Ожидает оплаты'
  return '⏳ Ожидает оплаты'
}

function getPartnerBonusLines(order) {
  const bonusAmount = Math.max(0, Number(order?.partnerBonusAmount || order?.partnerBonusInfo?.amount || 0))
  if (bonusAmount <= 0) return []

  const balance = order?.partnerBonusInfo?.balance
  const partnerName = order?.partnerBonusInfo?.partnerName || order?.partnerBonusInfo?.partnerEmail || ''
  const availableBalance = Number(balance?.availableBalance)
  const lines = [
    `<b>Баллы партнёра:</b> списано ${escapeHtml(formatMoney(bonusAmount))}`
  ]

  if (partnerName) {
    lines.push(`<b>Партнёр:</b> ${escapeHtml(partnerName)}`)
  }
  if (Number.isFinite(availableBalance)) {
    lines.push(`<b>Баланс партнёра:</b> ${escapeHtml(formatMoney(availableBalance))}`)
  }

  return lines
}

function buildOrderMessage(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  const lines = []
  for (const item of items) {
    const title = item?.product?.title || `Товар #${item?.productId || '—'}`
    const dosage = item?.dosage ? ` (${item.dosage})` : ''
    const qty = Number(item?.quantity || 0)
    const itemTotal = Number(item?.price || 0) * qty
    lines.push(`• ${escapeHtml(title)}${escapeHtml(dosage)} — ${qty} шт, ${formatMoney(itemTotal)}`)
  }

  return [
    '<b>Новый заказ</b>',
    '',
    `<b>Заказ:</b> #${order.id}`,
    `<b>Дата:</b> ${escapeHtml(formatDateTime(order.createdAt))}`,
    `<b>Сумма:</b> ${escapeHtml(formatMoney(order.total))}`,
    `<b>Статус оплаты:</b> ${escapeHtml(getPaymentLabel(order))}`,
    ...getPartnerBonusLines(order),
    `<b>Доставка:</b> ${escapeHtml(getDeliveryLabel(order))}`,
    `<b>Адрес:</b> ${escapeHtml(order.shippingAddress || order.deliveryPickupName || order.deliveryCity || '—')}`,
    '',
    '<b>Клиент:</b>',
    `• ${escapeHtml(order.customerName || '—')}`,
    `• ${escapeHtml(order.customerPhone || '—')}`,
    `• ${escapeHtml(order.customerEmail || '—')}`,
    '',
    '<b>Состав заказа:</b>',
    lines.length ? lines.join('\n') : '• Позиции не найдены',
    order?.notes ? `\n<b>Комментарий:</b> ${escapeHtml(order.notes)}` : ''
  ].join('\n')
}

function createRelaySignature(secret, timestamp, body) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function postRelayWithRetry({ relayUrl, relaySecret, relayPayload, orderId }) {
  const maxAttempts = getPositiveInt(process.env.TELEGRAM_RELAY_RETRY_ATTEMPTS, 4)
  const baseDelayMs = getPositiveInt(process.env.TELEGRAM_RELAY_RETRY_DELAY_MS, 2500)
  const timeoutMs = getPositiveInt(process.env.TELEGRAM_RELAY_TIMEOUT_MS, 30000)
  const relayBody = JSON.stringify(relayPayload)
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const relayTimestamp = String(Date.now())
    const relaySignature = createRelaySignature(relaySecret, relayTimestamp, relayBody)

    console.log('[TELEGRAM] relay request attempt', JSON.stringify({
      orderId,
      attempt,
      maxAttempts,
      relayUrl,
      hasThreadId: Boolean(relayPayload.threadId),
      textLength: relayPayload.text?.length || 0
    }))

    try {
      const response = await axios.post(`${relayUrl}/telegram/orders`, relayBody, {
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'X-AngelWings-Timestamp': relayTimestamp,
          'X-AngelWings-Signature': relaySignature
        },
        validateStatus: () => true
      })

      console.log('[TELEGRAM] relay response', JSON.stringify({
        orderId,
        attempt,
        httpStatus: response?.status || null,
        ok: response?.data?.ok,
        error: response?.data?.error || null
      }))

      if (Number(response?.status || 0) < 400 && response?.data?.ok !== false) {
        return response
      }

      lastError = new Error(`[TELEGRAM] relay failed: ${JSON.stringify(response?.data || {})}`)

      // 4xx usually means bad secret/body/configuration; retrying won't help.
      if (Number(response?.status || 0) >= 400 && Number(response?.status || 0) < 500) {
        throw lastError
      }
    } catch (error) {
      lastError = error
      console.error('[TELEGRAM] relay attempt failed', JSON.stringify({
        orderId,
        attempt,
        maxAttempts,
        message: error?.message || null,
        code: error?.cause?.code || error?.code || null
      }))

      if (attempt >= maxAttempts) {
        break
      }
    }

    const delayMs = baseDelayMs * attempt
    console.warn('[TELEGRAM] relay retry scheduled', JSON.stringify({
      orderId,
      nextAttempt: attempt + 1,
      delayMs
    }))
    await wait(delayMs)
  }

  throw lastError || new Error('[TELEGRAM] relay failed without response')
}

export async function notifyCourierOrderToTelegram(order) {
  const relayUrl = (process.env.TELEGRAM_RELAY_URL || '').trim().replace(/\/+$/, '')
  const relaySecret = (process.env.TELEGRAM_RELAY_SECRET || '').trim()
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const chatId = (process.env.TELEGRAM_ORDERS_CHAT_ID || '').trim()
  const threadId = (process.env.TELEGRAM_ORDERS_THREAD_ID || '').trim()

  console.log('[TELEGRAM] notifyCourierOrderToTelegram start', JSON.stringify({
    orderId: order?.id || null,
    hasRelayUrl: Boolean(relayUrl),
    hasRelaySecret: Boolean(relaySecret),
    hasToken: Boolean(token),
    chatId: chatId || null,
    hasThreadId: Boolean(threadId)
  }))

  if (relayUrl) {
    if (!relaySecret) {
      throw new Error('[TELEGRAM] TELEGRAM_RELAY_SECRET is required when TELEGRAM_RELAY_URL is set')
    }

    const relayPayload = {
      orderId: order?.id || null,
      text: buildOrderMessage(order),
      parseMode: 'HTML',
      disableWebPagePreview: true
    }

    if (threadId) {
      relayPayload.threadId = Number(threadId) || threadId
    }

    console.log('[TELEGRAM] relay request', JSON.stringify({
      orderId: order?.id || null,
      relayUrl,
      hasThreadId: Boolean(relayPayload.threadId),
      textLength: relayPayload.text?.length || 0
    }))

    const response = await postRelayWithRetry({
      relayUrl,
      relaySecret,
      relayPayload,
      orderId: order?.id || null
    })

    return { ok: true, relay: true }
  }

  if (!token || !chatId) {
    console.warn('[TELEGRAM] Skip courier notification: TELEGRAM_BOT_TOKEN or TELEGRAM_ORDERS_CHAT_ID is not set')
    return { ok: false, skipped: true }
  }

  const payload = {
    chat_id: chatId,
    text: buildOrderMessage(order),
    parse_mode: 'HTML',
    disable_web_page_preview: true
  }

  if (threadId) {
    payload.message_thread_id = Number(threadId) || threadId
  }

  console.log('[TELEGRAM] sendMessage request', JSON.stringify({
    orderId: order?.id || null,
    chatId,
    hasThreadId: Boolean(payload.message_thread_id),
    textLength: payload.text?.length || 0
  }))

  let response
  try {
    response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: new https.Agent({
        family: 4,
        keepAlive: true
      }),
      validateStatus: () => true
    })
  } catch (error) {
    console.error('[TELEGRAM] sendMessage network error', JSON.stringify({
      orderId: order?.id || null,
      message: error?.message || null,
      causeMessage: error?.cause?.message || null,
      code: error?.cause?.code || error?.code || null,
      errno: error?.cause?.errno || null,
      syscall: error?.cause?.syscall || null,
      address: error?.cause?.address || null,
      port: error?.cause?.port || null
    }))
    throw error
  }

  const data = response?.data && typeof response.data === 'object' ? response.data : {}
  console.log('[TELEGRAM] sendMessage response', JSON.stringify({
    orderId: order?.id || null,
    httpStatus: response?.status || null,
    ok: data?.ok,
    description: data?.description || null,
    errorCode: data?.error_code || null
  }))

  if (Number(response?.status || 0) >= 400 || data?.ok === false) {
    throw new Error(`[TELEGRAM] sendMessage failed: ${JSON.stringify(data)}`)
  }

  console.log('[TELEGRAM] order notification sent', JSON.stringify({
    orderId: order?.id || null,
    messageId: data?.result?.message_id || null
  }))
  return { ok: true }
}

export const notifyOrderToTelegram = notifyCourierOrderToTelegram
