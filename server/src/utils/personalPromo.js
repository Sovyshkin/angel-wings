export function personalPromoError(promoCode, userId) {
  if (promoCode?.recipientUserId && Number(promoCode.recipientUserId) !== Number(userId)) {
    return 'Этот промокод предназначен другому клиенту'
  }
  return null
}
