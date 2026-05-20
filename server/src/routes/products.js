import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'

const router = Router()
const prisma = new PrismaClient()

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
    const { title, description, price, comparePrice, sku, stock, specs, categories, featured, active, purity, volume, country } = req.body
    const mainFile = req.files?.image?.[0] || null
    const galleryFiles = req.files?.images || []
    const galleryImages = galleryFiles.map(file => `/uploads/${file.filename}`)
    const mainImage = mainFile ? `/uploads/${mainFile.filename}` : (galleryImages[0] || null)
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        sku,
        stock: parseInt(stock) || 0,
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
    const { title, description, price, comparePrice, sku, stock, specs, categories, featured, active, purity, volume, country, existingImages } = req.body
    const mainFile = req.files?.image?.[0] || null
    const galleryFiles = req.files?.images || []
    const persistedImages = parseImagesField(existingImages)
    const uploadedGalleryImages = galleryFiles.map(file => `/uploads/${file.filename}`)
    const mergedGalleryImages = [...persistedImages, ...uploadedGalleryImages]
    
    const updateData = {
      title,
      description,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      sku,
      stock: parseInt(stock) || 0,
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
    
    res.json({ product })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.product.delete({
      where: { id: parseInt(req.params.id) }
    })
    
    res.json({ message: 'Product deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
