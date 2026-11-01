import { v4 as uuidv4 } from 'uuid'

export const USER_POINT_TYPES = {
  ADMIN_CREDIT: 'ADMIN_CREDIT',
  ADMIN_DEBIT: 'ADMIN_DEBIT',
  CONSULTATION_REWARD: 'CONSULTATION_REWARD',
  ORDER_SPEND: 'ORDER_SPEND',
  ORDER_REFUND: 'ORDER_REFUND'
}

export async function debitUserPointsByAdmin(tx, { userId, amount, reset = false, message = null, createdById = null }) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw Object.assign(new Error('Некорректный пользователь'), { status: 400 })
  }
  if (!reset && (!Number.isSafeInteger(amount) || amount <= 0)) {
    throw Object.assign(new Error('Укажите положительное целое количество баллов'), { status: 400 })
  }

  const now = new Date()
  const user = await tx.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } })
  if (!user) throw Object.assign(new Error('Пользователь не найден'), { status: 404 })
  if (reset) amount = user.pointsBalance
  if (amount <= 0) throw Object.assign(new Error('Баланс уже равен нулю'), { status: 400 })

  const offers = await tx.pointCampaignOffer.findMany({
    where: { userId, claimedAt: { not: null }, expiredAt: null, remainingPoints: { gt: 0 } },
    orderBy: { expiresAt: 'asc' },
    select: { id: true, expiresAt: true, remainingPoints: true }
  })
  const expiredPoints = offers.reduce((sum, offer) => sum + (offer.expiresAt && offer.expiresAt <= now ? offer.remainingPoints : 0), 0)
  if (!reset && user.pointsBalance - expiredPoints < amount) {
    throw Object.assign(new Error('Недостаточно действующих баллов для списания'), { status: 400 })
  }

  const updated = await tx.user.updateMany({
    where: { id: userId, pointsBalance: reset ? amount : { gte: amount } },
    data: { pointsBalance: { decrement: amount } }
  })
  if (updated.count !== 1) {
    throw Object.assign(new Error('Баланс изменился. Обновите страницу и повторите операцию'), { status: 409 })
  }

  // Ручное списание, как и оплата заказа, сначала расходует баллы с ближайшим сроком сгорания.
  let remaining = amount
  for (const offer of offers) {
    if (!reset && remaining <= 0) break
    if (!reset && (!offer.expiresAt || offer.expiresAt <= now)) continue
    const applied = reset ? offer.remainingPoints : Math.min(remaining, offer.remainingPoints)
    const changed = await tx.pointCampaignOffer.updateMany({
      where: { id: offer.id, expiredAt: null, remainingPoints: { gte: applied } },
      data: { remainingPoints: { decrement: applied } }
    })
    if (changed.count !== 1) {
      throw Object.assign(new Error('Баланс изменился. Обновите страницу и повторите операцию'), { status: 409 })
    }
    remaining -= applied
  }

  const balanceOwner = await tx.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } })
  await tx.userPointTransaction.create({
    data: {
      userId,
      amount: -amount,
      balanceAfter: balanceOwner.pointsBalance,
      type: USER_POINT_TYPES.ADMIN_DEBIT,
      message: normalizePointMessage(message) || (reset ? 'Обнуление баланса администратором' : 'Ручное списание администратором'),
      createdById
    }
  })
  return { amount, balance: balanceOwner.pointsBalance }
}

export function normalizePointAmount(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.floor(amount)
}

export function normalizePointMessage(value) {
  const message = String(value || '').trim()
  return message ? message.slice(0, 500) : null
}

export async function creditUserPoints(tx, { userId, amount, message = null, createdById = null, batchId = null, type = USER_POINT_TYPES.ADMIN_CREDIT, orderId = null }) {
  const normalizedAmount = normalizePointAmount(amount)
  if (!Number.isInteger(userId) || userId <= 0) {
    throw Object.assign(new Error('Некорректный пользователь'), { status: 400 })
  }
  if (normalizedAmount <= 0) {
    throw Object.assign(new Error('Укажите положительное количество баллов'), { status: 400 })
  }

  const user = await tx.user.update({
    where: { id: userId },
    data: { pointsBalance: { increment: normalizedAmount } },
    select: { id: true, pointsBalance: true }
  })

  await tx.userPointTransaction.create({
    data: {
      userId,
      amount: normalizedAmount,
      balanceAfter: user.pointsBalance,
      type,
      message: normalizePointMessage(message),
      createdById,
      batchId,
      orderId
    }
  })

  return user
}

