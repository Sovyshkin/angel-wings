import { Router } from 'express'
import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'
import { campaignStatus, prepareCampaign, previewCampaign, publicCampaign, validateCampaignSettings } from '../services/customPointsCampaign.js'
import { POINTS_CAMPAIGN_KEY } from '../services/pointsCampaign.js'

const router = Router()
const db = new PrismaClient()
router.use(authenticate, requireAdmin)

const findCampaign = async (id) => {
  const number = Number(id)
  if (!Number.isSafeInteger(number) || number < 1) throw Object.assign(new Error('Некорректный ID'), { status: 400 })
  const campaign = await db.pointsCampaign.findUnique({ where: { id: number } })
  if (!campaign) throw Object.assign(new Error('Кампания не найдена'), { status: 404 })
  return campaign
}

router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Выберите изображение PNG, JPEG или WebP до 5 МБ' })
  res.json({ imageUrl: `/uploads/${req.file.filename}` })
})

router.post('/preview', async (req, res, next) => {
  try {
    const settings = validateCampaignSettings(req.body)
    const { counts } = await previewCampaign(db, settings)
    res.set('Cache-Control', 'no-store').json({ counts })
  } catch (error) { next(error) }
})

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.pointsCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    const campaigns = await Promise.all(rows.map(async row => ({ ...publicCampaign(row), counts: await campaignStatus(db, row) })))
    const legacy = await legacyCampaign()
    if (legacy) campaigns.push(legacy)
    res.set('Cache-Control', 'no-store').json({ campaigns })
  } catch (error) { next(error) }
})

async function legacyCampaign() {
  const counts = await campaignStatus(db, { key: POINTS_CAMPAIGN_KEY })
  if (!counts.offers) return null
  return { id: 'legacy', key: POINTS_CAMPAIGN_KEY, status: 'LEGACY', readOnly: true, createdAt: new Date('2026-10-30T00:00:00.000Z'), settings: { title: 'Подарок 4 000 баллов · ручная акция', amount: 4000, lookbackDays: 45, minPaidOrders: 0, maxPaidOrders: 1, targetUserIds: '', excludeClaimedAnyCampaign: false, roles: ['USER', 'PARTNER'], emailEnabled: true, telegramEnabled: true, siteEnabled: true, requireEmailConsent: false, respectTelegramUnsubscribe: true, validityDays: 30, claimUntil: '', imageUrl: '/uploads/points-campaign-offer.png', emailSubject: 'Для вас доступны 4 000 баллов Angel Wings', emailBody: 'Старая кампания отправлялась серверным скриптом.', telegramBody: 'Старая кампания отправлялась серверным скриптом.', claimTitle: 'Ваши баллы ждут вас', claimBody: 'Баллы начисляются после нажатия «Получить».', buttonText: 'Получить 4 000 баллов' }, counts }
}

router.get('/legacy', async (req, res, next) => {
  try {
    const campaign = await legacyCampaign()
    if (!campaign) return res.status(404).json({ error: 'Историческая акция не найдена' })
    const errors = await db.pointCampaignOffer.findMany({ where: { campaignKey: POINTS_CAMPAIGN_KEY, OR: [{ emailStatus: 'FAILED' }, { telegramStatus: 'FAILED' }, { emailStatus: 'SENDING' }, { telegramStatus: 'SENDING' }] }, select: { userId: true, emailStatus: true, emailError: true, telegramStatus: true, telegramError: true }, take: 30, orderBy: { id: 'desc' } })
    res.set('Cache-Control', 'no-store').json({ campaign, counts: campaign.counts, errors })
  } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try {
    const settings = validateCampaignSettings(req.body)
    const key = `gift-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`
    const campaign = await db.pointsCampaign.create({ data: { key, settingsJson: JSON.stringify(settings), createdById: req.user.id } })
    res.status(201).json({ campaign: publicCampaign(campaign) })
  } catch (error) { next(error) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    if (campaign.status !== 'DRAFT') return res.status(409).json({ error: 'После подготовки настройки кампании нельзя менять' })
    const settings = validateCampaignSettings(req.body)
    const result = await db.pointsCampaign.updateMany({ where: { id: campaign.id, status: 'DRAFT' }, data: { settingsJson: JSON.stringify(settings) } })
    if (!result.count) return res.status(409).json({ error: 'Кампания уже подготовлена' })
    res.json({ campaign: publicCampaign(await findCampaign(campaign.id)) })
  } catch (error) { next(error) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    const [counts, errors] = await Promise.all([
      campaignStatus(db, campaign),
      db.pointCampaignOffer.findMany({ where: { campaignKey: campaign.key, OR: [{ emailStatus: 'FAILED' }, { telegramStatus: 'FAILED' }, { emailStatus: 'SENDING' }, { telegramStatus: 'SENDING' }] }, select: { userId: true, emailStatus: true, emailError: true, telegramStatus: true, telegramError: true }, take: 30, orderBy: { id: 'desc' } })
    ])
    res.set('Cache-Control', 'no-store').json({ campaign: publicCampaign(campaign), counts, errors })
  } catch (error) { next(error) }
})

