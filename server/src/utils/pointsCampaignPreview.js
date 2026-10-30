const CUSTOMER_ROLES = new Set(['USER', 'PARTNER'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeCampaignEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function hasDeliverableCampaignEmail(user) {
  const email = normalizeCampaignEmail(user.email)
  return Boolean(
    EMAIL_PATTERN.test(email) &&
    !email.endsWith('.invalid') &&
    user.emailVerified &&
    user.marketingConsentAt &&
    !user.marketingUnsubscribedAt
  )
}

export function hasTelegramCampaignId(user) {
  return /^[1-9]\d*$/.test(String(user.telegramId || '').trim())
}

export function buildPointsCampaignPreview(users, orders, now = new Date()) {
  const since = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
  const ordersByUserId = new Map()
  const ordersByEmail = new Map()

  for (const order of orders) {
    if (order.createdAt < since || order.createdAt > now) continue
    if (order.paymentStatus !== 'PAID' || ['CANCELLED', 'RETURNED'].includes(order.status)) continue

    if (order.userId != null) {
      if (!ordersByUserId.has(order.userId)) ordersByUserId.set(order.userId, new Set())
      ordersByUserId.get(order.userId).add(order.id)
    }

    const email = normalizeCampaignEmail(order.customerEmail)
    if (email) {
      if (!ordersByEmail.has(email)) ordersByEmail.set(email, new Set())
      ordersByEmail.get(email).add(order.id)
    }
  }

  const result = {
    generatedAt: now.toISOString(),
    periodStart: since.toISOString(),
    periodEnd: now.toISOString(),
    rules: {
      maximumPaidPurchases: 1,
      purchaseDateField: 'order.createdAt',
      eligibleRoles: [...CUSTOMER_ROLES],
      excludedOrderStatuses: ['CANCELLED', 'RETURNED'],
      emailRequiresVerifiedAddressAndMarketingConsent: true
    },
    accountsChecked: users.length,
    excludedStaffOrDeleted: 0,
    excludedWithTwoOrMorePurchases: 0,
    eligibleAccounts: 0,
    plannedPointsAt4000Each: 0,
    eligibleWithZeroPurchases: 0,
    eligibleWithOnePurchase: 0,
    siteNotificationCandidates: 0,
    emailCandidates: 0,
    telegramCandidates: 0,
    telegramWithMarketingConsent: 0,
    emailAndTelegramCandidates: 0,
    emailOnlyCandidates: 0,
    telegramOnlyCandidates: 0,
    noOutboundChannelCandidates: 0,
    emailSkippedInvalidOrUnverified: 0,
    emailSkippedNoConsent: 0,
    telegramSkippedNoId: 0,
    telegramSkippedUnsubscribed: 0
  }

  const uniqueEmails = new Set()
  const uniqueTelegramIds = new Set()

  for (const user of users) {
    if (!CUSTOMER_ROLES.has(user.role)) {
      result.excludedStaffOrDeleted += 1
      continue
    }

    const email = normalizeCampaignEmail(user.email)
    const matchingOrderIds = new Set([
      ...(ordersByUserId.get(user.id) || []),
      ...(ordersByEmail.get(email) || [])
    ])
    if (matchingOrderIds.size > 1) {
      result.excludedWithTwoOrMorePurchases += 1
      continue
    }

    result.eligibleAccounts += 1
    result.plannedPointsAt4000Each += 4000
    result.siteNotificationCandidates += 1
    if (matchingOrderIds.size === 0) result.eligibleWithZeroPurchases += 1
    else result.eligibleWithOnePurchase += 1

    const emailValid = EMAIL_PATTERN.test(email) && !email.endsWith('.invalid') && user.emailVerified
    if (!emailValid) result.emailSkippedInvalidOrUnverified += 1
    else if (!user.marketingConsentAt || user.marketingUnsubscribedAt) result.emailSkippedNoConsent += 1

    const canEmail = hasDeliverableCampaignEmail(user) && !uniqueEmails.has(email)
    if (canEmail) {
      uniqueEmails.add(email)
      result.emailCandidates += 1
    }

    const telegramId = String(user.telegramId || '').trim()
    if (!hasTelegramCampaignId(user)) result.telegramSkippedNoId += 1
    else if (user.marketingUnsubscribedAt) result.telegramSkippedUnsubscribed += 1

    const canTelegram = hasTelegramCampaignId(user) && !user.marketingUnsubscribedAt && !uniqueTelegramIds.has(telegramId)
    if (canTelegram) {
      uniqueTelegramIds.add(telegramId)
      result.telegramCandidates += 1
      if (user.marketingConsentAt) result.telegramWithMarketingConsent += 1
    }

    if (canEmail && canTelegram) result.emailAndTelegramCandidates += 1
    else if (canEmail) result.emailOnlyCandidates += 1
    else if (canTelegram) result.telegramOnlyCandidates += 1
    else result.noOutboundChannelCandidates += 1
  }

  return result
}
