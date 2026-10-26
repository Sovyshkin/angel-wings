import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import sanitizeHtml from 'sanitize-html'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'
import { generateUniqueSlug, slugify } from '../utils/slug.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import emailService from '../services/email.js'

const router = Router()
const prisma = new PrismaClient()
const siteUrl = 'https://angel-wings.ru'
const postSelect = { id: true, title: true, slug: true, excerpt: true, cover: true, coverAlt: true, author: true, categoryId: true, category: true, status: true, featured: true, metaTitle: true, metaDescription: true, readingMinutes: true, publishedAt: true, createdAt: true, updatedAt: true }
const allowedTags = ['p', 'br', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr']
const cleanContent = html => sanitizeHtml(String(html || ''), {
  allowedTags,
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'title', 'width', 'height'],
    h2: ['id'], h3: ['id'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: {
    a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' } })
  },
  exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.alt?.trim()
})
const plain = html => sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim()
const readingMinutes = html => Math.max(1, Math.ceil(plain(html).split(/\s+/).filter(Boolean).length / 180))
const absoluteImage = path => path?.startsWith('/') ? `${siteUrl}${path}` : path
const page = value => Math.max(1, Math.min(10000, Number.parseInt(value, 10) || 1))
const xml = value => String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char])
const html = xml
const siteDist = process.env.SITE_DIST_DIR || path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../vue-app/dist')
const subscribeAttempts = new Map()

