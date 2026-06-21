import crypto from 'crypto'

const TOKEN_VERSION = 'v1'

function getSecret() {
  const secret = process.env.MARKETING_TOKEN_SECRET || process.env.JWT_SECRET || 'angel-wings-marketing-token-dev-secret'
  return crypto.createHash('sha256').update(String(secret)).digest()
}

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64')
}

export function encryptMarketingPayload(payload) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecret(), iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()

  return [
    TOKEN_VERSION,
    toBase64Url(iv),
    toBase64Url(tag),
    toBase64Url(encrypted)
  ].join('.')
}

export function decryptMarketingPayload(token) {
  try {
    const [version, ivPart, tagPart, encryptedPart] = String(token || '').split('.')
    if (version !== TOKEN_VERSION || !ivPart || !tagPart || !encryptedPart) return null

    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecret(), fromBase64Url(ivPart))
    decipher.setAuthTag(fromBase64Url(tagPart))
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(encryptedPart)),
      decipher.final()
    ])

    return JSON.parse(decrypted.toString('utf8'))
  } catch {
    return null
  }
}
