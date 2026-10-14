import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { verifyTelegramInitData } from '../src/routes/auth.js'

const token = 'test-bot-token'
const now = Date.now()
const user = JSON.stringify({ id: 123456789, first_name: 'Test' })
const params = new URLSearchParams({ auth_date: String(Math.floor(now / 1000)), user, query_id: 'abc' })
const checkString = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => `${key}=${value}`).join('\n')
const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
params.set('hash', crypto.createHmac('sha256', secret).update(checkString).digest('hex'))

assert.equal(verifyTelegramInitData(params.toString(), token, now)?.id, 123456789)
const withSignature = new URLSearchParams(params)
withSignature.set('signature', 'telegram-public-signature')
withSignature.delete('hash')
const signedCheckString = [...withSignature.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => `${key}=${value}`).join('\n')
withSignature.set('hash', crypto.createHmac('sha256', secret).update(signedCheckString).digest('hex'))
assert.equal(verifyTelegramInitData(withSignature.toString(), token, now)?.id, 123456789)
const alteredSignature = new URLSearchParams(withSignature)
alteredSignature.set('signature', 'changed')
assert.equal(verifyTelegramInitData(alteredSignature.toString(), token, now), null)

// Published known-answer example from Telegram Mini Apps validation docs.
const exampleToken = '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8'
const exampleData = 'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2'
assert.equal(verifyTelegramInitData(exampleData, exampleToken, 1662771648 * 1000)?.id, 279058397)

const altered = new URLSearchParams(params)
altered.set('user', JSON.stringify({ id: 987654321 }))
assert.equal(verifyTelegramInitData(altered.toString(), token, now), null)
assert.equal(verifyTelegramInitData(params.toString(), 'wrong-token', now), null)
assert.equal(verifyTelegramInitData(params.toString(), token, now + 86_500_000), null)
const duplicate = `${params.toString()}&user=${encodeURIComponent(user)}`
assert.equal(verifyTelegramInitData(duplicate, token, now), null)
console.log('Telegram initData validation: passed')
