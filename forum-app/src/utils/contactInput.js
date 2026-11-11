const emailDomains = ['mail.ru', 'gmail.com', 'yandex.ru', 'bk.ru', 'list.ru', 'inbox.ru', 'outlook.com']
const commonEmailTypos = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'yadnex.ru': 'yandex.ru', 'yandex.r': 'yandex.ru', 'mail.r': 'mail.ru' }

export function subscriberDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return (digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits).slice(0, 10)
}

export function formatRussianPhone(value) {
  const rawDigits = String(value ?? '').replace(/\D/g, '')
  if (!rawDigits) return ''
  const digits = subscriberDigits(value)
  if (!digits) return '+7'
  let formatted = `+7 (${digits.slice(0, 3)}`
  if (digits.length > 3) formatted += `) ${digits.slice(3, 6)}`
  if (digits.length > 6) formatted += `-${digits.slice(6, 8)}`
  if (digits.length > 8) formatted += `-${digits.slice(8, 10)}`
  return formatted
}

function caretAfterDigits(formatted, count) {
  if (!formatted) return 0
  if (!count) return 2
  let seen = 0
  for (let index = 2; index < formatted.length; index++) {
    if (/\d/.test(formatted[index]) && ++seen === count) return index + 1
  }
  return formatted.length
}

export function maskPhoneInput(raw, caret, inputType = '', previous = '') {
  let digits = subscriberDigits(raw)
  let beforeCaret = subscriberDigits(String(raw).slice(0, caret)).length
  const previousDigits = subscriberDigits(previous)
  if (digits === previousDigits && inputType === 'deleteContentBackward' && beforeCaret > 0) {
    digits = digits.slice(0, beforeCaret - 1) + digits.slice(beforeCaret)
    beforeCaret--
  } else if (digits === previousDigits && inputType === 'deleteContentForward' && beforeCaret < digits.length) {
    digits = digits.slice(0, beforeCaret) + digits.slice(beforeCaret + 1)
  }
  const formatted = formatRussianPhone(digits ? `7${digits}` : raw.replace(/\D/g, '') ? '7' : '')
  return { value: formatted, caret: caretAfterDigits(formatted, beforeCaret) }
}

export function normalizeEmailInput(value) {
  const cleaned = String(value ?? '').replace(/[\s\u00a0]+/g, '').replace(/[＠﹫]/g, '@').replace(/[．。]/g, '.')
  const at = cleaned.indexOf('@')
  return at < 0 ? cleaned : `${cleaned.slice(0, at)}@${cleaned.slice(at + 1).toLowerCase()}`
}

export function emailSuggestions(value) {
  const email = normalizeEmailInput(value)
  const at = email.indexOf('@')
  if (at <= 0 || email.indexOf('@', at + 1) !== -1) return []
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (emailDomains.includes(domain)) return []
  const candidates = domain ? emailDomains.filter(item => item.startsWith(domain)) : emailDomains.slice(0, 4)
  if (!candidates.length && commonEmailTypos[domain]) candidates.push(commonEmailTypos[domain])
  return candidates.slice(0, 3).map(item => `${local}@${item}`)
}
