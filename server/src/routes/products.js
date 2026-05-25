import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'

const router = Router()
const prisma = new PrismaClient()
const ACTIVE_ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED']
const CYRILLIC_TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
}

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

function slugifyTitle(title) {
  const normalized = String(title || '')
    .toLowerCase()
    .trim()
    .split('')
    .map(char => CYRILLIC_TO_LATIN[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return normalized || 'product'
}

async function generateUniqueProductSlug(title) {
  const baseSlug = slugifyTitle(title)
  let slug = baseSlug
  let suffix = 2

  // Ensure uniqueness for slug unique constraint in DB
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return slug
}

router.get('/', async (req, res, next) => {
  try {
    const { category, search, featured, limit = 100, offset = 0 } = req.query
    
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
    
const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: {
            select: { id: true, name: true, slug: true }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    const parsedProducts = products.map(p => ({
      ...p,
      specs: p.specs ? JSON.parse(p.specs) : {},
      images: parseImagesField(p.images)
    }))

    res.json({ products: parsedProducts, total })
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
    
    const parsedProduct = {
      ...product,
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
    const { title, description, price, comparePrice, sku, stock, weight, specs, categories, featured, active, purity, volume, country } = req.body
    const mainFile = req.files?.image?.[0] || null
    const galleryFiles = req.files?.images || []
    const galleryImages = galleryFiles.map(file => `/uploads/${file.filename}`)
    const mainImage = mainFile ? `/uploads/${mainFile.filename}` : (galleryImages[0] || null)
    
    const slug = await generateUniqueProductSlug(title)
    
    const parsedWeight = parseInt(weight)
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ error: 'Вес товара обязателен и должен быть больше 0 г' })
    }

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        sku,
        stock: parseInt(stock) || 0,
        weight: parsedWeight,
        specs: specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : '{}',
        purity: purity || null,
        volume: volume || null,
        country: country || null,
        image: mainImage,
        images: JSON.stringify(galleryImages),
        featured: featured === 'true',
        active: active !== 'false',
        categories: categories ? {
          connect: JSON.parse(categories).map(id => ({ id: parseInt(id) }))
        } : undefined
      }
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
    const { title, description, price, comparePrice, sku, stock, weight, specs, categories, featured, active, purity, volume, country, existingImages } = req.body
    const mainFile = req.files?.image?.[0] || null
    const galleryFiles = req.files?.images || []
    const persistedImages = parseImagesField(existingImages)
    const uploadedGalleryImages = galleryFiles.map(file => `/uploads/${file.filename}`)
    const mergedGalleryImages = [...persistedImages, ...uploadedGalleryImages]
    
    const parsedWeight = parseInt(weight)
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return res.status(400).json({ error: 'Вес товара обязателен и должен быть больше 0 г' })
    }

    const updateData = {
      title,
      description,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      sku,
      stock: parseInt(stock) || 0,
      weight: parsedWeight,
      specs: specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : '{}',
      purity: purity || null,
      volume: volume || null,
      country: country || null,
      featured: featured === 'true',
      active: active !== 'false'
    }
    
    updateData.images = JSON.stringify(mergedGalleryImages)
    if (mainFile) updateData.image = `/uploads/${mainFile.filename}`
    else if (!updateData.image && mergedGalleryImages.length > 0) updateData.image = mergedGalleryImages[0]
    
    if (categories) {
      updateData.categories = {
        set: JSON.parse(categories).map(id => ({ id: parseInt(id) }))
      }
    }
    
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
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
    const productId = parseInt(req.params.id)

    await prisma.product.delete({
      where: { id: productId }
    })

    res.json({ message: 'Product deleted', deleted: true })
  } catch (error) {
    // Product is referenced by order_items: keep order history and soft-delete product instead.
    if (error?.code === 'P2003') {
      try {
        const productId = parseInt(req.params.id)
        const product = await prisma.product.update({
          where: { id: productId },
          data: { active: false, featured: false }
        })

        return res.json({
          message: 'Товар связан с заказами и не может быть удалён физически. Товар скрыт из каталога.',
          deleted: false,
          deactivated: true,
          productId: product.id
        })
      } catch (fallbackError) {
        return next(fallbackError)
      }
    }

    next(error)
  }
})

export default router
