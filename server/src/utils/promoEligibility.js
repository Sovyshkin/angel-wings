export async function isOwnPartnerPromoCode(prisma, promoCode, userId) {
  if (!promoCode?.partnerId || !userId) return false
  const partner = await prisma.partner.findUnique({
    where: { id: promoCode.partnerId },
    select: { userId: true }
  })
  return partner?.userId === userId
}

export async function isActivePartner(prisma, partnerId) {
  if (!partnerId) return true
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { isActive: true, archivedAt: true, user: { select: { role: true } } }
  })
  return Boolean(partner?.isActive && !partner.archivedAt && partner.user?.role !== 'DELETED')
}

export async function isRetiredPartner(prisma, partnerId) {
  if (!partnerId) return false
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { archivedAt: true, user: { select: { role: true } } }
  })
  return !partner || Boolean(partner.archivedAt || partner.user?.role === 'DELETED')
}
