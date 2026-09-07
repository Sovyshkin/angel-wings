import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'
import { generateUniqueSlug } from '../utils/slug.js'
import { deleteProductForAdmin } from '../utils/productDeletion.js'

const router = Router()
const prisma = new PrismaClient()
const ACTIVE_ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED']

function parseImagesField(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getDosagePriceFromSpecs(specsRaw, dosage) {
  if (!specsRaw || !dosage) return null
  try {
    const specs = typeof specsRaw === 'string' ? JSON.parse(specsRaw) : specsRaw
    const dosages = Array.isArray(specs?.dosages) ? specs.dosages : []
    const matched = dosages.find(item => String(item?.dosage || '').trim() === String(dosage).trim())
    if (!matched) return null
    if (matched.price === undefined || matched.price === null || matched.price === '') return null
    return Math.max(0, parseFloat(matched.price) || 0)
  } catch {
    return null
  }
}

async function generateUniqueProductSlug(title) {
  return generateUniqueSlug(
    title,
    slug => prisma.product.findUnique({ where: { slug } }),
    'product'
  )
}

function stripInternalProductFields(product) {
  const {
    costPrice,
    packageLength,
    packageWidth,
    packageHeight,
    ...publicProduct
  } = product
  return publicProduct
}

function parsePackageDimension(value) {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function parseFeaturedSettings(featured, featuredPosition, active) {
  const isActive = active !== 'false'
  const isFeatured = featured === 'true'

  if (isFeatured && !isActive) {
    const error = new Error('Популярный товар должен быть активен')
    error.status = 400
    throw error
  }

  if (!isFeatured) {
    return { featured: false, featuredPosition: null }
  }

  const position = parseInt(featuredPosition, 10)
  if (!Number.isInteger(position) || position < 1 || position > 4) {
    const error = new Error('Выберите позицию популярного товара от 1 до 4')
    error.status = 400
    throw error
  }

  return { featured: true, featuredPosition: position }
}

router.get('/', async (req, res, next) => {
  try {
    const { category, search, featured, limit = 100, offset = 0 } = req.query
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 100)
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0)
    
    const where = { active: true }
    
    if (category) {
      where.categories = {
        some: { slug: category }
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (featured === 'true') {
      where.featured = true
    }
    
    const [products, total, catalogTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: {
            select: { id: true, name: true, slug: true }
          }
        },
        take: featured === 'true' ? Math.min(parsedLimit, 4) : parsedLimit,
        skip: parsedOffset,
        orderBy: featured === 'true'
          ? [{ featuredPosition: 'asc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' }
      }),
      prisma.product.count({ where }),
      featured === 'true'
        ? prisma.product.count({ where: { active: true } })
        : Promise.resolve(null)
    ])

    const parsedProducts = products.map(p => {
      const publicProduct = stripInternalProductFields(p)
      return {
        ...publicProduct,
        specs: p.specs ? JSON.parse(p.specs) : {},
        images: parseImagesField(p.images)
      }
    })

    res.json({ products: parsedProducts, total, catalogTotal: catalogTotal ?? total })
  } catch (error) {
    next(error)
  }
})

router.get('/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        categories: {
          select: { id: true, name: true, slug: true }
        }
      }
    })
    
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' })
    }
    
    const publicProduct = stripInternalProductFields(product)
    const parsedProduct = {
      ...publicProduct,
      specs: product.specs ? JSON.parse(product.specs) : {},
      images: parseImagesField(product.images)
    }
    
    res.json({ product: parsedProduct })
  } catch (error) {
    next(error)
  }
})

