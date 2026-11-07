export function getBilledOrderTotal(order) {
  return (Math.round(Number(order?.total || 0) * 100) - Math.round(Number(order?.unbilledAdjustment || 0) * 100)) / 100
}

export function calculateEditedOrderDiscount({ previousItems, nextItems, previousDiscountAmount, partnerBonusAmount = 0, userPointsUsed = 0, promoCode }) {
  if (!promoCode) return Number(previousDiscountAmount || 0)

  const subtotalCents = items => items.reduce((sum, item) => sum + Math.round(Number(item.price) * 100) * Number(item.quantity), 0)
  const oldSubtotalCents = subtotalCents(previousItems)
  const nextSubtotalCents = subtotalCents(nextItems)
  const oldDiscountCents = Math.round(Number(previousDiscountAmount || 0) * 100)
  const otherDiscountCents = Math.round(Number(partnerBonusAmount || 0) * 100) + Math.round(Number(userPointsUsed || 0) * 100)
  const oldPromoCents = Math.max(0, oldDiscountCents - otherDiscountCents)
  const pointsCents = Math.round(Number(userPointsUsed || 0) * 100)
  const oldPromoBaseCents = Math.max(0, oldSubtotalCents - pointsCents)
  const nextPromoBaseCents = Math.max(0, nextSubtotalCents - pointsCents)

  let nextPromoCents = oldPromoCents
  if (promoCode.discountType === 'percentage') {
    const rate = Number(promoCode.discountValue)
    const oldCalculatedCents = Math.round(oldPromoBaseCents * rate / 100)
    const nextCalculatedCents = Math.round(nextPromoBaseCents * rate / 100)
    // Adjust only the changed merchandise. The original paid discount stays intact,
    // even if the promo's rate was edited after the order was placed.
    nextPromoCents += nextCalculatedCents - oldCalculatedCents
  } else if (oldPromoCents >= oldPromoBaseCents) {
    // A fixed coupon that was capped by the original subtotal may use its
    // remaining value when merchandise is added; it is still one activation.
    nextPromoCents = Math.max(oldPromoCents, Math.min(nextPromoBaseCents, Math.round(Number(promoCode.discountValue) * 100)))
  }

  nextPromoCents = Math.min(nextPromoBaseCents, Math.max(0, nextPromoCents))
  return (otherDiscountCents + nextPromoCents) / 100
}

export function calculateOrderEditAmounts({ items, deliveryPrice, deliveryTariffCode, deliveryPickupPoint, discountAmount, financialLocked, previousTotal, previousUnbilledAdjustment = 0 }) {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(Number(item.price) * 100) * Number(item.quantity), 0)
  const deliveryCents = deliveryTariffCode || deliveryPickupPoint ? 0 : Math.round(Number(deliveryPrice || 0) * 100)
  const discountCents = Math.round(Number(discountAmount || 0) * 100)
  if (subtotalCents + deliveryCents < discountCents) return null

  const total = (subtotalCents + deliveryCents - discountCents) / 100
  return {
    total,
    unbilledAdjustment: financialLocked
      ? (Math.round(Number(previousUnbilledAdjustment || 0) * 100) + Math.round((total - previousTotal) * 100)) / 100
      : 0,
    ...(!financialLocked ? { paymentAmount: total } : {})
  }
}
