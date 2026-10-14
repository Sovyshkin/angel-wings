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
const altered = new URLSearchParams(params)
altered.set('user', JSON.stringify({ id: 987654321 }))
assert.equal(verifyTelegramInitData(altered.toString(), token, now), null)
assert.equal(verifyTelegramInitData(params.toString(), 'wrong-token', now), null)
assert.equal(verifyTelegramInitData(params.toString(), token, now + 3_700_000), null)
const duplicate = `${params.toString()}&user=${encodeURIComponent(user)}`
assert.equal(verifyTelegramInitData(duplicate, token, now), null)
console.log('Telegram initData validation: passed')
