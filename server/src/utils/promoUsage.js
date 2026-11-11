// A cancelled order releases its promo use, while a pending or paid order
// reserves the code for that customer.
export async function hasUserUsedSinglePromo(db, promoCodeId, userId, excludeOrderId = null) {
  if (!userId) return false
  return (await db.order.count({
    where: {
      promoCodeId,
      userId,
      status: { not: 'CANCELLED' },
      ...(excludeOrderId ? { id: { not: excludeOrderId } } : {})
    }
  })) > 0
}
