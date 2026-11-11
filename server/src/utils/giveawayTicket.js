import { randomBytes } from 'node:crypto'

export const GIVEAWAY_MARKER = 'Кампания: Розыгрыш 50 000 ₽'
export const TICKET_STORAGE_FORMAT = /^AW-(?:[A-F0-9]{4}-){3}[A-F0-9]{4}$/
export const BROWSER_ID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
export const DUPLICATE_CONTACT_ERROR = { error: 'Для этой почты или телефона уже есть заявка. Укажите прежние контактные данные или свяжитесь с нами.' }

export function normalizeGiveawayPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 10 && !['7', '8'].includes(digits[0])) return `7${digits}`
  if (digits.length === 11 && digits[0] === '8') return `7${digits.slice(1)}`
  return digits
}

export function createGiveawayTicketId() {
  return `AW-${randomBytes(8).toString('hex').toUpperCase().match(/.{4}/g).join('-')}`
}

export function existingTicketResult(entry, email, phone) {
  if (!entry) return null
  if (entry.giveawayEmail === email && entry.giveawayPhone === phone && entry.ticketId) {
    return { ok: true, ticketId: entry.ticketId, alreadyRegistered: true }
  }
  return DUPLICATE_CONTACT_ERROR
}
