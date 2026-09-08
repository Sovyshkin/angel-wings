import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import emailService from './email.js'

const prisma = new PrismaClient()
const DEFAULT_SETTINGS = {
  cartEnabled: true,
  cartDelayHours: 24,
  unpaidOrderEnabled: true,
  unpaidOrderDelayHours: 3
}
const ACCESSORY_PATTERN = /игл|шприц|расход|контейнер|салфет|перчат/i

function isAccessory(item) {
  return ACCESSORY_PATTERN.test(`${item?.title || ''} ${(item?.categories || []).map(category => category.name).join(' ')}`)
}

function positionLabel(count) {
  const value = Math.abs(Number(count)) % 100
  const lastDigit = value % 10
  if (value > 10 && value < 20) return 'позиций'
  if (lastDigit === 1) return 'позиция'
  if (lastDigit >= 2 && lastDigit <= 4) return 'позиции'
  return 'позиций'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function cleanText(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function descriptionExcerpt(value, maxLength = 380) {
  const text = cleanText(value)
  if (!text) return 'Подробные характеристики доступны в карточке товара.'
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]
  const result = sentences.slice(0, 2).join(' ').trim()
  if (result.length <= maxLength) return result
  return `${result.slice(0, maxLength).replace(/\s+\S*$/, '')}…`
}

function formatMoney(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('ru-RU')} ₽`
}

function clientUrl(path = '') {
  const base = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://angel-wings.ru').replace(/\/+$/, '')
  return `${base}${path}`
}

function publicAssetUrl(value) {
  const path = String(value || '').trim()
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return clientUrl(`/${path.replace(/^\/+/, '')}`)
}

function unsubscribeUrl(userId) {
  const token = jwt.sign(
    { userId, purpose: 'recovery_unsubscribe' },
    process.env.JWT_SECRET,
    { expiresIn: '90d' }
  )
  const apiBase = String(process.env.API_PUBLIC_URL || process.env.SERVER_URL || clientUrl()).replace(/\/+$/, '')
  return `${apiBase}/api/recovery/unsubscribe?token=${encodeURIComponent(token)}`
}

function productCards(items) {
  return items.map((item, index) => {
    const accessory = isAccessory(item)
    const role = accessory ? 'Расходный материал' : (index === 0 ? 'Основной выбор' : 'В вашей подборке')
    const imageUrl = publicAssetUrl(item.image)
    const image = imageUrl
      ? `<img class="product-image" src="${escapeHtml(imageUrl)}" width="104" alt="${escapeHtml(item.title)}" style="display:block;width:104px;max-width:104px;height:104px;object-fit:contain;border:0;border-radius:18px;background:#f2f4f9">`
      : `<table role="presentation" class="product-image" width="104" height="104" cellpadding="0" cellspacing="0" border="0" style="width:104px;height:104px;background:#f2f4f9;border-radius:18px"><tr><td align="center" valign="middle" style="font-size:25px;font-weight:800;color:#91a8f4">AW</td></tr></table>`
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 14px;border:1px solid #e3e7f0;border-radius:24px;background:#ffffff;border-collapse:separate">
        <tr>
          <td class="product-pad" style="padding:22px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="product-media" width="104" valign="top" style="width:104px;padding:0 20px 0 0">${image}</td>
                <td valign="top">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="padding:1px 0 8px;font-size:11px;line-height:14px;letter-spacing:1.5px;text-transform:uppercase;color:#718bdc;font-weight:800">${String(index + 1).padStart(2, '0')} &nbsp;·&nbsp; ${role}</td></tr>
                    <tr><td style="padding:0 0 9px;font-size:21px;line-height:26px;font-weight:800;color:#151824">${escapeHtml(item.title)}</td></tr>
                    <tr><td style="padding:0;color:#646c80;font-size:14px;line-height:22px">${escapeHtml(descriptionExcerpt(item.description, 300))}</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:18px 0 0">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #edf0f5">
                    <tr>
                      <td style="padding:15px 0 0;color:#7a8293;font-size:13px">Количество: <strong style="color:#151824">${item.quantity}</strong></td>
                      <td align="right" style="padding:15px 0 0;color:#151824;font-size:17px;font-weight:800;white-space:nowrap">${formatMoney(item.price * item.quantity)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
  }).join('')
}

export function buildRecoveryEmail({ name, items, total, mode, userId, orderId = null }) {
  const isOrder = mode === 'UNPAID_ORDER'
  const subject = isOrder ? `Заказ #${orderId} ожидает оплаты` : 'Ваш выбор Angel Wings сохранён'
  const heading = isOrder ? 'Завершите оформление заказа' : 'Товары всё ещё в вашей корзине'
  const intro = isOrder
    ? `Заказ #${orderId} сохранён, но оплата пока не завершена. Ниже — выбранные позиции и их описание.`
    : 'Вы выбрали несколько товаров, но не завершили оформление. Мы сохранили состав корзины и подготовили краткую информацию по каждой позиции.'
  const actionUrl = isOrder ? clientUrl('/profile') : clientUrl('/cart')
  const actionLabel = isOrder ? 'Перейти к оплате' : 'Вернуться в корзину'
  const safeName = escapeHtml(name || 'клиент')
  const orderedItems = [...items].sort((a, b) => {
    const accessoryDifference = Number(isAccessory(a)) - Number(isAccessory(b))
    return accessoryDifference || (b.price * b.quantity) - (a.price * a.quantity)
  })
  const safety = orderedItems.filter(item => !isAccessory(item)).length > 1
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:4px 0 18px;background:#eef2ff;border-radius:18px"><tr><td width="42" valign="top" style="padding:17px 0 17px 18px;color:#7891df;font-size:18px">ⓘ</td><td style="padding:16px 18px 16px 8px;color:#5f6980;font-size:13px;line-height:20px">Наличие нескольких продуктов в одном заказе не означает, что они предназначены для обязательного совместного применения.</td></tr></table>`
    : ''

  const text = [
    `Здравствуйте, ${name || 'клиент'}!`, '', intro, '',
    ...orderedItems.flatMap(item => [
      `${item.title} — ${item.quantity} шт., ${formatMoney(item.price * item.quantity)}`,
      descriptionExcerpt(item.description), ''
    ]),
    `Итого: ${formatMoney(total)}`,
    `${actionLabel}: ${actionUrl}`,
    '',
    'Материалы предназначены для профессионального и исследовательского использования. Информация в письме не является медицинской рекомендацией.',
    `Отписаться: ${unsubscribeUrl(userId)}`
  ].join('\n')

  const html = `<!doctype html>
    <html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding:22px 16px!important}.email-meta{display:none!important}.hero-pad{padding:30px 24px!important}.hero-title{font-size:30px!important;line-height:34px!important}.product-pad{padding:18px!important}.product-media{width:72px!important;padding-right:14px!important}.product-image{width:72px!important;max-width:72px!important;height:72px!important}}</style>
    </head><body style="margin:0;padding:0;background:#eef0f5;font-family:Arial,'Helvetica Neue',sans-serif">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(intro)} ${formatMoney(total)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0f5" style="width:100%;background:#eef0f5;font-family:Arial,'Helvetica Neue',sans-serif">
        <tr><td align="center" class="email-pad" style="padding:32px 12px">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:640px;max-width:640px">
            <tr><td style="padding:0 4px 14px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:13px;line-height:18px;letter-spacing:2.6px;text-transform:uppercase;color:#5369ad;font-weight:900">ANGEL&nbsp;WINGS</td>
                <td align="right" class="email-meta" style="font-size:11px;line-height:18px;letter-spacing:1.2px;text-transform:uppercase;color:#838b9c">Персональная подборка</td>
              </tr></table>
            </td></tr>
            <tr><td class="hero-pad" bgcolor="#11141d" style="padding:38px 36px 36px;background:#11141d;border-radius:30px;color:#ffffff">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 0 24px"><span style="display:inline-block;padding:8px 12px;border:1px solid #343a4c;border-radius:99px;color:#aebeff;font-size:11px;line-height:14px;letter-spacing:1.2px;text-transform:uppercase;font-weight:800">${isOrder ? `Заказ №${orderId}` : 'Ваш выбор сохранён'}</span></td></tr>
                <tr><td class="hero-title" style="padding:0 0 15px;font-size:38px;line-height:42px;font-weight:850;letter-spacing:-1px">${heading}</td></tr>
                <tr><td style="padding:0 0 26px;color:#bdc3d2;font-size:15px;line-height:24px">Здравствуйте, ${safeName}! ${escapeHtml(intro)}</td></tr>
                <tr><td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="padding:10px 14px;background:#202532;border-radius:12px;color:#ffffff;font-size:13px;font-weight:700">${orderedItems.length} ${positionLabel(orderedItems.length)} &nbsp;·&nbsp; <span style="color:#aebeff">${formatMoney(total)}</span></td>
                  </tr></table>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:18px 0 0">${productCards(orderedItems)}</td></tr>
            <tr><td>${safety}</td></tr>
            <tr><td style="padding:0 0 14px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#171b26" style="width:100%;background:#171b26;border-radius:22px">
                <tr>
                  <td style="padding:23px 26px;color:#aeb5c5;font-size:13px;line-height:18px;text-transform:uppercase;letter-spacing:1.4px;font-weight:750">Итого</td>
                  <td align="right" style="padding:23px 26px;color:#aebeff;font-size:24px;line-height:28px;font-weight:900;white-space:nowrap">${formatMoney(total)}</td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 0 24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td align="center" bgcolor="#9fb5ff" style="background:#9fb5ff;border-radius:18px">
                  <a href="${escapeHtml(actionUrl)}" style="display:block;padding:18px 24px;color:#10131c;text-decoration:none;font-size:16px;line-height:20px;font-weight:900">${actionLabel} &nbsp;→</a>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:0 8px;color:#7a8292;font-size:12px;line-height:19px;text-align:center">Материалы предназначены для профессионального и исследовательского использования.<br>Информация в письме не является медицинской рекомендацией.</td></tr>
            <tr><td align="center" style="padding:14px 8px 6px;font-size:12px;line-height:18px"><a href="${escapeHtml(unsubscribeUrl(userId))}" style="color:#7a8292;text-decoration:underline">Отказаться от подобных напоминаний</a></td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`

  return { subject, text, html }
}