async function sendRenderedPage(res, { title, description, url, image, body, article }) {
  let template
  try { template = await fs.readFile(path.join(siteDist, 'index.html'), 'utf8') }
  catch { return res.status(503).send('Сайт временно недоступен') }
  const meta = `<meta name="description" content="${html(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${html(url)}"><meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:title" content="${html(title)}"><meta property="og:description" content="${html(description)}"><meta property="og:url" content="${html(url)}"><meta property="og:image" content="${html(image)}">`
  const jsonld = article ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description, image, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { '@type': 'Person', name: article.author }, publisher: { '@type': 'Organization', name: 'ANGEL WINGS', url: siteUrl }, mainEntityOfPage: url }).replace(/</g, '\\u003c')}</script>` : ''
  res.set('Cache-Control', 'no-cache').type('html').send(template.replace(/<title>[^<]*<\/title>/, `<title>${html(title)} — ANGEL WINGS</title>${meta}${jsonld}`).replace('<div id="app"></div>', `<div id="app">${body}</div>`))
}

router.get('/render', async (req, res, next) => {
  try {
    const posts = await prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, select: { title: true, slug: true, excerpt: true, cover: true, coverAlt: true }, orderBy: { publishedAt: 'desc' }, take: 24 })
    const body = `<main><h1>Блог ANGEL WINGS — знания о пептидах</h1><p>Научные статьи, практические советы и исследования.</p>${posts.map(post => `<article><h2><a href="/blog/${html(post.slug)}">${html(post.title)}</a></h2>${post.cover ? `<img src="${html(post.cover)}" alt="${html(post.coverAlt)}" width="600">` : ''}<p>${html(post.excerpt)}</p></article>`).join('')}</main>`
    await sendRenderedPage(res, { title: 'Блог о пептидах', description: 'Научные статьи и материалы о пептидах от ANGEL WINGS.', url: `${siteUrl}/blog`, image: `${siteUrl}/blog-assets/dna-molecules.webp`, body })
  } catch (error) { next(error) }
})

router.get('/render/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({ where: { slug: req.params.slug, status: 'PUBLISHED' }, include: { category: true } })
    if (!post) return res.status(404).type('html').send('<h1>Статья не найдена</h1>')
    const url = `${siteUrl}/blog/${post.slug}`
    const image = absoluteImage(post.cover) || `${siteUrl}/blog-assets/dna-molecules.webp`
    const body = `<article><a href="/blog">Блог</a><h1>${html(post.title)}</h1><p>${html(post.excerpt)}</p><p>${html(post.category?.name || '')} · ${html(post.author)} · ${html(post.publishedAt?.toISOString() || '')}</p>${post.cover ? `<img src="${html(post.cover)}" alt="${html(post.coverAlt)}" width="900">` : ''}${post.content}</article>`
    await sendRenderedPage(res, { title: post.metaTitle || post.title, description: post.metaDescription || post.excerpt, url, image, body, article: post })
  } catch (error) { next(error) }
})

router.get('/categories', async (req, res, next) => {
  try {
    res.json(await prisma.blogCategory.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] }))
  } catch (error) { next(error) }
})

router.get('/posts', async (req, res, next) => {
  try {
    const currentPage = page(req.query.page)
    const search = String(req.query.search || '').trim().slice(0, 100)
    const category = String(req.query.category || '').trim()
    const where = {
      status: 'PUBLISHED',
      ...(!search && !category ? { featured: false } : {}),
      ...(search ? { OR: [{ title: { contains: search } }, { excerpt: { contains: search } }, { content: { contains: search } }] } : {}),
      ...(category ? { category: { slug: category } } : {})
    }
    const orderBy = req.query.sort === 'oldest' ? [{ publishedAt: 'asc' }] : [{ publishedAt: 'desc' }]
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({ where, select: postSelect, orderBy, skip: (currentPage - 1) * 9, take: 9 })
    ])
    res.json({ posts, total, page: currentPage, pages: Math.max(1, Math.ceil(total / 9)) })
  } catch (error) { next(error) }
})

router.get('/featured', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({ where: { status: 'PUBLISHED', featured: true }, select: postSelect, orderBy: { publishedAt: 'desc' } })
    res.json(post)
  } catch (error) { next(error) }
})

router.post('/subscribe', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || req.body.consent !== true) {
      return res.status(400).json({ error: 'Укажите корректный email и согласие на рассылку' })
    }
    const key = req.ip || 'unknown'
    const now = Date.now()
    const recent = (subscribeAttempts.get(key) || []).filter(time => now - time < 10 * 60_000)
    if (recent.length >= 5) return res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' })
    if (subscribeAttempts.size > 5000) subscribeAttempts.clear()
    subscribeAttempts.set(key, [...recent, now])
    const existing = await prisma.blogSubscriber.findUnique({ where: { email } })
    if (existing?.active) return res.json({ message: 'Проверьте почту: если адрес ещё не подписан, мы отправим подтверждение.' })
    const token = crypto.randomBytes(32).toString('hex')
    const confirmationTokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await prisma.blogSubscriber.upsert({ where: { email }, create: { email, confirmationTokenHash, confirmationExpiresAt: new Date(now + 24 * 60 * 60_000) }, update: { confirmationTokenHash, confirmationExpiresAt: new Date(now + 24 * 60 * 60_000) } })
    await emailService.sendMail({ to: email, subject: 'Подтвердите подписку на блог ANGEL WINGS', text: `Чтобы получать новые материалы блога, подтвердите подписку: ${siteUrl}/blog?confirm=${token}\n\nЕсли вы не подписывались, просто проигнорируйте письмо.` })
    res.json({ message: 'Отправили письмо для подтверждения подписки. Проверьте почту.' })
  } catch (error) { next(error) }
})

router.post('/confirm-subscription', async (req, res, next) => {
  try {
    const token = String(req.body.token || '')
    if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'Недействительная ссылка' })
    const confirmationTokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const subscriber = await prisma.blogSubscriber.findUnique({ where: { confirmationTokenHash } })
    if (!subscriber || !subscriber.confirmationExpiresAt || subscriber.confirmationExpiresAt < new Date()) return res.status(400).json({ error: 'Ссылка устарела. Подпишитесь ещё раз.' })
    await prisma.blogSubscriber.update({ where: { id: subscriber.id }, data: { active: true, confirmedAt: new Date(), confirmationTokenHash: null, confirmationExpiresAt: null } })
    res.json({ message: 'Подписка подтверждена. Спасибо!' })
  } catch (error) { next(error) }
})

router.post('/unsubscribe', async (req, res, next) => {
  try {
    const [idText, signature] = String(req.body.token || '').split('.')
    const id = Number(idText)
    if (!Number.isSafeInteger(id) || id <= 0 || !/^[a-f0-9]{64}$/.test(signature || '')) return res.status(400).json({ error: 'Недействительная ссылка' })
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(id)).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(400).json({ error: 'Недействительная ссылка' })
    await prisma.blogSubscriber.updateMany({ where: { id }, data: { active: false } })
    res.json({ message: 'Вы отписаны от рассылки блога' })
  } catch (error) { next(error) }
})

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const [posts, products] = await Promise.all([
      prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: 'desc' } }),
      prisma.product.findMany({ where: { active: true }, select: { id: true, updatedAt: true } })
    ])
    const urls = [
      ...['/', '/catalog', '/about', '/dealers', '/partnership', '/faq', '/blog'].map(path => ({ loc: `${siteUrl}${path}`, lastmod: null })),
      ...products.map(product => ({ loc: `${siteUrl}/product/${product.id}`, lastmod: product.updatedAt.toISOString() })),
      ...posts.map(post => ({ loc: `${siteUrl}/blog/${post.slug}`, lastmod: post.updatedAt.toISOString() }))
    ]
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(item => `<url><loc>${xml(item.loc)}</loc>${item.lastmod ? `<lastmod>${xml(item.lastmod)}</lastmod>` : ''}</url>`).join('')}</urlset>`)
  } catch (error) { next(error) }
})

