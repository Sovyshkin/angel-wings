import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { updatePaymentStatusWithStock } from './paidOrderStock.js'

test('legacy unpaid reservations are restored once, then only paid positions reduce stock', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-paid-stock-'))
  const databasePath = join(directory, 'test.db')
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const environment = { ...process.env, DATABASE_URL: `file:${databasePath}` }
  process.env.DATABASE_URL = environment.DATABASE_URL
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: environment, encoding: 'utf8'
  })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const db = new PrismaClient()
  try {
    const product = await db.product.create({ data: {
      title: 'Дозировка', slug: 'paid-stock-test', description: '', price: 100,
      stock: 1, specs: JSON.stringify({ dosages: [{ dosage: '20 мг', quantity: 1 }] })
    } })
    const makeOrder = (paymentStatus, status = 'PENDING') => db.order.create({ data: {
      customerName: 'Test', customerEmail: 'test@stock.test', customerPhone: '+79990000000',
      total: 100, paymentStatus, status,
      items: { create: { productId: product.id, dosage: '20 мг', quantity: 1, price: 100, dosageStockDeducted: status === 'CANCELLED' ? 0 : 1 } }
    } })
    const pending = await makeOrder('PENDING')
    const paid = await makeOrder('PAID')
    const cancelled = await makeOrder('PENDING', 'CANCELLED')
    const oldVariant = await db.product.create({ data: {
      title: 'Старая дозировка', slug: 'paid-stock-old-variant', description: '', price: 100,
      stock: 0, specs: JSON.stringify({ dosages: [{ dosage: '30 мг', quantity: 1 }] })
    } })
    const oldVariantOrder = await db.order.create({ data: {
      customerName: 'Test', customerEmail: 'old@stock.test', customerPhone: '+79990000002',
      total: 100, paymentStatus: 'PAID',
      items: { create: { productId: oldVariant.id, dosage: '30 мг', quantity: 1, price: 100, dosageStockDeducted: 0 } }
    } })
    const runRepair = () => execFileSync('node', ['scripts/apply-paid-order-stock-schema.mjs'], {
      cwd: serverDirectory, env: environment, encoding: 'utf8'
    })
    runRepair()
    let stock = await db.product.findUnique({ where: { id: product.id } })
    assert.equal(stock.stock, 2)
    assert.equal(JSON.parse(stock.specs).dosages[0].quantity, 2)
    assert.deepEqual((await db.orderItem.findMany({ orderBy: { orderId: 'asc' } })).map(item => item.stockDeductedQuantity), [0, 1, 0, 1])
    assert.equal((await db.orderItem.findFirst({ where: { orderId: oldVariantOrder.id } })).dosageStockDeducted, -1)
    runRepair()
    assert.equal((await db.product.findUnique({ where: { id: product.id } })).stock, 2)
    await updatePaymentStatusWithStock(db, oldVariantOrder.id, { paymentStatus: 'PAID' })
    await updatePaymentStatusWithStock(db, oldVariantOrder.id, { paymentStatus: 'PAID' })
    const unchangedOldVariant = await db.product.findUnique({ where: { id: oldVariant.id } })
    assert.equal(unchangedOldVariant.stock, 0)
    assert.equal(JSON.parse(unchangedOldVariant.specs).dosages[0].quantity, 1)
    await updatePaymentStatusWithStock(db, pending.id, { paymentStatus: 'PAID' })
    await updatePaymentStatusWithStock(db, pending.id, { paymentStatus: 'PAID' })
    stock = await db.product.findUnique({ where: { id: product.id } })
    assert.equal(stock.stock, 1)
    assert.equal(JSON.parse(stock.specs).dosages[0].quantity, 1)
    assert.equal((await db.orderItem.findFirst({ where: { orderId: pending.id } })).stockDeductedQuantity, 1)
    assert.equal((await db.orderItem.findFirst({ where: { orderId: paid.id } })).stockDeductedQuantity, 1)
    assert.equal((await db.orderItem.findFirst({ where: { orderId: cancelled.id } })).stockDeductedQuantity, 0)

    const partialProduct = await db.product.create({ data: {
      title: 'Доплата', slug: 'paid-stock-partial', description: '', price: 100, stock: 1,
      specs: JSON.stringify({ dosages: [{ dosage: '10 мг', quantity: 1 }] })
    } })
    const partial = await db.order.create({ data: {
      customerName: 'Test', customerEmail: 'partial@stock.test', customerPhone: '+79990000001',
      total: 200, paymentStatus: 'PENDING',
      items: { create: {
        productId: partialProduct.id, dosage: '10 мг', quantity: 2, price: 100,
        stockDeductedQuantity: 1, dosageStockDeducted: 1
      } }
    } })
    await updatePaymentStatusWithStock(db, partial.id, { paymentStatus: 'PAID' })
    assert.equal((await db.product.findUnique({ where: { id: partialProduct.id } })).stock, 0)
    assert.equal((await db.orderItem.findFirst({ where: { orderId: partial.id } })).stockDeductedQuantity, 2)
    await updatePaymentStatusWithStock(db, partial.id, { paymentStatus: 'FAILED' })
    const released = await db.product.findUnique({ where: { id: partialProduct.id } })
    assert.equal(released.stock, 2)
    assert.equal(JSON.parse(released.specs).dosages[0].quantity, 2)

    const lastUnit = await db.product.create({ data: {
      title: 'Последний', slug: 'paid-stock-last-unit', description: '', price: 100, stock: 1
    } })
    const makePending = email => db.order.create({ data: {
      customerName: 'Test', customerEmail: email, customerPhone: '+79990000003',
      total: 100, paymentStatus: 'PENDING',
      items: { create: { productId: lastUnit.id, quantity: 1, price: 100, stockDeductedQuantity: 0 } }
    } })
    const firstBuyer = await makePending('first@stock.test')
    const secondBuyer = await makePending('second@stock.test')
    assert.equal((await db.product.findUnique({ where: { id: lastUnit.id } })).stock, 1)
    await updatePaymentStatusWithStock(db, firstBuyer.id, { paymentStatus: 'PAID' })
    await updatePaymentStatusWithStock(db, secondBuyer.id, { paymentStatus: 'PAID' })
    assert.equal((await db.product.findUnique({ where: { id: lastUnit.id } })).stock, -1)
  } finally {
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
