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
    assert.equal(summary.getRow(9).getCell(1).value, order.id)
    assert.equal(summary.getRow(8).getCell(11).value, 13000)
    assert.equal(summary.getRow(9).getCell(11).value, 13000)
    assert.deepEqual([summary.getRow(8).getCell(12).value, summary.getRow(9).getCell(12).value], [10000, 3000])
    assert.deepEqual([summary.getRow(8).getCell(13).value, summary.getRow(9).getCell(13).value], [1141.2, 342.36])
    assert.deepEqual([summary.getRow(8).getCell(14).value, summary.getRow(9).getCell(14).value], [250, 75])
    assert.deepEqual([summary.getRow(8).getCell(18).value, summary.getRow(9).getCell(18).value], [8608.8, 2582.64])
    assert.equal(summary.getRow(8).getCell(20).value, 4950)
    assert.equal(summary.getRow(9).getCell(20).value, null)
    assert.equal(summary.getRow(7).getCell(6).value, 'Товар')
    assert.equal(summary.getRow(8).getCell(6).value, 'Товар')
    assert.deepEqual([summary.getRow(8).getCell(5).value, summary.getRow(9).getCell(5).value], ['Admin', 'Admin'])
    assert.equal(summary.getRow(7).getCell(7).value, 'Количество, шт.')
    assert.deepEqual([summary.getRow(8).getCell(7).value, summary.getRow(9).getCell(7).value], [2, 3])
    assert.equal(summary.getRow(8).getCell(7).numFmt, undefined)
    assert.match(summary.getRow(8).getCell(11).numFmt, /₽/)
    assert.equal(summary.getRow(8).getCell(17).numFmt, '0.0%')
    assert.match(summary.getRow(8).getCell(23).value, /Товар, 10 мг — 2 шт/)
    assert.deepEqual(summary.autoFilter, 'A7:AB7')
    assert.equal(summary.getColumn(7).width, 13)
    assert.deepEqual([summary.getColumn(20).width, summary.getColumn(21).width, summary.getColumn(22).width], [17, 16, 17])
    assert.deepEqual([summary.getColumn(24).width, summary.getColumn(25).width], [17, 18])
    assert.equal(summary.getRow(7).height, 64)
    assert.deepEqual([summary.getRow(8).getCell(21).value, summary.getRow(8).getCell(22).value], [1800, 3600])
    assert.deepEqual([summary.getRow(9).getCell(21).value, summary.getRow(9).getCell(22).value], [450, 1350])
    assert.deepEqual([summary.getRow(8).getCell(24).value, summary.getRow(9).getCell(24).value], [10000, 3000])
    assert.deepEqual([summary.getRow(8).getCell(25).value, summary.getRow(9).getCell(25).value], [5008.8, 1232.64])
    assert.equal(items.getRow(1).getCell(6).value, 'Количество, шт.')
    assert.equal(items.getRow(2).getCell(6).value, 2)
    assert.equal(items.getRow(2).getCell(11).value, 1800)
    assert.equal(items.getRow(2).getCell(12).value, 3600)
    assert.equal(items.getColumn(11).width, 16)
    assert.equal(items.getRow(3).getCell(11).value, 450)
    assert.equal(items.getRow(3).getCell(12).value, 1350)
    const partnerUser = await db.user.create({ data: { email: 'partner@export.test', password: 'unused', name: 'Partner', role: 'PARTNER' } })
    const partner = await db.partner.create({ data: { userId: partnerUser.id, referralCode: 'EXPORT-PARTNER' } })
    await db.partnerCommission.create({ data: { partnerId: partner.id, orderId: order.id, userId: admin.id, amount: 650, percentage: 5 } })
    const partnerResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners/${partner.id}/orders-export?format=xlsx`, {
      headers: { Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` }
    })
    assert.equal(partnerResponse.status, 200)
    const partnerWorkbook = new ExcelJS.Workbook()
    await partnerWorkbook.xlsx.load(Buffer.from(await partnerResponse.arrayBuffer()))
    const partnerSheet = partnerWorkbook.getWorksheet('Заказы')
    assert.equal(partnerSheet.getRow(1).getCell(7).value, 'Товар')
    assert.equal(partnerSheet.getRow(2).getCell(7).value, 'Товар')
    assert.equal(partnerSheet.getRow(1).getCell(8).value, 'Количество, шт.')
    assert.equal(partnerSheet.getRow(2).getCell(8).value, 2)
    assert.equal(partnerSheet.getRow(2).getCell(9).value, 13000)
    assert.equal(partnerSheet.getRow(3).getCell(9).value, 13000)
    assert.deepEqual([partnerSheet.getRow(2).getCell(15).value, partnerSheet.getRow(3).getCell(15).value], [1141.2, 342.36])
    assert.deepEqual([partnerSheet.getRow(2).getCell(16).value, partnerSheet.getRow(3).getCell(16).value], [250, 75])
    assert.deepEqual([partnerSheet.getRow(2).getCell(18).value, partnerSheet.getRow(3).getCell(18).value], [500, 150])
    assert.deepEqual([partnerSheet.getRow(2).getCell(3).value, partnerSheet.getRow(3).getCell(3).value], ['Admin', 'Admin'])
    assert.deepEqual([partnerSheet.getRow(2).getCell(4).value, partnerSheet.getRow(3).getCell(4).value], [admin.email, admin.email])
    assert.equal(partnerSheet.getRow(2).getCell(8).numFmt, undefined)
    assert.match(partnerSheet.getRow(2).getCell(9).numFmt, /₽/)
    assert.match(partnerSheet.getRow(2).getCell(23).value, /Товар, 10 мг × 2/)
    assert.deepEqual(partnerSheet.autoFilter, 'A1:AD1')
    assert.equal(partnerSheet.getColumn(8).width, 13)
    assert.deepEqual([partnerSheet.getColumn(20).width, partnerSheet.getColumn(21).width, partnerSheet.getColumn(22).width], [16, 17, 17])
    assert.deepEqual([partnerSheet.getRow(2).getCell(25).value, partnerSheet.getRow(3).getCell(25).value], [10000, 3000])
    assert.deepEqual([partnerSheet.getRow(2).getCell(26).value, partnerSheet.getRow(3).getCell(26).value], [8108.8, 2432.64])
    assert.deepEqual([partnerSheet.getRow(2).getCell(27).value, partnerSheet.getRow(3).getCell(27).value], [4508.8, 1082.64])
    assert.equal(partnerSheet.getRow(1).height, 64)

    const manualProduct = await db.product.create({ data: {
      title: 'Добавленный товар', slug: 'export-manual-product', description: '', price: 17550, costPrice: 2000
    } })
    const manualOrder = await db.order.create({ data: {
      userId: admin.id, partnerId: partner.id, total: 64395, paymentAmount: 48600,
      unbilledAdjustment: 15795, discountAmount: 11155, paymentStatus: 'PAID', paymentType: 'card',
      customerName: 'Admin', customerEmail: admin.email, customerPhone: '+79990000000',
      items: { create: [
        { productId: product.id, quantity: 2, price: 16000 },
        { productId: secondProduct.id, quantity: 1, price: 26000 },
        { productId: manualProduct.id, quantity: 1, price: 17550, adminAddedById: admin.id, adminAddedAt: new Date(), adminUnbilled: true }
      ] }
    } })
    await db.partnerCommission.create({ data: {
      partnerId: partner.id, orderId: manualOrder.id, userId: admin.id, amount: 7083.45, percentage: 11
    } })
    const reload = async url => {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` }
      })
      assert.equal(response.status, 200)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()))
      return workbook.getWorksheet('Заказы')
    }
    const allManual = await reload(`http://127.0.0.1:${server.address().port}/api/admin/partners/orders-export/all-orders?format=xlsx`)
    const manualRows = [...allManual._rows].filter(row => row && row.number > 7 && row.getCell(1).value === manualOrder.id)
    assert.equal(manualRows.length, 3)
    const manualRow = manualRows.find(row => row.getCell(6).value === 'Добавленный товар')
    assert.ok(manualRow)
    assert.equal(manualRow.getCell(11).value, 64395)
    assert.equal(manualRow.getCell(12).value, 15795)
    assert.equal(manualRow.getCell(14).value, 0)
    assert.equal(manualRow.getCell(26).value, 'Да, администратором')
    assert.equal(manualRow.getCell(27).value, 0)
    assert.equal(manualRow.getCell(28).value, 15795)
    assert.equal(manualRow.getCell(19).value, 'Вне сайта')
    assert.equal(manualRows.reduce((sum, row) => sum + row.getCell(12).value, 0), 64395)
    assert.equal(manualRows.reduce((sum, row) => sum + row.getCell(14).value, 0), 1215)
    assert.equal(allManual.getRow(5).getCell(14).value, 15795)

    const partnerManual = await reload(`http://127.0.0.1:${server.address().port}/api/admin/partners/${partner.id}/orders-export?format=xlsx`)
    const partnerManualRows = [...partnerManual._rows].filter(row => row && row.number > 1 && row.getCell(1).value === manualOrder.id)
    assert.equal(partnerManualRows.length, 3)
    const partnerManualRow = partnerManualRows.find(row => row.getCell(7).value === 'Добавленный товар')
    assert.equal(partnerManualRow.getCell(16).value, 0)
    assert.equal(partnerManualRow.getCell(25).value, 15795)
    assert.equal(partnerManualRow.getCell(28).value, 'Да, администратором')
    assert.equal(partnerManualRow.getCell(29).value, 0)
    assert.equal(partnerManualRow.getCell(30).value, 15795)
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
