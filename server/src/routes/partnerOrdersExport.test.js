import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import ExcelJS from 'exceljs'
import { PrismaClient } from '@prisma/client'

test('all-orders Excel export includes dosage cost, line cost, order cost and report cost', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-orders-export-'))
  process.env.DATABASE_URL = `file:${join(directory, 'test.db')}`
  process.env.JWT_SECRET = 'orders-export-test-secret'
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schema = spawnSync('sqlite3', ['-batch', join(directory, 'test.db')], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const [{ default: partnerRoutes }] = await Promise.all([import('./partner.js')])
  const db = new PrismaClient()
  const app = express()
  app.use('/api/admin/partners', partnerRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
  try {
    const admin = await db.user.create({ data: { email: 'admin@export.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const product = await db.product.create({ data: {
      title: 'Товар', slug: 'export-cost-test', description: '', price: 5000, costPrice: 1200,
      specs: JSON.stringify({ dosages: [{ dosage: '10 мг', costPrice: 1800 }] })
    } })
    const secondProduct = await db.product.create({ data: {
      title: 'Второй товар', slug: 'export-cost-test-second', description: '', price: 1000, costPrice: 450
    } })
    const order = await db.order.create({ data: {
      userId: admin.id, total: 13000, paymentStatus: 'PAID', customerName: 'Admin',
      customerEmail: admin.email, customerPhone: '+79990000000',
      items: { create: [
        { productId: product.id, dosage: '10 мг', quantity: 2, price: 5000 },
        { productId: secondProduct.id, quantity: 3, price: 1000 }
      ] }
    } })
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners/orders-export/all-orders?format=xlsx`, {
      headers: { Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` }
    })
    assert.equal(response.status, 200)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()))
    const summary = workbook.getWorksheet('Заказы')
    const items = workbook.getWorksheet('Состав заказов')
    assert.equal(summary.getRow(5).getCell(12).value, 4950)
    assert.equal(summary.getRow(8).getCell(1).value, order.id)
    assert.equal(summary.getRow(8).getCell(19).value, 4950)
    assert.equal(summary.getRow(9).getCell(19).value, null)
    assert.deepEqual([summary.getRow(8).getCell(20).value, summary.getRow(8).getCell(21).value], [1800, 3600])
    assert.deepEqual([summary.getRow(9).getCell(20).value, summary.getRow(9).getCell(21).value], [450, 1350])
    assert.equal(items.getRow(2).getCell(11).value, 1800)
    assert.equal(items.getRow(2).getCell(12).value, 3600)
    assert.equal(items.getRow(3).getCell(11).value, 450)
    assert.equal(items.getRow(3).getCell(12).value, 1350)
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