export async function getRecoverySettings() {
  return prisma.recoverySettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...DEFAULT_SETTINGS }
  })
}

async function hydrateCartItems(rawItems) {
  const normalized = Array.isArray(rawItems) ? rawItems : []
  const productIds = [...new Set(normalized.map(item => Number(item.productId || item.id)).filter(Number.isInteger))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { categories: { select: { name: true, slug: true } } }
  })
  const productMap = new Map(products.map(product => [product.id, product]))
  return normalized.flatMap(raw => {
    const product = productMap.get(Number(raw.productId || raw.id))
    if (!product) return []
    const quantity = Math.min(99, Math.max(1, Number.parseInt(raw.quantity, 10) || 1))
    let price = Number(product.price)
    if (raw.selectedDosage) {
      try {
        const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs
        const dosage = Array.isArray(specs?.dosages)
          ? specs.dosages.find(item => String(item?.dosage || '').trim() === String(raw.selectedDosage).trim())
          : null
        if (dosage?.price !== undefined && dosage?.price !== null && dosage?.price !== '') {
          price = Math.max(0, Number(dosage.price) || 0)
        }
      } catch {
        // Use the base product price when legacy specs cannot be parsed.
      }
    }
    return [{
      productId: product.id,
      title: product.title,
      description: product.description,
      image: product.image,
      price,
      quantity,
      selectedDosage: String(raw.selectedDosage || '').trim() || null,
      categories: product.categories
    }]
  })
}

