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
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const chatId = (process.env.TELEGRAM_ORDERS_CHAT_ID || '').trim()
  const threadId = (process.env.TELEGRAM_ORDERS_THREAD_ID || '').trim()

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

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) {
    throw new Error(`[TELEGRAM] sendMessage failed: ${JSON.stringify(data)}`)
  }

  return { ok: true }
}

