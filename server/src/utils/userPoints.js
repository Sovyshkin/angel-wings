import { v4 as uuidv4 } from 'uuid'

export const USER_POINT_TYPES = {
  ADMIN_CREDIT: 'ADMIN_CREDIT',
  ORDER_SPEND: 'ORDER_SPEND',
  ORDER_REFUND: 'ORDER_REFUND'
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

export async function creditUserPoints(tx, { userId, amount, message = null, createdById = null, batchId = null }) {
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
      type: USER_POINT_TYPES.ADMIN_CREDIT,
      message: normalizePointMessage(message),
      createdById,
      batchId
    }
  })

  return user
}

export async function spendUserPoints(tx, { userId, amount, orderId = null }) {
  const normalizedAmount = normalizePointAmount(amount)
  if (normalizedAmount <= 0) return { spent: 0, balanceAfter: null }

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

  const user = await tx.user.update({
    where: { id: userId },
    data: { pointsBalance: { increment: amount } },
    select: { pointsBalance: true }
  })

  await tx.userPointTransaction.create({
    data: {
      userId,
      amount,
      balanceAfter: user.pointsBalance,
      type: USER_POINT_TYPES.ORDER_REFUND,
      message: `Возврат баллов по заказу #${orderId}`,
      orderId,
      createdById
    }
  })

  return { refunded: amount, balanceAfter: user.pointsBalance }
}

export function createPointBatchId() {
  return uuidv4()
}