async function sendCartReminder(cart) {
  const currentCart = await prisma.recoveryCart.findUnique({ where: { id: cart.id }, select: { active: true, cartHash: true } })
  if (!currentCart?.active || currentCart.cartHash !== cart.cartHash) {
    await prisma.recoveryCart.updateMany({ where: { id: cart.id }, data: { processingAt: null } })
    return false
  }
  const items = await hydrateCartItems(JSON.parse(cart.items || '[]'))
  if (!items.length) {
    await prisma.recoveryCart.update({ where: { id: cart.id }, data: { active: false, processingAt: null } })
    return false
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const message = buildRecoveryEmail({ name: cart.user.name, items, total, mode: 'CART', userId: cart.userId })
  const key = { type_targetId_fingerprint: { type: 'CART', targetId: String(cart.id), fingerprint: cart.cartHash } }
  const log = await prisma.recoveryEmailLog.upsert({
    where: key,
    update: { status: 'SENDING', error: null },
    create: { type: 'CART', targetId: String(cart.id), fingerprint: cart.cartHash, recipient: cart.email, subject: message.subject, status: 'SENDING' }
  })
  try {
    await emailService.sendMail({ to: cart.email, ...message })
    await prisma.$transaction([
      prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { status: 'SENT', sentAt: new Date() } }),
      prisma.recoveryCart.update({ where: { id: cart.id }, data: { reminderSentAt: new Date(), processingAt: null } })
    ])
    return true
  } catch (error) {
    await prisma.$transaction([
      prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { status: 'FAILED', error: String(error.message || error).slice(0, 1000) } }),
      prisma.recoveryCart.update({ where: { id: cart.id }, data: { processingAt: null } })
    ])
    return false
  }
}

