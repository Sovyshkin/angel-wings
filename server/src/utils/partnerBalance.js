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
    adminCreditsAgg,
    paidOutAgg,
    pendingPayoutsAgg,
    spentOnOrdersAgg
  ] = await Promise.all([
    prismaLike.partnerCommission.aggregate({
      where: {
        partnerId: safePartnerId,
        order: { paymentStatus: 'PAID' }
      },
      _sum: { amount: true }
    }),
    prismaLike.partnerPayment.aggregate({
      where: {
        partnerId: safePartnerId,
        type: 'ADMIN_CREDIT',
        status: { in: ['PAID', 'COMPLETED', 'ADMIN_CREDITED'] }
      },
      _sum: { amount: true }
    }),
    prismaLike.partnerPayment.aggregate({
      where: {
        partnerId: safePartnerId,
        type: 'PAYOUT',
        status: { in: ['PAID', 'PAYOUT_APPROVED'] }
      },
      _sum: { amount: true }
    }),
    prismaLike.partnerPayment.aggregate({
      where: {
        partnerId: safePartnerId,
        type: 'PAYOUT',
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

  const totalCommissions = Number(commissionsAgg?._sum?.amount || 0)
  const adminCredits = Number(adminCreditsAgg?._sum?.amount || 0)
  const totalEarned = totalCommissions + adminCredits
  const totalPaidOut = Number(paidOutAgg?._sum?.amount || 0)
  const pendingPayouts = Number(pendingPayoutsAgg?._sum?.amount || 0)
  const totalSpentOnOrders = Number(spentOnOrdersAgg?._sum?.amount || 0)
  const availableBalance = Math.max(0, totalEarned - totalPaidOut - pendingPayouts - totalSpentOnOrders)

  return {
    totalEarned,
    totalCommissions,
    adminCredits,
    totalPaidOut,
    pendingPayouts,
    totalSpentOnOrders,
    availableBalance
  }
}
