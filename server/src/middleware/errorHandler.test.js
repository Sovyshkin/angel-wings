import test from 'node:test'
import assert from 'node:assert/strict'
import { errorHandler } from './errorHandler.js'

test('Prisma validation failure is reported as a server error with a traceable code', () => {
  const originalError = console.error
  const logs = []
  console.error = (...args) => logs.push(args)
  let status
  let body
  const response = {
    status(value) { status = value; return this },
    json(value) { body = value; return this }
  }
  try {
    const error = Object.assign(new Error('Unknown argument `orderId`'), { name: 'PrismaClientValidationError' })
    errorHandler(error, { method: 'POST', originalUrl: '/api/orders', user: { id: 525 } }, response, () => {})
  } finally {
    console.error = originalError
  }
  assert.equal(status, 500)
  assert.equal(body.code, 'SERVER_DATA_ERROR')
  assert.match(body.errorId, /^[0-9a-f-]{36}$/)
  assert.match(logs[0][1], /"userId":525/)
  assert.match(logs[0][1], new RegExp(body.errorId))
  assert.doesNotMatch(body.error, /Некорректные данные|orderId/)
})
