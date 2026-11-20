const SITE_ORIGIN = 'https://angel-wings.ru'
const AUDIENCES = new Set(['all', 'clients', 'partners', 'blog'])
const TYPES = new Set(['NEW_PRODUCT', 'PRODUCT_DISCOUNT', 'SALE', 'NEWS', 'CUSTOM'])
const TYPE_LABELS = {
  NEW_PRODUCT: 'НОВИНКА',
  PRODUCT_DISCOUNT: 'СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ',
  SALE: 'АКЦИЯ',
  NEWS: 'НОВОСТИ ANGEL WINGS',
  CUSTOM: 'ANGEL WINGS'
}
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const bad = message => { throw Object.assign(new Error(message), { status: 400 }) }

function siteUrl(value, label) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  let parsed
  try { parsed = new URL(raw, SITE_ORIGIN) } catch { bad(`Проверьте поле «${label}»`) }
  if (parsed.origin !== SITE_ORIGIN || !['http:', 'https:'].includes(parsed.protocol) || !raw.startsWith('/') && !raw.startsWith(SITE_ORIGIN)) bad(`В поле «${label}» нужна ссылка на angel-wings.ru`)
  return parsed.href
}

export function validateEmailCampaign(input = {}) {
  const subject = String(input.subject || '').trim()
  const body = String(input.body || '').trim()
  const audience = String(input.audience || 'all').trim()
  const type = String(input.type || 'CUSTOM').trim()
  const headline = String(input.headline || subject).trim()
  const buttonText = String(input.buttonText || '').trim()
  const buttonUrl = siteUrl(input.buttonUrl, 'Ссылка кнопки')
  const imageUrl = siteUrl(input.imageUrl, 'Изображение')
  if (!AUDIENCES.has(audience)) bad('Выберите аудиторию рассылки')
  if (!TYPES.has(type)) bad('Выберите тип письма')
  if (subject.length < 3 || subject.length > 200) bad('Тема письма: от 3 до 200 символов')
  if (headline.length < 3 || headline.length > 160) bad('Заголовок письма: от 3 до 160 символов')
  if (body.length < 10 || body.length > 5000) bad('Текст письма: от 10 до 5000 символов')
  if (buttonText.length > 80 || Boolean(buttonText) !== Boolean(buttonUrl)) bad('Для кнопки укажите и текст, и ссылку')
  if (imageUrl && !/\.(png|jpe?g|webp)(\?.*)?$/i.test(new URL(imageUrl).pathname)) bad('Изображение должно быть PNG, JPEG или WebP')
  return { subject, body, audience, type, headline, buttonText, buttonUrl, imageUrl }
}

export function renderEmailCampaign(campaign, name = 'клиент') {
  const person = String(name || 'клиент').trim().slice(0, 100)
  const body = campaign.body.replace(/\{\{\s*name\s*\}\}/gi, person)
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>')
  const image = campaign.imageUrl ? `<img src="${escapeHtml(campaign.imageUrl)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:16px;margin:0 0 24px">` : ''
  const button = campaign.buttonUrl ? `<a href="${escapeHtml(campaign.buttonUrl)}" style="display:inline-block;padding:15px 24px;border-radius:12px;background:#a7b9ff;color:#101832;text-decoration:none;font-weight:700">${escapeHtml(campaign.buttonText)}</a>` : ''
  const html = `<div style="margin:0;padding:32px 16px;background:#eef2fb;font:16px/1.6 Arial,sans-serif;color:#17213a"><div style="max-width:600px;margin:auto;padding:32px;background:#ffffff;border:1px solid #dce3f3;border-radius:22px"><div style="font-size:13px;font-weight:800;letter-spacing:.14em;color:#5d72b7">ANGEL WINGS</div><p style="margin:24px 0 8px;font-size:12px;letter-spacing:.12em;color:#6e7da0;font-weight:700">${TYPE_LABELS[campaign.type] || TYPE_LABELS.CUSTOM}</p><h1 style="margin:0 0 22px;font-size:28px;line-height:1.25;color:#101a32">${escapeHtml(campaign.headline)}</h1>${image}<div style="margin:0 0 28px;white-space:normal">${safeBody}</div>${button}<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e7ecf5;font-size:12px;color:#7e879a">Angel Wings · angel-wings.ru</p></div></div>`
  const text = `${campaign.headline}\n\n${body}${campaign.buttonUrl ? `\n\n${campaign.buttonText}: ${campaign.buttonUrl}` : ''}`
  return { html, text }
}
