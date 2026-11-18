import { getAcquiringEstimate } from './paymentAcquiring.js'
import { getBilledOrderTotal } from './orderEditAmounts.js'
import { getOrderItemUnitCost } from './productCost.js'

export const PARTNER_REPORT_TAX_RATE = 0.11412

export function getReportOrderWhere(includeAllOrders, promoCodeIds = []) {
  if (includeAllOrders) return {}
  return {
    OR: [
      { partnerId: { not: null } },
      { commission: { isNot: null } },
      { promoCodeId: { in: promoCodeIds } }
    ]
  }
}

export function getReportPartnerName(partner, partnerId) {
  return partner?.user?.name || (partnerId ? `Партнёр #${partnerId}` : 'Без партнёра')
}

const toCents = value => Math.round((Number(value) || 0) * 100)
const fromCents = value => value / 100

function distributeCents(totalCents, weights) {
  if (!weights.length) return []
  const sign = totalCents < 0 ? -1 : 1
  const total = Math.abs(totalCents)
  const safeWeights = weights.map(weight => Math.max(0, Math.round(weight)))
  const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0)
  const shares = safeWeights.map(weight => total * (weightSum ? weight / weightSum : 1 / weights.length))
  const allocated = shares.map(Math.floor)
  let remainder = total - allocated.reduce((sum, value) => sum + value, 0)
  const byFraction = shares.map((share, index) => ({ index, fraction: share - allocated[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of byFraction) {
    if (remainder-- <= 0) break
    allocated[index]++
  }
  return allocated.map(value => sign * value)
}

export function allocateOrderItems(order) {
  const items = order.items || []
  const grossCents = items.map(item => toCents(item.price) * Math.max(0, Number(item.quantity) || 0))
  const subtotal = grossCents.reduce((sum, value) => sum + value, 0)
  const discount = Math.min(subtotal, Math.max(0, toCents(order.discountAmount)))
  let discounts = distributeCents(discount, grossCents)
  const manualGross = grossCents.reduce((sum, value, index) => sum + (items[index].adminUnbilled ? value : 0), 0)
  const regularGross = subtotal - manualGross
  const externalAmount = Math.max(0, toCents(order.total) - toCents(getBilledOrderTotal(order)))
  const manualDiscount = manualGross - externalAmount
  if (manualGross && regularGross && externalAmount > 0 && manualDiscount >= 0 &&
      manualDiscount <= manualGross && manualDiscount <= discount && discount - manualDiscount <= regularGross) {
    const regularShares = distributeCents(discount - manualDiscount, grossCents.map((value, index) => items[index].adminUnbilled ? 0 : value))
    const manualShares = distributeCents(manualDiscount, grossCents.map((value, index) => items[index].adminUnbilled ? value : 0))
    discounts = regularShares.map((value, index) => value + manualShares[index])
  }

  return items.map((item, index) => {
    const itemDiscount = discounts[index]
    const unitCost = toCents(getOrderItemUnitCost(item))
    const cost = unitCost * Math.max(0, Number(item.quantity) || 0)
    return {
      item,
      gross: fromCents(grossCents[index]),
      discount: fromCents(itemDiscount),
      net: fromCents(grossCents[index] - itemDiscount),
      unitCost: fromCents(unitCost),
      cost: fromCents(cost)
    }
  })
}

export function getOrderProductCost(order) {
  return fromCents(allocateOrderItems(order).reduce((sum, line) => sum + toCents(line.cost), 0))
}

export function allocateOrderFinancials(order, amounts) {
  const items = allocateOrderItems(order)
  const weights = items.map(line => toCents(line.net))
  const regularWeights = items.map(line => line.item.adminUnbilled ? 0 : toCents(line.net))
  const siteWeights = items.some(line => !line.item.adminUnbilled)
    ? regularWeights.some(Boolean) ? regularWeights : items.map(line => line.item.adminUnbilled ? 0 : 1)
    : weights
  const externalWeights = items.map(line => line.item.adminUnbilled ? toCents(line.net) : 0)
  const sitePaid = distributeCents(toCents(amounts.siteRevenue ?? amounts.revenue), siteWeights)
  const externalPaid = distributeCents(toCents(amounts.externalRevenue), externalWeights)
  const paid = sitePaid.map((value, index) => value + externalPaid[index])
  const tax = distributeCents(toCents(amounts.tax), paid)
  const acquiring = distributeCents(toCents(amounts.acquiring), sitePaid)
  const commission = distributeCents(toCents(amounts.revenue ? order.commission?.amount : 0), paid)
  const isPaid = String(order.paymentStatus || '').toUpperCase() === 'PAID'

  return items.map((line, index) => {
    const balanceCents = paid[index] - tax[index] - acquiring[index] - commission[index]
    return {
      ...line,
      paid: fromCents(paid[index]),
      sitePaid: fromCents(sitePaid[index]),
      externalPaid: fromCents(externalPaid[index]),
      tax: fromCents(tax[index]),
      acquiring: fromCents(acquiring[index]),
      commission: fromCents(commission[index]),
      balance: fromCents(balanceCents),
      profit: isPaid ? fromCents(balanceCents - toCents(line.cost)) : null
    }
  })
}

export function getOrderReportAmounts(order, acquiringSettings) {
  const paid = String(order.paymentStatus || '').toUpperCase() === 'PAID'
  const orderCents = Math.max(0, toCents(order.total))
  const siteRevenueCents = paid ? Math.min(orderCents, Math.max(0, toCents(getBilledOrderTotal(order)))) : 0
  const manualNetCents = allocateOrderItems(order).reduce((sum, line) =>
    sum + (line.item.adminUnbilled ? toCents(line.net) : 0), 0)
  const externalRevenueCents = paid
    ? Math.min(Math.max(0, orderCents - siteRevenueCents), manualNetCents)
    : 0
  const revenueCents = siteRevenueCents + externalRevenueCents
  const siteRevenue = fromCents(siteRevenueCents)
  const externalRevenue = fromCents(externalRevenueCents)
  const revenue = fromCents(revenueCents)
  const tax = fromCents(Math.round(revenueCents * PARTNER_REPORT_TAX_RATE))
  const estimate = getAcquiringEstimate(order, acquiringSettings)
  const acquiring = siteRevenueCents ? estimate.amount : 0
  const acquiringSource = siteRevenueCents ? estimate.source
    : externalRevenueCents ? 'Вне сайта — эквайринг 0 ₽' : estimate.source
  return { revenue, siteRevenue, externalRevenue, tax, acquiring, acquiringSource, balance: fromCents(revenueCents - toCents(tax) - toCents(acquiring)) }
}

export function formatOrderComposition(items = []) {
  const money = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(value || 0))
  return items.length
    ? items.map(item => `${item.title} — ${item.quantity} шт. × ${money(item.price)} ₽ = ${money(item.gross)} ₽${item.discount ? ` (после скидки ${money(item.net)} ₽)` : ''}`).join('\n')
    : 'Нет позиций'
}
