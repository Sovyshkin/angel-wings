async function unrefundedCampaignSpend(tx, offer) {
  const spends = await tx.pointCampaignSpend.findMany({
    where: { offerId: offer.id }, select: { amount: true, orderId: true }
  })
  if (!spends.length) return 0
  const refunds = await tx.userPointTransaction.findMany({
    where: { orderId: { in: spends.map(spend => spend.orderId) }, type: 'ORDER_REFUND' },
    select: { orderId: true, createdAt: true }
  })
  // A refund restores campaign points only while that offer is still active.
  const restoredOrders = new Set(refunds.filter(refund =>
    offer.expiresAt && refund.createdAt < offer.expiresAt &&
    (!offer.expiredAt || refund.createdAt < offer.expiredAt)
  ).map(refund => refund.orderId))
  return spends.reduce((sum, spend) => sum + (restoredOrders.has(spend.orderId) ? 0 : spend.amount), 0)
}

// A verified email is required before any Telegram account can be merged into
// another customer account. Keep the old row for audit; its session is revoked
// by the DELETED role and its Telegram ID moves to the canonical account.
export async function linkTelegramAccount(prisma, { sourceId, targetId, telegramId, email, name, photoUrl, verificationId }) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.emailVerificationCode.updateMany({
      where: { id: verificationId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() }
    })
    if (claimed.count !== 1) throw new Error('Код уже использован или истёк.')
    const source = await tx.user.findUnique({ where: { id: sourceId }, include: { partner: true, partnerUser: true } })
    const target = await tx.user.findUnique({ where: { id: targetId }, include: { partnerUser: true } })
    if (!source || !target || source.telegramId !== telegramId || source.role === 'DELETED' ||
        target.role === 'DELETED' || (target.role !== 'USER' && target.role !== 'PARTNER')) {
      throw new Error('Аккаунт изменился. Откройте мини-приложение заново.')
    }
    if (target.telegramId && target.telegramId !== telegramId) {
      throw new Error('Эта почта уже связана с другим Telegram-аккаунтом.')
    }

    if (source.id === target.id) {
      return tx.user.update({
        where: { id: source.id },
        data: { email, emailVerified: true, name: source.name || name, telegramPhotoUrl: photoUrl || source.telegramPhotoUrl || null }
      })
    }

    if (source.role !== 'USER' || source.partner || (source.partnerUser && target.partnerUser)) {
      throw new Error('Для объединения этих аккаунтов обратитесь в поддержку.')
    }
    const sourceOffers = await tx.pointCampaignOffer.findMany({ where: { userId: source.id } })
    const targetOffers = await tx.pointCampaignOffer.findMany({ where: { userId: target.id } })
    const targetOffersByKey = new Map(targetOffers.map(offer => [offer.campaignKey, offer]))
    const archivedCampaignKeys = []
    let withheldSourceCampaignPoints = 0
    let targetCampaignReduction = 0

    for (const sourceOffer of sourceOffers) {
      const targetOffer = targetOffersByKey.get(sourceOffer.campaignKey)
      if (!targetOffer) continue

      if (sourceOffer.claimedAt && !targetOffer.claimedAt) {
        // Keep the already claimed offer, including its expiry and order spends.
        await tx.pointCampaignOffer.delete({ where: { id: targetOffer.id } })
        continue
      }
      if (!sourceOffer.claimedAt) {
        // Neither account can claim the same campaign a second time after linking.
        await tx.pointCampaignOffer.delete({ where: { id: sourceOffer.id } })
        continue
      }

      // Both offers were claimed. The site's offer remains canonical. The
      // Telegram offer stays on the archived account for the audit trail, but
      // its unspent points are removed from the amount transferred below.
      archivedCampaignKeys.push(sourceOffer.campaignKey)
      const sourceRemainder = Math.max(0, Number(sourceOffer.remainingPoints || 0))
      withheldSourceCampaignPoints += sourceRemainder
      const sourceSpent = await unrefundedCampaignSpend(tx, sourceOffer)
      const targetSpent = await unrefundedCampaignSpend(tx, targetOffer)
      if (sourceSpent + targetSpent > targetOffer.amount) {
        throw new Error('Подарочные баллы уже списаны на обоих аккаунтах сверх лимита акции. Для объединения обратитесь в поддержку.')
      }
      if (targetOffer.expiredAt && sourceRemainder > 0) {
        throw new Error('Сроки подарочных баллов на аккаунтах различаются. Для объединения обратитесь в поддержку.')
      }
      const allowedRemainder = Math.max(0, targetOffer.amount - sourceSpent - targetSpent)
      const reduction = Math.max(0, targetOffer.remainingPoints - allowedRemainder)
      if (reduction) {
        await tx.pointCampaignOffer.update({ where: { id: targetOffer.id }, data: { remainingPoints: { decrement: reduction } } })
        targetCampaignReduction += reduction
      }
      await tx.pointCampaignOffer.update({
        where: { id: sourceOffer.id },
        data: { remainingPoints: 0, expiredAt: sourceOffer.expiredAt || new Date() }
      })
    }
    if (withheldSourceCampaignPoints > source.pointsBalance || targetCampaignReduction > target.pointsBalance) {
      throw new Error('Баланс подарочных баллов изменился. Для объединения обратитесь в поддержку.')
    }

    await tx.order.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
    await tx.partnerCommission.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
    await tx.consultationRequest.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
    await tx.partnerApplication.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
    await tx.productAnalyticsEvent.updateMany({ where: { userId: source.id }, data: { userId: target.id } })
    await tx.promoCode.updateMany({ where: { recipientUserId: source.id }, data: { recipientUserId: target.id } })
    await tx.pointCampaignOffer.updateMany({
      where: { userId: source.id, campaignKey: { notIn: archivedCampaignKeys } },
      data: { userId: target.id }
    })
    if (source.partnerUser) {
      await tx.partnerUser.update({ where: { id: source.partnerUser.id }, data: { userId: target.id } })
    }

    const targetPickupCodes = new Set((await tx.favoritePickupPoint.findMany({
      where: { userId: target.id }, select: { code: true }
    })).map(point => point.code))
    const sourcePickups = await tx.favoritePickupPoint.findMany({ where: { userId: source.id }, select: { id: true, code: true } })
    for (const point of sourcePickups) {
      if (!targetPickupCodes.has(point.code)) {
        await tx.favoritePickupPoint.update({ where: { id: point.id }, data: { userId: target.id } })
      }
    }

    const sourceCart = await tx.recoveryCart.findUnique({ where: { userId: source.id } })
    if (sourceCart && !await tx.recoveryCart.findUnique({ where: { userId: target.id } })) {
      await tx.recoveryCart.update({ where: { id: sourceCart.id }, data: { userId: target.id } })
    } else if (sourceCart) {
      await tx.recoveryCart.update({ where: { id: sourceCart.id }, data: { active: false } })
    }

    if (targetCampaignReduction) {
      const updated = await tx.user.update({ where: { id: target.id }, data: { pointsBalance: { decrement: targetCampaignReduction } } })
      await tx.userPointTransaction.create({ data: {
        userId: target.id, amount: -targetCampaignReduction, balanceAfter: updated.pointsBalance,
        type: 'CAMPAIGN_MERGE_DEDUP', message: 'Один подарок по акции на объединённый аккаунт'
      } })
    }
    const transfer = Math.max(0, Number(source.pointsBalance || 0) - withheldSourceCampaignPoints)
    if (transfer) {
      const updated = await tx.user.update({ where: { id: target.id }, data: { pointsBalance: { increment: transfer } } })
      await tx.userPointTransaction.create({ data: {
        userId: target.id, amount: transfer, balanceAfter: updated.pointsBalance,
        type: 'ACCOUNT_MERGE', message: `Перенос баллов из Telegram-аккаунта #${source.id}`
      } })
    }
    await tx.user.update({ where: { id: source.id }, data: { role: 'DELETED', telegramId: null, pointsBalance: 0 } })
    return tx.user.update({
      where: { id: target.id },
      data: { telegramId, telegramPhotoUrl: photoUrl || source.telegramPhotoUrl || target.telegramPhotoUrl || null, emailVerified: true }
    })
  })
}
