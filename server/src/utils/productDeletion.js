export async function deleteProductForAdmin(prisma, productId) {
  if (!Number.isInteger(productId) || productId <= 0) {
    const error = new Error('Некорректный ID товара')
    error.status = 400
    throw error
  }

  const orderItemsCount = await prisma.orderItem.count({
    where: { productId }
  })

  if (orderItemsCount > 0) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { active: false, featured: false }
    })

    return {
      message: 'Товар связан с заказами и не может быть удалён физически. Товар скрыт из каталога.',
      deleted: false,
      deactivated: true,
      productId: product.id
    }
  }

  await prisma.$transaction([
    prisma.productAnalyticsEvent.deleteMany({
      where: { productId }
    }),
    prisma.product.delete({
      where: { id: productId }
    })
  ])

  return {
    message: 'Товар удалён',
    deleted: true,
    deactivated: false,
    productId
  }
}
