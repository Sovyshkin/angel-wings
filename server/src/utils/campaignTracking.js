import crypto from 'node:crypto'

export function campaignClickUrl(noticeId) {
  const id = Number(noticeId)
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`campaign-click:${id}`).digest('hex')
  return `https://angel-wings.ru/api/marketing-notices/click/${id}.${signature}`
}

export function validCampaignClickToken(token) {
  const match = /^(\d+)\.([a-f\d]{64})$/.exec(String(token || ''))
  if (!match) return null
  const expected = campaignClickUrl(Number(match[1])).split('.').at(-1)
  return crypto.timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(expected, 'hex')) ? Number(match[1]) : null
}
