import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { getRecoverySettings, recoveryPrisma as prisma, runRecoverySweep, scheduleRecoveryTestEmail } from '../services/recovery.js'

export const recoveryRouter = Router()
export const adminRecoveryRouter = Router()

function normalizeItems(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 50).flatMap(item => {
    const productId = Number(item?.productId || item?.id)
    if (!Number.isInteger(productId)) return []
    return [{ productId, quantity: Math.min(99, Math.max(1, Number.parseInt(item.quantity, 10) || 1)), selectedDosage: String(item.selectedDosage || '').trim() || null }]
  }).sort((a, b) => a.productId - b.productId || String(a.selectedDosage).localeCompare(String(b.selectedDosage)))
}

recoveryRouter.put('/cart', authenticate, async (req, res, next) => {
  try {
    const items = normalizeItems(req.body?.items)
    const marketingConsent = req.body?.marketingConsent === true
    await prisma.user.update({
      where: { id: req.user.id },
      data: marketingConsent
        ? { marketingConsentAt: new Date(), marketingUnsubscribedAt: null }
        : { marketingConsentAt: null }
    })

    const serialized = JSON.stringify(items)
    const cartHash = crypto.createHash('sha256').update(serialized).digest('hex')
    const existing = await prisma.recoveryCart.findUnique({ where: { userId: req.user.id } })
    const changed = existing?.cartHash !== cartHash
    const cart = await prisma.recoveryCart.upsert({
      where: { userId: req.user.id },
      update: {
        email: req.user.email, items: serialized, cartHash, active: items.length > 0,
        lastActivityAt: new Date(), processingAt: null,
        ...(changed ? { reminderSentAt: null } : {})
      },
      create: { userId: req.user.id, email: req.user.email, items: serialized, cartHash, active: items.length > 0 }
    })
    res.json({ ok: true, active: cart.active })
  } catch (error) {
    next(error)
  }
})

recoveryRouter.get('/unsubscribe', async (req, res) => {
  try {
    const payload = jwt.verify(String(req.query.token || ''), process.env.JWT_SECRET)
    if (payload.purpose !== 'recovery_unsubscribe' || !payload.userId) throw new Error('Invalid token')
    await prisma.$transaction([
      prisma.user.update({ where: { id: Number(payload.userId) }, data: { marketingConsentAt: null, marketingUnsubscribedAt: new Date() } }),
      prisma.recoveryCart.updateMany({ where: { userId: Number(payload.userId) }, data: { active: false, processingAt: null } })
    ])
    res.type('html').send('<!doctype html><meta charset="utf-8"><title>Angel Wings</title><style>body{font-family:Arial,sans-serif;background:#0f1118;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:520px;padding:40px;border:1px solid #303441;border-radius:24px;background:#171a23}p{color:#b8bece;line-height:1.6}</style><div class="card"><h1>Напоминания отключены</h1><p>Мы больше не будем отправлять вам письма о сохранённой корзине и неоплаченном заказе.</p></div>')
  } catch {
    res.status(400).type('html').send('<!doctype html><meta charset="utf-8"><h1>Ссылка недействительна или устарела</h1>')
  }
})

adminRecoveryRouter.get('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [settings, logs] = await Promise.all([
      getRecoverySettings(),
      prisma.recoveryEmailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    ])
    res.json({ settings, logs })
  } catch (error) {
    next(error)
  }
})

adminRecoveryRouter.put('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const cartDelayHours = Math.min(720, Math.max(1, Number.parseInt(req.body?.cartDelayHours, 10) || 24))
    const unpaidOrderDelayHours = Math.min(168, Math.max(1, Number.parseInt(req.body?.unpaidOrderDelayHours, 10) || 3))
    const settings = await prisma.recoverySettings.upsert({
      where: { id: 1 },
      update: { cartEnabled: req.body?.cartEnabled !== false, cartDelayHours, unpaidOrderEnabled: req.body?.unpaidOrderEnabled !== false, unpaidOrderDelayHours },
      create: { id: 1, cartEnabled: req.body?.cartEnabled !== false, cartDelayHours, unpaidOrderEnabled: req.body?.unpaidOrderEnabled !== false, unpaidOrderDelayHours }
    })
    res.json({ settings })
  } catch (error) {
    next(error)
  }
})

adminRecoveryRouter.post('/run', authenticate, requireAdmin, async (req, res, next) => {
  try {
    res.json({ ok: true, result: await runRecoverySweep() })
  } catch (error) {
    next(error)
  }
})

adminRecoveryRouter.post('/test-email', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const test = await scheduleRecoveryTestEmail({
      email: req.body?.email,
      source: String(req.body?.source || 'AUTO').toUpperCase(),
      delayMinutes: 1
    })
    res.status(202).json({ ok: true, test })
  } catch (error) {
    next(error)
  }
})
