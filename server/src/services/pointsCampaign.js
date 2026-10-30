import { creditUserPoints } from '../utils/userPoints.js'

export const POINTS_CAMPAIGN_KEY = 'points-4000-2026-10-30'
export const POINTS_CAMPAIGN_AMOUNT = 4000

export function oneCalendarMonthAfter(date) {
  const result = new Date(date)
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + 1)
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}

export async function claimPointsCampaignOffer(db, userId, now = new Date()) {
  return db.$transaction(async (tx) => {
    const offer = await tx.pointCampaignOffer.findUnique({
      where: { campaignKey_userId: { campaignKey: POINTS_CAMPAIGN_KEY, userId } }
    })
    if (!offer) throw Object.assign(new Error('Предложение не найдено'), { status: 404 })
    if (offer.claimedAt) {
      return { alreadyClaimed: true, amount: offer.amount, expiresAt: offer.expiresAt }
    }

    const expiresAt = oneCalendarMonthAfter(now)
    const reserved = await tx.pointCampaignOffer.updateMany({
      where: { id: offer.id, claimedAt: null },
      data: { claimedAt: now, expiresAt, remainingPoints: offer.amount }
    })
    if (reserved.count !== 1) {
      throw Object.assign(new Error('Предложение уже получено'), { status: 409 })
    }

    const user = await creditUserPoints(tx, {
      userId,
      amount: offer.amount,
      batchId: POINTS_CAMPAIGN_KEY,
      message: `Подарок Angel Wings: ${offer.amount.toLocaleString('ru-RU')} баллов. Действуют до ${expiresAt.toLocaleDateString('ru-RU', { timeZone: 'UTC' })}`
    })
    return { alreadyClaimed: false, amount: offer.amount, expiresAt, balance: user.pointsBalance }
  })
}

export async function expireDuePointsCampaignOffers(db, now = new Date()) {
  const due = await db.pointCampaignOffer.findMany({
    where: { claimedAt: { not: null }, expiresAt: { lte: now }, expiredAt: null },
    select: { id: true }
  })
  let expired = 0
  for (const { id } of due) {
    await db.$transaction(async (tx) => {
      const offer = await tx.pointCampaignOffer.findUnique({ where: { id } })
      if (!offer || offer.expiredAt || !offer.claimedAt || !offer.expiresAt || offer.expiresAt > now) return
      const remaining = Math.max(0, offer.remainingPoints)
      const user = await tx.user.findUnique({ where: { id: offer.userId }, select: { pointsBalance: true } })
      const amount = Math.min(remaining, Math.max(0, Number(user?.pointsBalance || 0)))
      const changed = await tx.pointCampaignOffer.updateMany({
        where: { id, expiredAt: null },
        data: { expiredAt: now, remainingPoints: 0 }
      })
      if (changed.count !== 1) return
      if (amount > 0) {
        const updated = await tx.user.update({
          where: { id: offer.userId },
          data: { pointsBalance: { decrement: amount } },
          select: { pointsBalance: true }
        })
        await tx.userPointTransaction.create({
          data: {
            userId: offer.userId,
            amount: -amount,
            balanceAfter: updated.pointsBalance,
            type: 'CAMPAIGN_EXPIRE',
            batchId: offer.campaignKey,
            message: 'Срок действия подарочных баллов истёк'
          }
        })
      }
      expired += 1
    })
  }
  return expired
}
