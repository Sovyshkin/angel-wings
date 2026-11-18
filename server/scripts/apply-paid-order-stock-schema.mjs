import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { applyOrderStockChanges } from '../src/utils/orderStock.js'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('order_items')")
  if (!columns.length) throw new Error('Таблица order_items отсутствует')
  if (!columns.some(column => column.name === 'stockDeductedQuantity')) {
    await prisma.$executeRawUnsafe('ALTER TABLE order_items ADD COLUMN stockDeductedQuantity INTEGER NOT NULL DEFAULT -1')
  }
  const legacyOrders = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT o.id FROM orders o
    JOIN order_items i ON i.orderId = o.id
    WHERE i.stockDeductedQuantity = -1 ORDER BY o.id
  `)
  let restored = 0
  for (const { id } of legacyOrders) {
    await prisma.$transaction(async tx => {
      const order = await tx.$queryRawUnsafe('SELECT paymentStatus, status FROM orders WHERE id = ?', id)
      const items = await tx.$queryRawUnsafe(`
        SELECT id, productId, dosage, quantity, dosageStockDeducted FROM order_items
        WHERE orderId = ? AND stockDeductedQuantity = -1
      `, id)
      if (!order.length || !items.length) return
      const paid = order[0].paymentStatus === 'PAID'
      const cancelled = ['CANCELLED', 'RETURNED'].includes(order[0].status)
      if (!paid && !cancelled) {
        await applyOrderStockChanges(tx, items.map(item => ({
          productId: item.productId, dosage: item.dosage, quantity: item.quantity,
          variantQuantity: item.dosageStockDeducted
        })))
        restored += items.length
      }
      await tx.$executeRawUnsafe(`
        UPDATE order_items SET stockDeductedQuantity = CASE WHEN ? = 1 AND ? = 0 THEN quantity ELSE 0 END,
          dosageStockDeducted = CASE WHEN ? = 1 AND ? = 0
            THEN CASE WHEN dosage IS NOT NULL AND dosageStockDeducted = 0 THEN -1 ELSE dosageStockDeducted END
            ELSE 0 END
        WHERE orderId = ? AND stockDeductedQuantity = -1
      `, paid ? 1 : 0, cancelled ? 1 : 0, paid ? 1 : 0, cancelled ? 1 : 0, id)
    }, { timeout: 30000 })
  }
  console.log(`[DB] Склад после неоплаченных заказов восстановлен: ${restored} позиций`)
} finally {
  await prisma.$disconnect()
}