async function sendOrderReminder(order) {
  const currentOrder = await prisma.order.findUnique({ where: { id: order.id }, select: { status: true, paymentStatus: true } })
  if (currentOrder?.status !== 'PENDING' || currentOrder?.paymentStatus !== 'PENDING') {
    await prisma.order.updateMany({ where: { id: order.id }, data: { recoveryProcessingAt: null } })
    return false
  }
  const items = order.items.map(item => ({
    productId: item.productId,
    title: item.product.title,
    description: item.product.description,
    image: item.product.image,
    price: Number(item.price),
    quantity: item.quantity,
    selectedDosage: item.dosage,
    categories: item.product.categories
  }))
  const message = buildRecoveryEmail({ name: order.customerName, items, total: order.total, mode: 'UNPAID_ORDER', userId: order.userId, orderId: order.id })
  const fingerprint = `order-${order.id}`
  const key = { type_targetId_fingerprint: { type: 'UNPAID_ORDER', targetId: String(order.id), fingerprint } }
  const log = await prisma.recoveryEmailLog.upsert({
    where: key,
    update: { status: 'SENDING', error: null },
    create: { type: 'UNPAID_ORDER', targetId: String(order.id), fingerprint, recipient: order.customerEmail, subject: message.subject, status: 'SENDING' }
  })
  try {
    await emailService.sendMail({ to: order.customerEmail, ...message })
    await prisma.$transaction([
      prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { status: 'SENT', sentAt: new Date() } }),
      prisma.order.update({ where: { id: order.id }, data: { recoveryReminderSentAt: new Date(), recoveryProcessingAt: null } })
    ])
    return true
  } catch (error) {
    await prisma.$transaction([
      prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { status: 'FAILED', error: String(error.message || error).slice(0, 1000) } }),
      prisma.order.update({ where: { id: order.id }, data: { recoveryProcessingAt: null } })
    ])
    return false
  }
}

