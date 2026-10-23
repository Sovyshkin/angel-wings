export function getBilledOrderTotal(order) {
  return (Math.round(Number(order?.total || 0) * 100) - Math.round(Number(order?.unbilledAdjustment || 0) * 100)) / 100
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
