import { isActivePartner, isOwnPartnerPromoCode } from './promoEligibility.js'
import { personalPromoError } from './personalPromo.js'

function clientError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

export async function resolveManualOrderPromo(tx, { code, userId, subtotal, boundPartnerId = null, requestedPartnerId = null, excludeOrderId = null }) {
  const normalizedCode = String(code || '').trim().toUpperCase()
  if (!normalizedCode) return { promoCode: null, discountAmount: 0, partnerId: boundPartnerId || requestedPartnerId || null }
  if (normalizedCode.length > 100) throw clientError('Промокод слишком длинный')
  if (!userId) throw clientError('Для промокода выберите зарегистрированного клиента')

  const candidates = [...new Set([String(code).trim(), normalizedCode, String(code).trim().toLowerCase()])]
  let promoCode = await tx.promoCode.findFirst({ where: { OR: candidates.map(value => ({ code: value })) } })
  if (!promoCode) {
    const promoCodes = await tx.promoCode.findMany()
    promoCode = promoCodes.find(value => String(value.code || '').trim().toUpperCase() === normalizedCode)
  }
  if (!promoCode?.isActive) throw clientError('Промокод не найден или неактивен')
  const recipientError = personalPromoError(promoCode, userId)
  if (recipientError) throw clientError(recipientError)
  if (await isOwnPartnerPromoCode(tx, promoCode, userId)) throw clientError('Нельзя применить собственный партнёрский промокод')
  if (promoCode.partnerId && !await isActivePartner(tx, promoCode.partnerId)) throw clientError('Партнёр промокода неактивен')

  const now = new Date()
  if (promoCode.startDate && now < promoCode.startDate) throw clientError('Промокод ещё не активен')
  if (promoCode.endDate && now > promoCode.endDate) throw clientError('Срок действия промокода истёк')
  const activationLimit = promoCode.usageType === 'single' ? 1 : Number(promoCode.maxActivations || 0)
  if (activationLimit > 0 && promoCode.activationCount >= activationLimit) throw clientError('Промокод достиг лимита использований')
  if (promoCode.isFirstPurchase && await tx.order.count({ where: { userId, ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}) } }) > 0) throw clientError('Этот промокод только для первого заказа')
  if (Number(subtotal) < Number(promoCode.minOrderAmount || 0)) {
    throw clientError(`Минимальная сумма заказа для этого промокода: ${promoCode.minOrderAmount}`)
  }
  if (!Number.isFinite(Number(promoCode.discountValue)) || Number(promoCode.discountValue) < 0) {
    throw clientError('Некорректные настройки промокода')
  }

  let partnerId = boundPartnerId || requestedPartnerId || null
  if (promoCode.partnerId) {
    if (boundPartnerId && boundPartnerId !== promoCode.partnerId) {
      if (promoCode.isFirstPurchase) throw clientError('Клиент уже закреплён за другим партнёром')
    } else if (requestedPartnerId && requestedPartnerId !== promoCode.partnerId) {
      throw clientError('Выбранный партнёр не совпадает с партнёром промокода')
    } else {
      partnerId = promoCode.partnerId
    }
  }
  if (partnerId && !await isActivePartner(tx, partnerId)) throw clientError('Партнёр не найден или неактивен')

  const subtotalCents = Math.max(0, Math.round(Number(subtotal) * 100))
  const discountCents = promoCode.discountType === 'percentage'
    ? Math.round(subtotalCents * Number(promoCode.discountValue) / 100)
    : Math.round(Number(promoCode.discountValue) * 100)
  return {
    promoCode,
    discountAmount: Math.min(subtotalCents, Math.max(0, discountCents)) / 100,
    partnerId
  }
}

export async function claimManualOrderPromo(tx, promoCode) {
  if (!promoCode) return
  const activationLimit = promoCode.usageType === 'single' ? 1 : Number(promoCode.maxActivations || 0)
  const claimed = await tx.promoCode.updateMany({
    where: {
      id: promoCode.id,
      isActive: true,
      ...(promoCode.recipientUserId ? { recipientUserId: promoCode.recipientUserId } : {}),
      ...(activationLimit > 0 ? { activationCount: { lt: activationLimit } } : {})
    },
    data: { activationCount: { increment: 1 } }
  })
  if (claimed.count !== 1) throw clientError('Промокод достиг лимита использований', 409)
}
