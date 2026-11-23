import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('bulk price changes are atomic and keep previous product prices', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-product-prices-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'product-prices-test-secret'
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)
  const { default: productRoutes } = await import('./products.js')
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/products', productRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  try {
    const admin = await db.user.create({ data: { email: 'price-admin@test.local', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const first = await db.product.create({ data: { title: 'First', slug: 'first', description: '', price: 100, costPrice: 20, specs: JSON.stringify({ dosages: [{ dosage: '10 мг', price: 120 }] }) } })
    const second = await db.product.create({ data: { title: 'Second', slug: 'second', description: '', price: 200 } })
    const base = `http://127.0.0.1:${server.address().port}/api/products`
    const headers = { Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }
    const response = await fetch(`${base}/prices/bulk`, { method: 'POST', headers, body: JSON.stringify({ entries: [{ id: first.id, price: 150, costPrice: 30 }, { id: second.id, price: 250 }] }) })
    assert.equal(response.status, 200)
    assert.equal((await db.product.findUnique({ where: { id: first.id } })).price, 150)
    assert.equal((await db.product.findUnique({ where: { id: second.id } })).price, 250)
    const historyResponse = await fetch(`${base}/${first.id}/price-history`, { headers })
    assert.equal(historyResponse.status, 200)
    const { changes } = await historyResponse.json()
    assert.equal(changes.length, 1)
    assert.deepEqual([changes[0].before.price, changes[0].after.price, changes[0].before.dosages[0].price], [100, 150, 120])
    const edit = new FormData()
    for (const [key, value] of Object.entries({ title: 'First', description: '', price: 100, costPrice: 20, stock: 0, weight: 1, specs: JSON.stringify({ dosages: [{ dosage: '10 мг', price: 120 }] }), featured: false, active: true })) edit.append(key, String(value))
    const editResponse = await fetch(`${base}/${first.id}`, { method: 'PUT', headers: { Authorization: headers.Authorization }, body: edit })
    assert.equal(editResponse.status, 200, await editResponse.text())
    const restoredHistory = await (await fetch(`${base}/${first.id}/price-history`, { headers })).json()
    assert.equal(restoredHistory.changes.length, 2)
    assert.deepEqual([restoredHistory.changes[0].before.price, restoredHistory.changes[0].after.price], [150, 100])
    const invalid = await fetch(`${base}/prices/bulk`, { method: 'POST', headers, body: JSON.stringify({ entries: [{ id: first.id, price: 400 }, { id: second.id, price: -1 }] }) })
    assert.equal(invalid.status, 400)
    assert.equal((await db.product.findUnique({ where: { id: first.id } })).price, 100)
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
