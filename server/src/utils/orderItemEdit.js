function chargedItemCounts(items) {
  const counts = new Map()
  for (const item of items) {
    const priceKopecks = Math.round(Number(item.price) * 100)
    if (priceKopecks === 0) continue
    const key = JSON.stringify([Number(item.productId), String(item.dosage || '').trim(), Number(item.quantity), priceKopecks])
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

// Once a payment has been created, its paid lines must remain exactly as invoiced.
// Free additions/removals do not change the amount, while stock still changes.
export function chargedOrderItemsUnchanged(previousItems, nextItems) {
  const previous = chargedItemCounts(previousItems)
  const next = chargedItemCounts(nextItems)
  return previous.size === next.size && [...previous].every(([key, count]) => next.get(key) === count)
}
