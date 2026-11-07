import express, { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'node:url'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { uploadDir } from '../utils/fileUpload.js'
import { FORUM_DEFAULTS, sanitizeForumContent } from '../utils/forumContent.js'

const router = Router()
const prisma = new PrismaClient()
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
router.use('/preview-assets', express.static(path.join(repositoryRoot, 'forum-app/dist'), { fallthrough: true, maxAge: '1h' }))
router.use('/preview-assets', express.static(path.join(repositoryRoot, 'forum-app/public'), { fallthrough: true, maxAge: '1h' }))
const statuses = new Set(['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'])
const clean = (value, limit) => String(value ?? '').trim().slice(0, limit)

const mediaUpload = multer({
  storage: multer.diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const allowed = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm' }
    cb(null, allowed[ext] === file.mimetype)
  }
})

router.get('/', async (_req, res, next) => {
  try {
    const page = await prisma.forumPage.findUnique({ where: { id: 1 } })
    res.set('Cache-Control', 'no-store')
    res.json({ content: page ? sanitizeForumContent(JSON.parse(page.content)) : FORUM_DEFAULTS, updatedAt: page?.updatedAt || null })
  } catch (error) { next(error) }
})

router.put('/admin/content', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const content = sanitizeForumContent(req.body?.content)
    if (!content.form.fields.some(field => field.visible && (field.key === 'phone' || field.key === 'email'))) {
      return res.status(400).json({ error: 'Покажите в форме телефон или email для связи' })
    }
    const page = await prisma.forumPage.upsert({ where: { id: 1 }, create: { id: 1, content: JSON.stringify(content) }, update: { content: JSON.stringify(content) } })
    res.json({ content, updatedAt: page.updatedAt })
  } catch (error) {
    if (error.message === 'Некорректное содержимое страницы') return res.status(400).json({ error: error.message })
    next(error)
  }
})

router.post('/admin/media', authenticate, requireAdmin, (req, res) => {
  mediaUpload.single('file')(req, res, error => {
    if (error) return res.status(400).json({ error: 'Загрузите JPG, PNG, WEBP, GIF, MP4 или WEBM до 50 МБ' })
    if (!req.file) return res.status(400).json({ error: 'Выберите файл' })
    res.status(201).json({ url: `/uploads/${req.file.filename}` })
  })
})

router.post('/applications', async (req, res, next) => {
  try {
    if (req.body?.website) return res.status(400).json({ error: 'Не удалось проверить форму' })
    const name = clean(req.body?.name, 120)
    const phone = clean(req.body?.phone, 60)
    const email = clean(req.body?.email, 180).toLowerCase()
    const company = clean(req.body?.company, 180)
    const position = clean(req.body?.position, 180)
    const page = await prisma.forumPage.findUnique({ where: { id: 1 }, select: { content: true } })
    const settings = page ? sanitizeForumContent(JSON.parse(page.content)) : FORUM_DEFAULTS
    const extraInput = req.body?.extraFields && typeof req.body.extraFields === 'object' && !Array.isArray(req.body.extraFields) ? req.body.extraFields : {}
    const extraFields = []
    for (const field of settings.form.fields.filter(field => field.visible && !['name', 'phone', 'email', 'company', 'position'].includes(field.key))) {
      const input = extraInput[field.key]
      let value = ''
      if (field.type === 'multiselect') {
        if (input !== undefined && (!Array.isArray(input) || input.length > field.options.length)) return res.status(400).json({ error: `Проверьте поле «${field.label}»` })
        const selected = [...new Set(input || [])]
        if (selected.some(option => !field.options.includes(option))) return res.status(400).json({ error: `Проверьте поле «${field.label}»` })
        value = selected.join(', ')
      } else {
        value = clean(input, 250).replace(/[\r\n]+/g, ' ')
        if (field.type === 'select' && value && !field.options.includes(value)) return res.status(400).json({ error: `Проверьте поле «${field.label}»` })
      }
      if (field.required && !value) return res.status(400).json({ error: `Заполните поле «${field.label}»` })
      extraFields.push({ label: field.label, value })
    }
    if (name.length < 3) return res.status(400).json({ error: 'Укажите ФИО' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Укажите корректный email' })
    if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Укажите корректный телефон' })
    if (req.body?.consent !== true) return res.status(400).json({ error: 'Подтвердите согласие на обработку данных' })
    if (settings.form.fields.some(field => field.visible && field.required && field.key === 'company') && !company) return res.status(400).json({ error: 'Укажите компанию' })
    if (settings.form.fields.some(field => field.visible && field.required && field.key === 'position') && !position) return res.status(400).json({ error: 'Укажите должность' })
    const duplicate = await prisma.forumApplication.findFirst({ where: { createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, OR: [{ email }, { phone }] }, select: { id: true } })
    if (duplicate) return res.status(409).json({ error: 'Заявка с этими контактами уже получена. Мы скоро свяжемся с вами.' })
    const message = extraFields.filter(field => field.value).map(field => `${field.label}: ${field.value}`).join('\n').slice(0, 3000)
    const application = await prisma.forumApplication.create({ data: { name, phone, email, company, position, message, consentAt: new Date() }, select: { id: true } })
    res.status(201).json({ ok: true, id: application.id })
  } catch (error) { next(error) }
})

router.get('/admin/applications', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = clean(req.query.status, 30).toUpperCase()
    const where = statuses.has(status) ? { status } : {}
    const [applications, total, newCount] = await Promise.all([
      prisma.forumApplication.findMany({ where, orderBy: { createdAt: 'desc' }, skip: Math.max(0, Number(req.query.offset) || 0), take: Math.min(100, Math.max(1, Number(req.query.limit) || 30)) }),
      prisma.forumApplication.count({ where }), prisma.forumApplication.count({ where: { status: 'NEW' } })
    ])
    res.json({ applications, total, newCount })
  } catch (error) { next(error) }
})

router.patch('/admin/applications/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const status = clean(req.body?.status, 30).toUpperCase()
    if (!Number.isInteger(id) || id < 1 || !statuses.has(status)) return res.status(400).json({ error: 'Некорректные данные заявки' })
    const application = await prisma.forumApplication.update({ where: { id }, data: { status, adminNote: clean(req.body?.adminNote, 1200) } })
    res.json({ application })
  } catch (error) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Заявка не найдена' })
    next(error)
  }
})
export default router
