// Keep the preview consistent with the server; checkout validates it again.
export function calculatePromoDiscount(subtotal, promoCode, userPointsUsed = 0) {
  const cents = value => Math.max(0, Math.round((Number(value) || 0) * 100))
  const base = Math.max(0, cents(subtotal) - cents(userPointsUsed))
  if (!promoCode || !base) return 0
  const discount = promoCode.discountType === 'percentage'
    ? Math.round(base * (Number(promoCode.discountValue) || 0) / 100)
    : cents(promoCode.discountValue)
  return Math.min(base, Math.max(0, discount)) / 100
}
