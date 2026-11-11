import express, { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'node:url'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { uploadDir } from '../utils/fileUpload.js'
import { FORUM_DEFAULTS, sanitizeForumContent } from '../utils/forumContent.js'
import { BROWSER_ID_FORMAT, createGiveawayTicketId, DUPLICATE_CONTACT_ERROR, existingTicketResult, GIVEAWAY_MARKER, normalizeGiveawayPhone, TICKET_STORAGE_FORMAT } from '../utils/giveawayTicket.js'
import { deliverGiveawayTicketEmail } from '../services/giveawayTicketEmail.js'

const router = Router()
const prisma = new PrismaClient()
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
router.use('/preview-assets', express.static(path.join(repositoryRoot, 'forum-app/dist'), { fallthrough: true, maxAge: '1h' }))
router.use('/preview-assets', express.static(path.join(repositoryRoot, 'forum-app/public'), { fallthrough: true, maxAge: '1h' }))
const statuses = new Set(['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'])
const clean = (value, limit) => String(value ?? '').trim().slice(0, limit)

async function findExistingTicket(email, phone) {
  const existing = await prisma.forumApplication.findFirst({
    where: { OR: [{ giveawayEmail: email }, { giveawayPhone: phone }] },
    select: { id: true, ticketId: true, giveawayEmail: true, giveawayPhone: true }
  })
  if (existing) return { applicationId: existing.id, result: existingTicketResult(existing, email, phone) }

  // Applications submitted just before the schema upgrade have no ticket yet.
  const previous = await prisma.forumApplication.findFirst({
    where: { email, message: { startsWith: GIVEAWAY_MARKER } },
    orderBy: { id: 'asc' },
    select: { id: true, phone: true, ticketId: true }
  })
  if (!previous) return null
  if (normalizeGiveawayPhone(previous.phone) !== phone) return { result: DUPLICATE_CONTACT_ERROR }
  const claimed = await prisma.forumApplication.update({
    where: { id: previous.id },
    data: { ticketId: previous.ticketId || createGiveawayTicketId(), giveawayEmail: email, giveawayPhone: phone },
    select: { id: true, ticketId: true, giveawayEmail: true, giveawayPhone: true }
  })
  return { applicationId: claimed.id, result: existingTicketResult(claimed, email, phone) }
}

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
    const browserId = clean(req.body?.browserId, 36).toLowerCase()
    if (!BROWSER_ID_FORMAT.test(browserId)) return res.status(400).json({ error: 'Браузер не сохранил идентификатор. Разрешите хранение данных сайта и попробуйте снова.' })
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
    if (!/^7\d{10}$/.test(normalizeGiveawayPhone(phone))) return res.status(400).json({ error: 'Укажите номер из 10 цифр после +7' })
    if (req.body?.consent !== true) return res.status(400).json({ error: 'Подтвердите согласие на обработку данных' })
    if (settings.form.fields.some(field => field.visible && field.required && field.key === 'company') && !company) return res.status(400).json({ error: 'Укажите компанию' })
    if (settings.form.fields.some(field => field.visible && field.required && field.key === 'position') && !position) return res.status(400).json({ error: 'Укажите должность' })
    const giveawayPhone = normalizeGiveawayPhone(phone)
    const message = [GIVEAWAY_MARKER, ...extraFields.filter(field => field.value).map(field => `${field.label}: ${field.value}`)].join('\n').slice(0, 3000)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const browserTicket = await prisma.forumBrowserTicket.findUnique({ where: { browserId }, select: { application: { select: { id: true, ticketId: true } } } })
        if (browserTicket?.application.ticketId) {
          const delivery = await deliverGiveawayTicketEmail(prisma, browserTicket.application.id)
          return res.status(200).json({ ok: true, ticketId: browserTicket.application.ticketId, alreadyRegistered: true, ...delivery })
        }
        const existing = await findExistingTicket(email, giveawayPhone)
        if (existing) {
          if (existing.result.ok) await prisma.forumBrowserTicket.create({ data: { browserId, applicationId: existing.applicationId } })
          const delivery = existing.result.ok ? await deliverGiveawayTicketEmail(prisma, existing.applicationId) : null
          return res.status(existing.result.ok ? 200 : 409).json({ ...existing.result, ...delivery })
        }
        const application = await prisma.forumApplication.create({
          data: { name, phone, email, company, position, message, consentAt: new Date(), ticketId: createGiveawayTicketId(), giveawayEmail: email, giveawayPhone, browserTickets: { create: { browserId } } },
          select: { id: true, ticketId: true }
        })
        const delivery = await deliverGiveawayTicketEmail(prisma, application.id)
        return res.status(201).json({ ok: true, ticketId: application.ticketId, alreadyRegistered: false, ...delivery })
      } catch (error) {
        if (error?.code !== 'P2002' || attempt === 2) throw error
      }
    }
  } catch (error) { next(error) }
})