router.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({ where: { slug: req.params.slug, status: 'PUBLISHED' }, include: { category: true } })
    if (!post) return res.status(404).json({ error: 'Статья не найдена' })
    const related = await prisma.blogPost.findMany({ where: { status: 'PUBLISHED', id: { not: post.id }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) }, select: postSelect, take: 3, orderBy: { publishedAt: 'desc' } })
    res.json({ post, related, canonical: `${siteUrl}/blog/${post.slug}`, ogImage: absoluteImage(post.cover) })
  } catch (error) { next(error) }
})

router.use('/admin', authenticate, requireAdmin)

router.get('/admin/posts', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100)
    const status = ['DRAFT', 'PUBLISHED'].includes(req.query.status) ? req.query.status : undefined
    const categoryId = Number(req.query.categoryId)
    const where = { ...(status ? { status } : {}), ...(categoryId > 0 ? { categoryId } : {}), ...(search ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }] } : {}) }
    res.json(await prisma.blogPost.findMany({ where, select: postSelect, orderBy: { updatedAt: 'desc' } }))
  } catch (error) { next(error) }
})

router.get('/admin/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: Number(req.params.id) }, include: { category: true } })
    if (!post) return res.status(404).json({ error: 'Статья не найдена' })
    res.json(post)
  } catch (error) { next(error) }
})