router.post('/', authenticate, requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 12 }
]), async (req, res, next) => {
  try {
    const { title, description, price, comparePrice, costPrice, sku, stock, weight, packageLength, packageWidth, packageHeight, repeatCycleDays, specs, categories, featured, featuredPosition, active, country } = req.body
    const mainFile = req.files?.image?.[0] || null
    const galleryFiles = req.files?.images || []
    const galleryImages = galleryFiles.map(file => `/uploads/${file.filename}`)
    const mainImage = mainFile ? `/uploads/${mainFile.filename}` : (galleryImages[0] || null)
    
    const slug = await generateUniqueProductSlug(title)
    
    const parsedWeight = parseInt(weight)
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ error: 'Вес товара обязателен и должен быть больше 0 г' })
    }
    const parsedRepeatCycleDays = repeatCycleDays === undefined || repeatCycleDays === null || repeatCycleDays === ''
      ? null
      : parseInt(repeatCycleDays, 10)
    if (parsedRepeatCycleDays !== null && (!Number.isFinite(parsedRepeatCycleDays) || parsedRepeatCycleDays <= 0)) {
      return res.status(400).json({ error: 'Цикл повторного заказа должен быть больше 0 дней' })
    }
    const featuredSettings = parseFeaturedSettings(featured, featuredPosition, active)

    const product = await prisma.$transaction(async (tx) => {
      if (featuredSettings.featured) {
        await tx.product.updateMany({
          where: { featuredPosition: featuredSettings.featuredPosition },
          data: { featured: false, featuredPosition: null }
        })
      }

      return tx.product.create({
        data: {
          title,
          slug,
          description,
          price: parseFloat(price),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          costPrice: Math.max(0, parseFloat(costPrice) || 0),
          sku,
          stock: parseInt(stock) || 0,
          weight: parsedWeight,
          packageLength: parsePackageDimension(packageLength),
          packageWidth: parsePackageDimension(packageWidth),
          packageHeight: parsePackageDimension(packageHeight),
          repeatCycleDays: parsedRepeatCycleDays,
          country: country || null,
          specs: specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : '{}',
          image: mainImage,
          images: JSON.stringify(galleryImages),
          ...featuredSettings,
          active: active !== 'false',
          categories: categories ? {
            connect: JSON.parse(categories).map(id => ({ id: parseInt(id) }))
          } : undefined
        }
      })
    })
    
    res.status(201).json({ product })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', authenticate, requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 12 }
]), async (req, res, next) => {
  try {
    const { title, description, price, comparePrice, costPrice, sku, stock, weight, packageLength, packageWidth, packageHeight, repeatCycleDays, specs, categories, featured, featuredPosition, active, country, existingImages, removeMainImage } = req.body
    const mainFile = req.files?.image?.[0] || null
    const galleryFiles = req.files?.images || []
    const persistedImages = parseImagesField(existingImages)
    const uploadedGalleryImages = galleryFiles.map(file => `/uploads/${file.filename}`)
    const mergedGalleryImages = [...persistedImages, ...uploadedGalleryImages]
    
    const parsedWeight = parseInt(weight)
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ error: 'Вес товара обязателен и должен быть больше 0 г' })
    }
    const parsedRepeatCycleDays = repeatCycleDays === undefined || repeatCycleDays === null || repeatCycleDays === ''
      ? null
      : parseInt(repeatCycleDays, 10)
    if (parsedRepeatCycleDays !== null && (!Number.isFinite(parsedRepeatCycleDays) || parsedRepeatCycleDays <= 0)) {
      return res.status(400).json({ error: 'Цикл повторного заказа должен быть больше 0 дней' })
    }
    const featuredSettings = parseFeaturedSettings(featured, featuredPosition, active)

    const updateData = {
      title,
      description,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      costPrice: Math.max(0, parseFloat(costPrice) || 0),
      sku,
      stock: parseInt(stock) || 0,
      weight: parsedWeight,
      packageLength: parsePackageDimension(packageLength),
      packageWidth: parsePackageDimension(packageWidth),
      packageHeight: parsePackageDimension(packageHeight),
      repeatCycleDays: parsedRepeatCycleDays,
      country: country || null,
      specs: specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : '{}',
      ...featuredSettings,
      active: active !== 'false'
    }
    
    updateData.images = JSON.stringify(mergedGalleryImages)
    if (mainFile) updateData.image = `/uploads/${mainFile.filename}`
    else if (removeMainImage === 'true') updateData.image = null
    
    if (categories) {
      updateData.categories = {
        set: JSON.parse(categories).map(id => ({ id: parseInt(id) }))
      }
    }
    
    const productId = parseInt(req.params.id, 10)
    const product = await prisma.$transaction(async (tx) => {
      if (featuredSettings.featured) {
        await tx.product.updateMany({
          where: {
            featuredPosition: featuredSettings.featuredPosition,
            id: { not: productId }
          },
          data: { featured: false, featuredPosition: null }
        })
      }

      return tx.product.update({
        where: { id: productId },
        data: updateData
      })
    })

    // If product is used in active orders, reflect current product data in those order positions.
    const activeOrderItems = await prisma.orderItem.findMany({
      where: {
        productId: product.id,
        order: { status: { in: ACTIVE_ORDER_STATUSES } }
      },
      select: { id: true, dosage: true, orderId: true }
    })

    if (activeOrderItems.length) {
      const basePrice = Math.max(0, parseFloat(updateData.price) || 0)
      const specsSource = updateData.specs || '{}'

      await prisma.$transaction(async (tx) => {
        for (const item of activeOrderItems) {
          const dosagePrice = getDosagePriceFromSpecs(specsSource, item.dosage)
          const nextPrice = dosagePrice !== null ? dosagePrice : basePrice
          await tx.orderItem.update({
            where: { id: item.id },
            data: { price: nextPrice }
          })
        }

        const touchedOrderIds = [...new Set(activeOrderItems.map(item => item.orderId))]
        for (const orderId of touchedOrderIds) {
          const orderWithItems = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true }
          })
          if (!orderWithItems) continue

          const itemsTotal = orderWithItems.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
          const delivery = Math.max(0, parseFloat(orderWithItems.deliveryPrice) || 0)
          const discount = Math.max(0, parseFloat(orderWithItems.discountAmount) || 0)
          const nextTotal = Math.max(0, itemsTotal + delivery - discount)

          await tx.order.update({
            where: { id: orderId },
            data: { total: nextTotal }
          })
        }
      })
    }
    
    res.json({ product })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10)
    const result = await deleteProductForAdmin(prisma, productId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
