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
  return items.map(item => {
    const accessory = ACCESSORY_PATTERN.test(`${item.title} ${item.categories.map(category => category.name).join(' ')}`)
    const role = accessory ? 'Расходный материал' : 'Почему этот товар может быть вам интересен'
    return `
      <div style="border:1px solid #e6e9f2;border-radius:18px;padding:18px;margin:0 0 12px;background:#fff">
        <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8195df;font-weight:700;margin-bottom:7px">${role}</div>
        <div style="font-size:18px;font-weight:750;color:#161925;margin-bottom:7px">${escapeHtml(item.title)}</div>
        <p style="margin:0 0 12px;color:#5f6678;line-height:1.55;font-size:14px">${escapeHtml(descriptionExcerpt(item.description))}</p>
        <div style="color:#161925;font-size:14px"><strong>${item.quantity} шт.</strong> · ${formatMoney(item.price * item.quantity)}</div>
      </div>`
  }).join('')
}

function buildEmail({ name, items, total, mode, userId, orderId = null }) {
  const isOrder = mode === 'UNPAID_ORDER'
  const subject = isOrder ? `Заказ #${orderId} ожидает оплаты` : 'Ваш выбор Angel Wings сохранён'
  const heading = isOrder ? 'Завершите оформление заказа' : 'Товары всё ещё в вашей корзине'
  const intro = isOrder
    ? `Заказ #${orderId} сохранён, но оплата пока не завершена. Ниже — выбранные позиции и их описание.`
    : 'Вы выбрали несколько товаров, но не завершили оформление. Мы сохранили состав корзины и подготовили краткую информацию по каждой позиции.'
  const actionUrl = isOrder ? clientUrl('/profile') : clientUrl('/cart')
  const actionLabel = isOrder ? 'Перейти к оплате' : 'Вернуться в корзину'
  const safeName = escapeHtml(name || 'клиент')
  const safety = items.filter(item => !ACCESSORY_PATTERN.test(item.title)).length > 1
    ? '<p style="margin:16px 0 0;color:#767d8d;font-size:13px;line-height:1.5">Наличие нескольких продуктов в одном заказе не означает, что они предназначены для обязательного совместного применения.</p>'
    : ''

  const text = [
    `Здравствуйте, ${name || 'клиент'}!`, '', intro, '',
    ...items.flatMap(item => [
      `${item.title} — ${item.quantity} шт., ${formatMoney(item.price * item.quantity)}`,
      descriptionExcerpt(item.description), ''
    ]),
    `Итого: ${formatMoney(total)}`,
    `${actionLabel}: ${actionUrl}`,
    '',
    'Материалы предназначены для профессионального и исследовательского использования. Информация в письме не является медицинской рекомендацией.',
    `Отписаться: ${unsubscribeUrl(userId)}`
  ].join('\n')

  const html = `
    <div style="margin:0;padding:28px 12px;background:#f4f5f9;font-family:Arial,sans-serif;color:#161925">
      <div style="max-width:640px;margin:0 auto">
        <div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#8195df;font-weight:800;margin:0 0 12px">Angel Wings</div>
        <div style="background:#11131a;border-radius:24px;padding:28px;color:#fff;margin-bottom:14px">
          <h1 style="margin:0 0 12px;font-size:27px;line-height:1.2">${heading}</h1>
          <p style="margin:0;color:#c8ccda;line-height:1.6;font-size:15px">Здравствуйте, ${safeName}! ${escapeHtml(intro)}</p>
        </div>
        ${productCards(items)}
        ${safety}
        <div style="display:flex;justify-content:space-between;gap:20px;align-items:center;padding:22px 4px 18px;font-size:18px"><strong>Итого</strong><strong>${formatMoney(total)}</strong></div>
        <a href="${actionUrl}" style="display:block;text-align:center;background:#a8bbff;color:#11131a;text-decoration:none;font-weight:800;border-radius:16px;padding:16px 20px">${actionLabel}</a>
        <p style="margin:18px 4px 0;color:#767d8d;font-size:12px;line-height:1.55">Материалы предназначены для профессионального и исследовательского использования. Информация в письме не является медицинской рекомендацией.</p>
        <p style="margin:10px 4px 0;font-size:12px"><a href="${unsubscribeUrl(userId)}" style="color:#767d8d">Отказаться от подобных напоминаний</a></p>
      </div>
    </div>`

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
  const message = buildEmail({ name: cart.user.name, items, total, mode: 'CART', userId: cart.userId })
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
  const message = buildEmail({ name: order.customerName, items, total: order.total, mode: 'UNPAID_ORDER', userId: order.userId, orderId: order.id })
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

let recoveryTimer = null
export function startRecoveryWorker() {
  if (String(process.env.RECOVERY_WORKER_ENABLED || 'true').toLowerCase() === 'false' || recoveryTimer) return
  const run = () => runRecoverySweep().catch(error => console.error('[RECOVERY] sweep failed', error))
  setTimeout(run, 15_000)
  recoveryTimer = setInterval(run, 5 * 60 * 1000)
  recoveryTimer.unref?.()
}

export { prisma as recoveryPrisma }