async function postData(body, existing = null) {
  const title = String(body.title ?? existing?.title ?? '').trim().slice(0, 180)
  const requestedSlug = slugify(body.slug || title, `article-${Date.now()}`)
  const slug = existing && requestedSlug === existing.slug ? existing.slug : await generateUniqueSlug(requestedSlug, async candidate => Boolean(await prisma.blogPost.findFirst({ where: { slug: candidate, ...(existing ? { id: { not: existing.id } } : {}) }, select: { id: true } })), 'article')
  const content = cleanContent(body.content ?? existing?.content ?? '')
  const excerpt = String(body.excerpt ?? existing?.excerpt ?? '').trim().slice(0, 500)
  const status = (body.status ?? existing?.status) === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  const cover = String(body.cover ?? existing?.cover ?? '').trim().slice(0, 1000) || null
  const coverAlt = String(body.coverAlt ?? existing?.coverAlt ?? '').trim().slice(0, 250)
  const categoryId = Number(body.categoryId ?? existing?.categoryId) > 0 ? Number(body.categoryId ?? existing?.categoryId) : null
  if (status === 'PUBLISHED' && (!title || !plain(content) || !excerpt || !cover || !coverAlt || !categoryId)) {
    const error = new Error('Для публикации нужны заголовок, текст, описание, категория, обложка и её ALT')
    error.status = 400
    throw error
  }
  if (categoryId && !await prisma.blogCategory.findUnique({ where: { id: categoryId } })) {
    const error = new Error('Категория не найдена')
    error.status = 400
    throw error
  }
  return {
    title, slug, excerpt, content, cover, coverAlt, categoryId, status,
    author: String(body.author ?? existing?.author ?? 'ANGEL WINGS').trim().slice(0, 100) || 'ANGEL WINGS',
    featured: Boolean(body.featured ?? existing?.featured),
    metaTitle: String(body.metaTitle ?? existing?.metaTitle ?? '').trim().slice(0, 180),
    metaDescription: String(body.metaDescription ?? existing?.metaDescription ?? '').trim().slice(0, 500),
    readingMinutes: readingMinutes(content),
    publishedAt: status === 'PUBLISHED' ? (existing?.publishedAt || new Date()) : null
  }
}

router.post('/admin/posts', async (req, res, next) => {
  try {
    const data = await postData(req.body)
    const post = await prisma.$transaction(async tx => {
      if (data.featured && data.status === 'PUBLISHED') await tx.blogPost.updateMany({ data: { featured: false } })
      return tx.blogPost.create({ data, include: { category: true } })
    })
    res.status(201).json(post)
  } catch (error) { next(error) }
})

router.put('/admin/posts/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Статья не найдена' })
    const data = await postData(req.body, existing)
    const post = await prisma.$transaction(async tx => {
      if (data.featured && data.status === 'PUBLISHED') await tx.blogPost.updateMany({ where: { id: { not: id } }, data: { featured: false } })
      return tx.blogPost.update({ where: { id }, data, include: { category: true } })
    })
    res.json(post)
  } catch (error) { next(error) }
})

router.delete('/admin/posts/:id', async (req, res, next) => {
  try {
    await prisma.blogPost.delete({ where: { id: Number(req.params.id) } })
    res.status(204).end()
  } catch (error) { next(error) }
})

router.post('/admin/categories', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 80)
    if (!name) return res.status(400).json({ error: 'Укажите название категории' })
    const slug = await generateUniqueSlug(req.body.slug || name, candidate => prisma.blogCategory.findUnique({ where: { slug: candidate } }), 'category')
    res.status(201).json(await prisma.blogCategory.create({ data: { name, slug, position: Number(req.body.position) || 0 } }))
  } catch (error) { next(error) }
})

router.put('/admin/categories/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.blogCategory.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Категория не найдена' })
    const name = String(req.body.name || '').trim().slice(0, 80)
    if (!name) return res.status(400).json({ error: 'Укажите название категории' })
    const slug = slugify(req.body.slug || name, 'category')
    const conflict = await prisma.blogCategory.findFirst({ where: { slug, id: { not: id } } })
    if (conflict) return res.status(409).json({ error: 'Такой URL категории уже занят' })
    res.json(await prisma.blogCategory.update({ where: { id }, data: { name, slug, position: Number(req.body.position) || 0 } }))
  } catch (error) { next(error) }
})

router.delete('/admin/categories/:id', async (req, res, next) => {
  try {
    await prisma.blogCategory.delete({ where: { id: Number(req.params.id) } })
    res.status(204).end()
  } catch (error) { next(error) }
})

router.post('/admin/images', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Выберите изображение JPEG, PNG, WEBP или GIF до 5 МБ' })
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

export default router
