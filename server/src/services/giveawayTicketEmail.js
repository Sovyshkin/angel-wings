import emailService from './email.js'

const COOLDOWN_MS = 60_000
const DEFAULT_PAGE_URL = 'https://forum.angel-wings.ru/'

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

export function buildGiveawayTicketEmail({ name, ticketId }) {
  const safeName = escapeHtml(name)
  const safeTicket = escapeHtml(ticketId)
  const configuredUrl = String(process.env.FORUM_PUBLIC_URL || DEFAULT_PAGE_URL).trim()
  const pageUrl = /^https:\/\/[^\s"<>]+$/i.test(configuredUrl) ? configuredUrl : DEFAULT_PAGE_URL
  const safePageUrl = escapeHtml(pageUrl)
  return {
    subject: 'Ваш билет на розыгрыш 50 000 ₽ — Angel Wings',
    text: [
      `Здравствуйте, ${name}!`,
      '',
      'Ваша заявка на розыгрыш 50 000 ₽ принята.',
      `Номер вашего билета: ${ticketId}`,
      '',
      'Сохраните этот номер. Он также доступен на странице розыгрыша в браузере, с которого вы подали заявку.',
      `Страница розыгрыша: ${pageUrl}`,
      '',
      'Это письмо подтверждает участие и не означает победу.',
      'Angel Wings'
    ].join('\n'),
    html: `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#071126;color:#eef4ff;font-family:Arial,Helvetica,sans-serif">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#071126"><tr><td align="center" style="padding:32px 12px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border:1px solid #304a7e;border-radius:24px;background:#0d1b39;overflow:hidden">
            <tr><td style="padding:28px 32px;border-bottom:1px solid #263d69;font-size:15px;font-weight:800;letter-spacing:3px;color:#e7f0ff">ANGEL WINGS <span style="color:#88b8ff">✦</span></td></tr>
            <tr><td style="padding:36px 32px 12px">
              <div style="font-size:11px;font-weight:700;letter-spacing:2.5px;color:#9abaff">РОЗЫГРЫШ ANGEL WINGS</div>
              <div style="padding-top:13px;font-size:36px;line-height:1.1;font-weight:800;color:#ffffff">Ваш билет на<br><span style="color:#a9c4ff">50 000 ₽</span></div>
              <p style="margin:20px 0 0;font-size:15px;line-height:1.7;color:#c4d3ef">Здравствуйте, ${safeName}! Ваша заявка принята. Сохраните номер билета — он понадобится, чтобы узнать результаты розыгрыша.</p>
            </td></tr>
            <tr><td style="padding:20px 32px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #7aa9fa;border-radius:18px;background:#162e5c"><tr><td align="center" style="padding:25px 16px">
                <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#a9c9ff">НОМЕР ВАШЕГО БИЛЕТА</div>
                <div style="padding-top:11px;font-size:22px;line-height:1.35;font-weight:800;letter-spacing:1px;color:#ffffff;word-break:break-all">${safeTicket}</div>
              </td></tr></table>
            </td></tr>
            <tr><td style="padding:8px 32px 38px">
              <p style="margin:0 0 22px;font-size:13px;line-height:1.65;color:#aebfdf">Билет также сохранён на странице розыгрыша в браузере, с которого вы подали заявку.</p>
              <a href="${safePageUrl}" style="display:inline-block;padding:15px 24px;border-radius:30px;background:#a9c3ff;color:#0a1935;font-size:14px;font-weight:800;text-decoration:none">Открыть страницу розыгрыша</a>
            </td></tr>
            <tr><td style="padding:20px 32px;border-top:1px solid #263d69;font-size:12px;line-height:1.6;color:#91a8cf">Это письмо подтверждает участие и не означает победу.<br>© Angel Wings</td></tr>
          </table>
        </td></tr></table>
      </body></html>`
  }
}

export async function deliverGiveawayTicketEmail(db, applicationId, { force = false, sendMail = message => emailService.sendMail(message), now = new Date() } = {}) {
  const application = await db.forumApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, name: true, email: true, ticketId: true, ticketEmailSentAt: true, ticketEmailLastAttemptAt: true }
  })
  if (!application?.ticketId) return { emailStatus: 'unavailable' }
  if (application.ticketEmailSentAt && !force) return { emailStatus: 'sent' }
  const cutoff = new Date(now.getTime() - COOLDOWN_MS)
  const claimed = await db.forumApplication.updateMany({
    where: {
      id: applicationId,
      ...(force ? {} : { ticketEmailSentAt: null }),
      OR: [{ ticketEmailLastAttemptAt: null }, { ticketEmailLastAttemptAt: { lt: cutoff } }]
    },
    data: { ticketEmailLastAttemptAt: now, ticketEmailAttempts: { increment: 1 }, ticketEmailError: null }
  })
  if (!claimed.count) {
    const current = await db.forumApplication.findUnique({ where: { id: applicationId }, select: { ticketEmailSentAt: true, ticketEmailLastAttemptAt: true } })
    if (current?.ticketEmailSentAt && !force) return { emailStatus: 'sent' }
    return { emailStatus: 'cooldown', retryAfterSeconds: Math.max(1, Math.ceil(((current?.ticketEmailLastAttemptAt?.getTime() ?? now.getTime()) + COOLDOWN_MS - now.getTime()) / 1000)) }
  }

  try {
    await sendMail({ to: application.email, ...buildGiveawayTicketEmail(application) })
    await db.forumApplication.update({ where: { id: applicationId }, data: { ticketEmailSentAt: new Date(), ticketEmailError: null } })
    return { emailStatus: 'sent' }
  } catch (error) {
    const code = String(error?.code || error?.name || 'EMAIL_DELIVERY_FAILED').slice(0, 80)
    console.error('[GIVEAWAY] Ticket email failed', { applicationId, code })
    await db.forumApplication.update({ where: { id: applicationId }, data: { ticketEmailError: code } })
    return { emailStatus: 'failed', retryAfterSeconds: COOLDOWN_MS / 1000 }
  }
}

export function startGiveawayTicketEmailWorker(db) {
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      const cutoff = new Date(Date.now() - 2 * 60_000)
      const pending = await db.forumApplication.findMany({
        where: {
          ticketId: { not: null }, ticketEmailSentAt: null, ticketEmailAttempts: { lt: 12 },
          OR: [{ ticketEmailLastAttemptAt: null }, { ticketEmailLastAttemptAt: { lt: cutoff } }]
        },
        orderBy: { createdAt: 'asc' }, take: 20, select: { id: true }
      })
      for (const application of pending) await deliverGiveawayTicketEmail(db, application.id)
    } catch (error) {
      console.error('[GIVEAWAY] Ticket email worker failed', error?.code || error?.message || error)
    } finally { running = false }
  }
  setTimeout(run, 20_000).unref?.()
  setInterval(run, 2 * 60_000).unref?.()
}
