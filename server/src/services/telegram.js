import https from 'node:https'
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

function buildCourierOrderMessage(order) {
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
    '<b>Новый заказ: внутренний курьер (Москва)</b>',
    '',
    `<b>Заказ:</b> #${order.id}`,
    `<b>Дата:</b> ${escapeHtml(formatDateTime(order.createdAt))}`,
    `<b>Сумма:</b> ${escapeHtml(formatMoney(order.total))}`,
    `<b>Доставка:</b> Курьер по Москве`,
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
      text: buildCourierOrderMessage(order),
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

    let response
    try {
      response = await axios.post(`${relayUrl}/telegram/orders`, relayPayload, {
        timeout: Number(process.env.TELEGRAM_RELAY_TIMEOUT_MS || 30000),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${relaySecret}`
        },
        validateStatus: () => true
      })
    } catch (error) {
      console.error('[TELEGRAM] relay network error', JSON.stringify({
        orderId: order?.id || null,
        message: error?.message || null,
        code: error?.cause?.code || error?.code || null
      }))
      throw error
    }

    console.log('[TELEGRAM] relay response', JSON.stringify({
      orderId: order?.id || null,
      httpStatus: response?.status || null,
      ok: response?.data?.ok,
      error: response?.data?.error || null
    }))

    if (Number(response?.status || 0) >= 400 || response?.data?.ok === false) {
      throw new Error(`[TELEGRAM] relay failed: ${JSON.stringify(response?.data || {})}`)
    }

    return { ok: true, relay: true }
  }

  if (!token || !chatId) {
    console.warn('[TELEGRAM] Skip courier notification: TELEGRAM_BOT_TOKEN or TELEGRAM_ORDERS_CHAT_ID is not set')
    return { ok: false, skipped: true }
  }

  const payload = {
    chat_id: chatId,
    text: buildCourierOrderMessage(order),
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

  console.log('[TELEGRAM] courier notification sent', JSON.stringify({
    orderId: order?.id || null,
    messageId: data?.result?.message_id || null
  }))
  return { ok: true }
}