export async function spendUserPoints(tx, { userId, amount, orderId = null }) {
  const normalizedAmount = normalizePointAmount(amount)
  if (normalizedAmount <= 0) return { spent: 0, balanceAfter: null }

  const now = new Date()
  const [balanceOwner, expiredOffers] = await Promise.all([
    tx.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } }),
    tx.pointCampaignOffer.findMany({
      where: { userId, claimedAt: { not: null }, expiresAt: { lte: now }, expiredAt: null, remainingPoints: { gt: 0 } },
      select: { remainingPoints: true }
    })
  ])
  const expiredPoints = expiredOffers.reduce((sum, offer) => sum + offer.remainingPoints, 0)
  if (!balanceOwner || balanceOwner.pointsBalance - expiredPoints < normalizedAmount) {
    throw Object.assign(new Error('Недостаточно действующих баллов для списания'), { status: 400 })
  }

  // Spend time-limited campaign points first so only genuinely unused points expire.
  let campaignRemainder = normalizedAmount
  const activeOffers = await tx.pointCampaignOffer.findMany({
    where: {
      userId,
      claimedAt: { not: null },
      expiresAt: { gt: now },
      expiredAt: null,
      remainingPoints: { gt: 0 }
    },
    orderBy: { expiresAt: 'asc' }
  })
  for (const offer of activeOffers) {
    if (campaignRemainder <= 0) break
    const applied = Math.min(campaignRemainder, offer.remainingPoints)
    await tx.pointCampaignOffer.update({
      where: { id: offer.id },
      data: { remainingPoints: { decrement: applied } }
    })
    if (orderId) {
      await tx.pointCampaignSpend.create({ data: { offerId: offer.id, orderId, amount: applied } })
    }
    campaignRemainder -= applied
  }

  const updateResult = await tx.user.updateMany({
    where: {
      id: userId,
      pointsBalance: { gte: normalizedAmount }
    },
    data: {
      pointsBalance: { decrement: normalizedAmount }
    }
  })

  if (updateResult.count !== 1) {
    throw Object.assign(new Error('Недостаточно баллов для списания'), { status: 400 })
  }

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true }
  })

  await tx.userPointTransaction.create({
    data: {
      userId,
      amount: -normalizedAmount,
      balanceAfter: user.pointsBalance,
      type: USER_POINT_TYPES.ORDER_SPEND,
      message: orderId ? `Списание в заказе #${orderId}` : 'Списание в заказе',
      orderId
    }
  })

  return { spent: normalizedAmount, balanceAfter: user.pointsBalance }
}

export async function refundUserPointsForOrder(tx, { order, createdById = null }) {
  const userId = Number(order?.userId || 0)
  const amount = normalizePointAmount(order?.userPointsUsed)
  const orderId = Number(order?.id || 0)

  if (!Number.isInteger(userId) || userId <= 0 || amount <= 0 || !Number.isInteger(orderId) || orderId <= 0) {
    return { refunded: 0, balanceAfter: null }
  }

  const existingRefund = await tx.userPointTransaction.findFirst({
    where: {
      userId,
      orderId,
      type: USER_POINT_TYPES.ORDER_REFUND
    },
    select: { id: true }
  })

  if (existingRefund) {
    return { refunded: 0, alreadyRefunded: true }
  }

  const campaignSpends = await tx.pointCampaignSpend.findMany({
    where: { orderId },
    include: { offer: true }
  })
  const now = new Date()
  let expiredCampaignSpend = 0
  for (const spend of campaignSpends) {
    if (spend.offer.claimedAt && !spend.offer.expiredAt && spend.offer.expiresAt > now) {
      await tx.pointCampaignOffer.update({
        where: { id: spend.offerId },
        data: { remainingPoints: { increment: spend.amount } }
      })
    } else {
      expiredCampaignSpend += spend.amount
    }
  }

  // A late refund must not turn expired promotional points into permanent balance.
  const refundableAmount = Math.max(0, amount - expiredCampaignSpend)
  if (refundableAmount === 0) return { refunded: 0, expiredCampaignSpend }

  const user = await tx.user.update({
    where: { id: userId },
    data: { pointsBalance: { increment: refundableAmount } },
    select: { pointsBalance: true }
  })

  await tx.userPointTransaction.create({
    data: {
      userId,
      amount: refundableAmount,
      balanceAfter: user.pointsBalance,
      type: USER_POINT_TYPES.ORDER_REFUND,
      message: `Возврат баллов по заказу #${orderId}`,
      orderId,
      createdById
    }
  })

  return { refunded: refundableAmount, balanceAfter: user.pointsBalance, expiredCampaignSpend }
}

export function createPointBatchId() {
  return uuidv4()
}