router.post('/:id/prepare', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    const expected = req.body.expected
    if (!expected || !Number.isInteger(expected.eligible)) return res.status(400).json({ error: 'Сначала обновите предварительный подсчёт' })
    const preview = await prepareCampaign(db, campaign, expected)
    res.json({ campaign: publicCampaign(await findCampaign(campaign.id)), preview, counts: await campaignStatus(db, campaign) })
  } catch (error) { next(error) }
})

router.post('/:id/start', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    const result = await db.pointsCampaign.updateMany({ where: { id: campaign.id, status: { in: ['PREPARED', 'PAUSED', 'FINISHED'] } }, data: { status: 'SENDING' } })
    if (!result.count) return res.status(409).json({ error: 'Кампания уже отправляется или ещё не подготовлена' })
    res.json({ campaign: publicCampaign(await findCampaign(campaign.id)) })
  } catch (error) { next(error) }
})

router.post('/:id/pause', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    await db.pointsCampaign.updateMany({ where: { id: campaign.id, status: 'SENDING' }, data: { status: 'PAUSED' } })
    res.json({ campaign: publicCampaign(await findCampaign(campaign.id)) })
  } catch (error) { next(error) }
})

router.post('/:id/retry', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    if (!['PAUSED', 'FINISHED', 'PREPARED'].includes(campaign.status)) return res.status(409).json({ error: 'Остановите рассылку перед повторной попыткой' })
    const [email, telegram] = await Promise.all([
      db.pointCampaignOffer.updateMany({ where: { campaignKey: campaign.key, emailStatus: 'FAILED' }, data: { emailStatus: 'PENDING', emailError: null } }),
      db.pointCampaignOffer.updateMany({ where: { campaignKey: campaign.key, telegramStatus: 'FAILED' }, data: { telegramStatus: 'PENDING', telegramError: null } })
    ])
    res.json({ reset: { email: email.count, telegram: telegram.count }, counts: await campaignStatus(db, campaign) })
  } catch (error) { next(error) }
})

router.post('/:id/resolve-stuck', async (req, res, next) => {
  try {
    const campaign = await findCampaign(req.params.id)
    if (campaign.status !== 'PAUSED') return res.status(409).json({ error: 'Сначала поставьте кампанию на паузу' })
    const [email, telegram] = await Promise.all([
      db.pointCampaignOffer.updateMany({ where: { campaignKey: campaign.key, emailStatus: 'SENDING' }, data: { emailStatus: 'FAILED', emailError: 'Статус после сбоя неизвестен; перед повтором проверьте доставку' } }),
      db.pointCampaignOffer.updateMany({ where: { campaignKey: campaign.key, telegramStatus: 'SENDING' }, data: { telegramStatus: 'FAILED', telegramError: 'Статус после сбоя неизвестен; перед повтором проверьте доставку' } })
    ])
    res.json({ reset: { email: email.count, telegram: telegram.count }, counts: await campaignStatus(db, campaign) })
  } catch (error) { next(error) }
})

export default router
