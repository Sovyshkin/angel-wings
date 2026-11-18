import { applyOrderStockChanges } from './orderStock.js'

function deductedQuantity(item) {
  const recorded = Number(item.stockDeductedQuantity)
  // -1 marks orders created before per-item stock tracking was introduced.
  return recorded < 0 ? Number(item.quantity) : Math.min(Number(item.quantity), recorded)
}

export async function deductPaidOrderStock(tx, orderId) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      paymentStatus: true, status: true,
      items: { select: { id: true, productId: true, dosage: true, quantity: true, stockDeductedQuantity: true, dosageStockDeducted: true } }
    }
  })
  if (!order || order.paymentStatus !== 'PAID' || ['CANCELLED', 'RETURNED'].includes(order.status)) return false
  const changes = order.items.map(item => ({
    productId: item.productId,
    dosage: item.dosage,
    quantity: -(item.quantity - deductedQuantity(item)),
    variantQuantity: item.dosage && item.stockDeductedQuantity >= 0 && item.dosageStockDeducted >= 0
      ? -(item.quantity - Math.min(item.quantity, Math.max(0, Number(item.dosageStockDeducted) || 0))) : 0
  }))
  await applyOrderStockChanges(tx, changes, { allowOversell: true })
  for (const item of order.items) {
    if (item.stockDeductedQuantity === item.quantity && (!item.dosage || item.dosageStockDeducted === item.quantity || item.dosageStockDeducted < 0)) continue
    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        stockDeductedQuantity: item.quantity,
        dosageStockDeducted: item.stockDeductedQuantity < 0
          ? (item.dosage && !item.dosageStockDeducted ? -1 : item.dosageStockDeducted)
          : (item.dosageStockDeducted < 0 ? -1 : (item.dosage ? item.quantity : 0))
      }
    })
  }
  return changes.some(change => change.quantity < 0)
}

export async function releaseOrderStock(tx, items) {
  await applyOrderStockChanges(tx, items.map(item => ({
    productId: item.productId,
    dosage: item.dosage,
    quantity: deductedQuantity(item),
    variantQuantity: Math.max(0, item.dosageStockDeducted || 0)
  })))
  for (const item of items) {
    await tx.orderItem.update({ where: { id: item.id }, data: { stockDeductedQuantity: 0, dosageStockDeducted: 0 } })
  }
}

export async function updatePaymentStatusWithStock(prisma, orderId, data, select) {
  return prisma.$transaction(async tx => {
    const previous = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        paymentStatus: true,
        items: { select: { id: true, productId: true, dosage: true, quantity: true, stockDeductedQuantity: true, dosageStockDeducted: true } }
      }
    })
    const updated = await tx.order.update({ where: { id: orderId }, data, ...(select ? { select } : {}) })
    if (data.paymentStatus === 'PAID') await deductPaidOrderStock(tx, orderId)
    else if (previous?.paymentStatus === 'PAID' && data.paymentStatus && previous.items.some(item => item.stockDeductedQuantity !== 0)) {
      await releaseOrderStock(tx, previous.items)
    }
    return updated
  })
}