export async function runRecoverySweep() {
  if (!emailService.isConfigured()) return { carts: 0, orders: 0, skipped: 'email_not_configured' }
  const settings = await getRecoverySettings()
  const now = new Date()
  const staleLock = new Date(now.getTime() - 15 * 60 * 1000)
  await Promise.all([
    prisma.recoveryCart.updateMany({ where: { processingAt: { lt: staleLock }, reminderSentAt: null }, data: { processingAt: null } }),
    prisma.order.updateMany({ where: { recoveryProcessingAt: { lt: staleLock }, recoveryReminderSentAt: null }, data: { recoveryProcessingAt: null } })
  ])

  let cartsSent = 0
  let ordersSent = 0
  if (settings.cartEnabled) {
    const cutoff = new Date(now.getTime() - settings.cartDelayHours * 60 * 60 * 1000)
    const carts = await prisma.recoveryCart.findMany({
      where: {
        active: true,
        reminderSentAt: null,
        processingAt: null,
        lastActivityAt: { lte: cutoff },
        user: { marketingConsentAt: { not: null }, marketingUnsubscribedAt: null }
      },
      include: { user: { select: { name: true } } },
      take: 20
    })
    for (const cart of carts) {
      const claimed = await prisma.recoveryCart.updateMany({ where: { id: cart.id, active: true, processingAt: null, reminderSentAt: null }, data: { processingAt: now } })
      if (!claimed.count) continue
      try {
        if (await sendCartReminder(cart)) cartsSent += 1
      } catch (error) {
        await prisma.recoveryCart.updateMany({ where: { id: cart.id }, data: { processingAt: null } })
        console.error('[RECOVERY] cart reminder failed', cart.id, error)
      }
    }
  }

  if (settings.unpaidOrderEnabled) {
    const cutoff = new Date(now.getTime() - settings.unpaidOrderDelayHours * 60 * 60 * 1000)
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING', paymentStatus: 'PENDING', recoveryReminderSentAt: null, recoveryProcessingAt: null,
        createdAt: { lte: cutoff }, userId: { not: null },
        user: { marketingConsentAt: { not: null }, marketingUnsubscribedAt: null }
      },
      include: { user: { select: { id: true } }, items: { include: { product: { include: { categories: { select: { name: true, slug: true } } } } } } },
      take: 20
    })
    for (const order of orders) {
      const claimed = await prisma.order.updateMany({ where: { id: order.id, paymentStatus: 'PENDING', recoveryProcessingAt: null, recoveryReminderSentAt: null }, data: { recoveryProcessingAt: now } })
      if (!claimed.count) continue
      try {
        if (await sendOrderReminder(order)) ordersSent += 1
      } catch (error) {
        await prisma.order.updateMany({ where: { id: order.id }, data: { recoveryProcessingAt: null } })
        console.error('[RECOVERY] order reminder failed', order.id, error)
      }
    }
  }
  return { carts: cartsSent, orders: ordersSent }
}

