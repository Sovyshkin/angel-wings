export async function isOwnPartnerPromoCode(prisma, promoCode, userId) {
  if (!promoCode?.partnerId || !userId) return false
  const partner = await prisma.partner.findUnique({
    where: { id: promoCode.partnerId },
    select: { userId: true }
  })
  return partner?.userId === userId
}
