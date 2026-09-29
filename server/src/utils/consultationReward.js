import { creditUserPoints, USER_POINT_TYPES } from './userPoints.js'

const CONSULTATION_REWARD_POINTS = 4000

function isSuccessfulOrder(order) {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  return Number.isInteger(Number(order?.id)) &&
    Number(order?.userId) > 0 &&
    ['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED', 'AUTHORIZED', 'CAPTURED', 'EXECUTED', 'SETTLED'].some(code => paymentStatus.includes(code))
}

// Payment for the consultation is agreed directly with the specialist. A
// consultation earns its reward only after an admin marks it completed and the
// account makes its first later successful purchase. The guarded update makes
// repeated payment webhooks safe: exactly one request can claim the reward.
export async function grantConsultationRewardsForPaidOrder(prisma, order) {
  if (!isSuccessfulOrder(order)) return { granted: 0 }

  const now = new Date()
  return prisma.$transaction(async (tx) => {
    const eligible = await tx.consultationRequest.findMany({
      where: {
        userId: Number(order.userId),
        status: 'DONE',
        completedAt: { lte: now },
        rewardGrantedAt: null
      },
      select: { id: true }
    })

    let granted = 0
    for (const consultation of eligible) {
      const claimed = await tx.consultationRequest.updateMany({
        where: { id: consultation.id, rewardGrantedAt: null },
        data: { rewardGrantedAt: now, rewardOrderId: Number(order.id) }
      })
      if (claimed.count !== 1) continue

      await creditUserPoints(tx, {
        userId: Number(order.userId),
        amount: CONSULTATION_REWARD_POINTS,
        type: USER_POINT_TYPES.CONSULTATION_REWARD,
        orderId: Number(order.id),
        message: `Возврат 4 000 баллов за консультацию #${consultation.id} после заказа #${order.id}`
      })
      granted += 1
    }

    return { granted, points: granted * CONSULTATION_REWARD_POINTS }
  })
}

export { CONSULTATION_REWARD_POINTS }