export async function scheduleRecoveryTestEmail({ email, source = 'AUTO', delayMinutes = 1 }) {
  const recipient = String(email || '').trim().toLowerCase()
  if (!recipient || !recipient.includes('@')) {
    const error = new Error('Укажите корректный email для теста')
    error.status = 400
    throw error
  }
  if (!emailService.isConfigured()) {
    const error = new Error('Отправка почты не настроена на сервере')
    error.status = 503
    throw error
  }

  const user = await prisma.user.findUnique({ where: { email: recipient }, select: { id: true, name: true } })
  if (!user) {
    const error = new Error('Пользователь с таким email не найден')
    error.status = 404
    throw error
  }

  const normalizedSource = ['CART', 'UNPAID_ORDER'].includes(source) ? source : 'AUTO'
  let cart = null
  let order = null
  if (normalizedSource !== 'UNPAID_ORDER') {
    cart = await prisma.recoveryCart.findUnique({ where: { userId: user.id } })
    if (!cart?.active || !JSON.parse(cart.items || '[]').length) cart = null
  }
  if (!cart && normalizedSource !== 'CART') {
    order = await prisma.order.findFirst({
      where: { userId: user.id, status: 'PENDING', paymentStatus: 'PENDING' },
      include: { items: { include: { product: { include: { categories: { select: { name: true, slug: true } } } } } } },
      orderBy: { createdAt: 'desc' }
    })
  }
  if (!cart && !order) {
    const error = new Error(normalizedSource === 'CART' ? 'У пользователя нет активной синхронизированной корзины' : 'Не найдена активная корзина или неоплаченный заказ')
    error.status = 404
    throw error
  }

  const type = cart ? 'TEST_CART' : 'TEST_UNPAID_ORDER'
  const targetId = String(cart?.id || order.id)
  const fingerprint = `test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
  const scheduledAt = new Date(Date.now() + Math.max(1, Number(delayMinutes) || 1) * 60 * 1000)
  const log = await prisma.recoveryEmailLog.create({
    data: { type, targetId, fingerprint, recipient, subject: 'Тестовое письмо готовится', status: 'SCHEDULED', scheduledFor: scheduledAt }
  })

  return { id: log.id, recipient, source: cart ? 'CART' : 'UNPAID_ORDER', scheduledAt }
}

async function sendScheduledTestEmail(log) {
  let message
  if (log.type === 'TEST_CART') {
    const cart = await prisma.recoveryCart.findUnique({
      where: { id: Number(log.targetId) },
      include: { user: { select: { id: true, name: true } } }
    })
    if (!cart) throw new Error('Тестовая корзина больше не существует')
    const items = await hydrateCartItems(JSON.parse(cart.items || '[]'))
    if (!items.length) throw new Error('В тестовой корзине больше нет доступных товаров')
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    message = buildRecoveryEmail({ name: cart.user.name, items, total, mode: 'CART', userId: cart.user.id })
  } else if (log.type === 'TEST_UNPAID_ORDER') {
    const order = await prisma.order.findUnique({
      where: { id: Number(log.targetId) },
      include: {
        user: { select: { id: true } },
        items: { include: { product: { include: { categories: { select: { name: true, slug: true } } } } } }
      }
    })
    if (!order?.userId) throw new Error('Тестовый заказ больше не существует')
    const items = order.items.map(item => ({
      productId: item.productId, title: item.product.title, description: item.product.description,
      image: item.product.image, price: Number(item.price), quantity: item.quantity,
      selectedDosage: item.dosage, categories: item.product.categories
    }))
    message = buildRecoveryEmail({ name: order.customerName, items, total: order.total, mode: 'UNPAID_ORDER', userId: order.userId, orderId: order.id })
  } else {
    throw new Error(`Неизвестный тип тестового письма: ${log.type}`)
  }

  message.subject = `[Тест] ${message.subject}`
  await prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { subject: message.subject } })
  await emailService.sendMail({ to: log.recipient, ...message })
  await prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { status: 'SENT', sentAt: new Date(), processingAt: null } })
}

export async function runScheduledRecoveryTests() {
  if (!emailService.isConfigured()) return { sent: 0, skipped: 'email_not_configured' }
  await prisma.recoveryEmailLog.updateMany({
    where: {
      status: 'SENDING',
      type: { in: ['TEST_CART', 'TEST_UNPAID_ORDER'] },
      processingAt: { lt: new Date(Date.now() - 5 * 60 * 1000) }
    },
    data: { status: 'SCHEDULED', processingAt: null }
  })
  const jobs = await prisma.recoveryEmailLog.findMany({
    where: { status: 'SCHEDULED', scheduledFor: { lte: new Date() }, type: { in: ['TEST_CART', 'TEST_UNPAID_ORDER'] } },
    orderBy: { scheduledFor: 'asc' },
    take: 10
  })
  let sent = 0
  for (const log of jobs) {
    const claimed = await prisma.recoveryEmailLog.updateMany({
      where: { id: log.id, status: 'SCHEDULED' },
      data: { status: 'SENDING', error: null, processingAt: new Date() }
    })
    if (!claimed.count) continue
    try {
      await sendScheduledTestEmail(log)
      sent += 1
    } catch (error) {
      console.error('[RECOVERY] test email failed', error)
      await prisma.recoveryEmailLog.update({ where: { id: log.id }, data: { status: 'FAILED', processingAt: null, error: String(error.message || error).slice(0, 1000) } }).catch(() => {})
    }
  }
  return { sent }
}

let recoverySweepTimer = null
let recoveryTestTimer = null
export function startRecoveryWorker({ force = false } = {}) {
  const enabledInApi = String(process.env.RECOVERY_WORKER_ENABLED || 'true').toLowerCase() !== 'false'
  if ((!force && !enabledInApi) || recoverySweepTimer || recoveryTestTimer) return
  const runSweep = () => runRecoverySweep().catch(error => console.error('[RECOVERY] sweep failed', error))
  const runTests = () => runScheduledRecoveryTests().catch(error => console.error('[RECOVERY] scheduled test failed', error))
  setTimeout(runSweep, 15_000)
  setTimeout(runTests, 1_000)
  recoverySweepTimer = setInterval(runSweep, 5 * 60 * 1000)
  recoveryTestTimer = setInterval(runTests, 15 * 1000)
}

export { prisma as recoveryPrisma }