router.get('/applications/ticket/:ticketId', async (req, res, next) => {
  try {
    const ticketId = String(req.params.ticketId || '').toUpperCase()
    if (!TICKET_STORAGE_FORMAT.test(ticketId)) return res.status(404).json({ error: 'Билет не найден' })
    const application = await prisma.forumApplication.findUnique({ where: { ticketId }, select: { ticketId: true } })
    res.set('Cache-Control', 'no-store')
    if (!application) return res.status(404).json({ error: 'Билет не найден' })
    res.json({ ticketId: application.ticketId })
  } catch (error) { next(error) }
})

router.post('/applications/ticket/claim', async (req, res, next) => {
  try {
    const browserId = clean(req.body?.browserId, 36).toLowerCase()
    const ticketId = clean(req.body?.ticketId, 32).toUpperCase()
    if (!BROWSER_ID_FORMAT.test(browserId) || !TICKET_STORAGE_FORMAT.test(ticketId)) return res.status(400).json({ error: 'Некорректный номер билета' })
    const linked = await prisma.forumBrowserTicket.findUnique({ where: { browserId }, select: { application: { select: { id: true, ticketId: true } } } })
    if (linked) return res.json({ ticketId: linked.application.ticketId, ...await deliverGiveawayTicketEmail(prisma, linked.application.id) })
    const application = await prisma.forumApplication.findUnique({ where: { ticketId }, select: { id: true, ticketId: true } })
    if (!application) return res.status(404).json({ error: 'Билет не найден' })
    try {
      await prisma.forumBrowserTicket.create({ data: { browserId, applicationId: application.id } })
      return res.json({ ticketId: application.ticketId, ...await deliverGiveawayTicketEmail(prisma, application.id) })
    } catch (error) {
      if (error?.code !== 'P2002') throw error
      const current = await prisma.forumBrowserTicket.findUnique({ where: { browserId }, select: { application: { select: { id: true, ticketId: true } } } })
      if (current) return res.json({ ticketId: current.application.ticketId, ...await deliverGiveawayTicketEmail(prisma, current.application.id) })
      throw error
    }
  } catch (error) { next(error) }
})

router.post('/applications/ticket/email', async (req, res, next) => {
  try {
    const browserId = clean(req.body?.browserId, 36).toLowerCase()
    const ticketId = clean(req.body?.ticketId, 32).toUpperCase()
    if (!BROWSER_ID_FORMAT.test(browserId) || !TICKET_STORAGE_FORMAT.test(ticketId)) return res.status(400).json({ error: 'Некорректный номер билета' })
    const linked = await prisma.forumBrowserTicket.findUnique({ where: { browserId }, select: { application: { select: { id: true, ticketId: true } } } })
    if (!linked || linked.application.ticketId !== ticketId) return res.status(404).json({ error: 'Билет не найден в этом браузере' })
    res.json(await deliverGiveawayTicketEmail(prisma, linked.application.id, { force: true }))
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
