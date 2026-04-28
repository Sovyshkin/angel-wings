import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        },
        products: {
          where: { active: true },
          take: 1,
          select: { image: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    const result = categories.map(cat => ({
      term_id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image || cat.products[0]?.image,
      active: cat.active,
      count: cat._count.products
    }))
    
    res.json({ categories: result })
  } catch (error) {
    next(error)
  }
})

router.get('/:slug', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          where: { active: true },
          include: {
            categories: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    })
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    
    res.json({ category })
  } catch (error) {
    next(error)
  }
})

router.post('/', authenticate, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        parentId: parentId ? parseInt(parentId) : null
      }
    })
    
    res.status(201).json({ category })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', authenticate, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, parentId, active } = req.body
    
    const updateData = {
      name,
      description
    }
    
    if (parentId !== undefined) {
      updateData.parentId = parentId ? parseInt(parentId) : null
    }
    
    if (active !== undefined) {
      updateData.active = active === 'true' || active === true
    }
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`
    }
    
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    })
    
    res.json({ category })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.category.delete({
      where: { id: parseInt(req.params.id) }
    })
    
    res.json({ message: 'Category deleted' })
  } catch (error) {
    next(error)
  }
})

export default router