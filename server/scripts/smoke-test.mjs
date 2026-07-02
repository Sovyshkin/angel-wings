#!/usr/bin/env node

const baseUrl = (process.env.SMOKE_BASE_URL || process.env.API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const userEmail = process.env.SMOKE_EMAIL || ''
const userPassword = process.env.SMOKE_PASSWORD || ''
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || ''
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || ''

const results = []

function log(ok, name, details = '') {
  const mark = ok ? 'PASS' : 'FAIL'
  const line = `${mark} | ${name}${details ? ` | ${details}` : ''}`
  results.push({ ok, name, details })
  console.log(line)
}

async function req(path, { method = 'GET', token = '', body } = {}) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  return { status: res.status, json, text }
}

async function testPublicEndpoints() {
  const products = await req('/api/products?limit=3')
  log(products.status === 200, 'GET /api/products', `status=${products.status}`)

  const categories = await req('/api/categories')
  log(categories.status === 200, 'GET /api/categories', `status=${categories.status}`)

  const unauthorizedOrder = await req('/api/orders', {
    method: 'POST',
    body: {
      items: [{ productId: 1, quantity: 1 }],
      customerName: 'Smoke User',
      customerEmail: 'smoke@example.com',
      customerPhone: '+79990000000'
    }
  })
  log(unauthorizedOrder.status === 401, 'POST /api/orders without token -> 401', `status=${unauthorizedOrder.status}`)
}

async function login(email, password, roleLabel) {
  const res = await req('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  })

  const hasSession = res.status === 200 && !!res.json?.token
  const requiresCode = res.status === 202 && res.json?.requiresLoginVerification === true && !!res.json?.challengeToken
  const ok = hasSession || requiresCode
  log(ok, `${roleLabel} login`, `status=${res.status}${requiresCode ? ', email code required' : ''}`)
  return { token: hasSession ? res.json.token : '', requiresCode }
}

async function testUserFlow() {
  if (!userEmail || !userPassword) {
    log(true, 'USER flow skipped', 'set SMOKE_EMAIL and SMOKE_PASSWORD to enable')
    return
  }

  const loginResult = await login(userEmail, userPassword, 'USER')
  if (loginResult.requiresCode) {
    log(true, 'USER protected flow skipped', 'two-factor email code required')
    return
  }
  const token = loginResult.token
  if (!token) return

  const me = await req('/api/auth/me', { token })
  log(me.status === 200, 'GET /api/auth/me', `status=${me.status}`)

  const myOrders = await req('/api/orders/my', { token })
  log(myOrders.status === 200, 'GET /api/orders/my', `status=${myOrders.status}`)
}

async function testAdminFlow() {
  if (!adminEmail || !adminPassword) {
    log(true, 'ADMIN flow skipped', 'set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD to enable')
    return
  }

  const loginResult = await login(adminEmail, adminPassword, 'ADMIN')
  if (loginResult.requiresCode) {
    log(true, 'ADMIN protected flow skipped', 'two-factor email code required')
    return
  }
  const token = loginResult.token
  if (!token) return

  const adminOrders = await req('/api/admin/orders?limit=1', { token })
  log(adminOrders.status === 200, 'GET /api/admin/orders', `status=${adminOrders.status}`)

  const adminProducts = await req('/api/admin/products?limit=1', { token })
  log(adminProducts.status === 200, 'GET /api/admin/products', `status=${adminProducts.status}`)
}

async function main() {
  console.log(`Running API smoke tests against: ${baseUrl}`)

  try {
    await testPublicEndpoints()
    await testUserFlow()
    await testAdminFlow()
  } catch (error) {
    log(false, 'Unexpected runtime error', error?.message || String(error))
  }

  const failed = results.filter(r => !r.ok)
  console.log('\nSummary:')
  console.log(`Total: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`)

  if (failed.length > 0) {
    process.exit(1)
  }
}

main()
