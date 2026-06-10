export async function calculatePartnerBalance(prismaLike, partnerId) {
  const safePartnerId = Number(partnerId)
  if (!Number.isFinite(safePartnerId)) {
    return {
      totalEarned: 0,
      totalPaidOut: 0,
      pendingPayouts: 0,
      totalSpentOnOrders: 0,
      availableBalance: 0
    }
  }

  const [
    commissionsAgg,
    paidOutAgg,
    pendingPayoutsAgg,
    spentOnOrdersAgg
  ] = await Promise.all([
    prismaLike.partnerCommission.aggregate({
      where: { partnerId: safePartnerId },
      _sum: { amount: true }
    }),
    prismaLike.partnerPayment.aggregate({
      where: {
        partnerId: safePartnerId,
        status: { in: ['PAID', 'PAYOUT_APPROVED'] }
      },
      _sum: { amount: true }
    }),
    prismaLike.partnerPayment.aggregate({
      where: {
        partnerId: safePartnerId,
        status: { in: ['PENDING', 'PAYOUT_REQUESTED'] }
      },
      _sum: { amount: true }
    }),
    prismaLike.partnerPayment.aggregate({
      where: {
        partnerId: safePartnerId,
        status: 'SPENT_ON_ORDER'
      },
      _sum: { amount: true }
    })
  ])

  const totalEarned = Number(commissionsAgg?._sum?.amount || 0)
  const totalPaidOut = Number(paidOutAgg?._sum?.amount || 0)
  const pendingPayouts = Number(pendingPayoutsAgg?._sum?.amount || 0)
  const totalSpentOnOrders = Number(spentOnOrdersAgg?._sum?.amount || 0)
  const availableBalance = Math.max(0, totalEarned - totalPaidOut - pendingPayouts - totalSpentOnOrders)

  return {
    totalEarned,
    totalPaidOut,
    pendingPayouts,
    totalSpentOnOrders,
    availableBalance
  }
}
