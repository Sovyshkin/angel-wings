const WEAK_PASSWORD_PARTS = [
  'password',
  'qwerty',
  'admin',
  'angel',
  'wings',
  'peptidi',
  '123456',
  '111111'
]

export function validatePasswordPolicy(password, context = {}) {
  const value = String(password || '')
  const normalized = value.toLowerCase()
  const emailPrefix = String(context.email || '').split('@')[0]?.toLowerCase()
  const nameParts = String(context.name || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(part => part.length >= 3)

  if (value.length < 12) {
    return 'Пароль администратора должен содержать минимум 12 символов'
  }

  if (!/[a-zа-яё]/i.test(value) || !/[A-ZА-ЯЁ]/.test(value)) {
    return 'Добавьте в пароль строчные и заглавные буквы'
  }

  if (!/\d/.test(value)) {
    return 'Добавьте в пароль хотя бы одну цифру'
  }

  if (!/[^a-zа-яё0-9]/i.test(value)) {
    return 'Добавьте в пароль хотя бы один спецсимвол'
  }

  if (WEAK_PASSWORD_PARTS.some(part => normalized.includes(part))) {
    return 'Пароль слишком очевидный. Не используйте admin, qwerty, password, 123456 и название проекта'
  }

  if (emailPrefix && emailPrefix.length >= 3 && normalized.includes(emailPrefix)) {
    return 'Пароль не должен содержать часть email'
  }

  if (nameParts.some(part => normalized.includes(part))) {
    return 'Пароль не должен содержать имя пользователя'
  }

  return null
}

export function validateBasicPassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    return 'Пароль должен содержать минимум 6 символов'
  }
  return null
}
