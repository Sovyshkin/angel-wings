import test from 'node:test'
import assert from 'node:assert/strict'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('blog API protects drafts, sanitizes HTML and serves SEO', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'angel-blog-test-'))
  process.env.DATABASE_URL = `file:${path.join(directory, 'test.db')}`
  process.env.JWT_SECRET = 'blog-test-secret'
  await copyFile(path.resolve('prisma/dev.db'), path.join(directory, 'test.db'))
  const columns = execFileSync('sqlite3', [path.join(directory, 'test.db'), 'PRAGMA table_info(users)'], { encoding: 'utf8' })
  if (!columns.includes('|telegramId|')) execFileSync('sqlite3', [path.join(directory, 'test.db'), 'ALTER TABLE users ADD COLUMN telegramId TEXT'], { stdio: 'pipe' })
  execFileSync('node', ['scripts/apply-blog-schema.mjs'], { cwd: process.cwd(), env: process.env, stdio: 'pipe' })
  const prisma = new PrismaClient()
  const { default: router } = await import('./blog.js')
  const { default: adminRouter } = await import('./admin.js')
  const { default: authRouter } = await import('./auth.js')
  const { default: emailService } = await import('../services/email.js')
  const sendAdminInvite = emailService.sendAdminInvite
  const sendVerificationCode = emailService.sendVerificationCode
  let inviteRole = null
  let invitePassword = null
  let loginCode = null
  emailService.sendAdminInvite = async invite => { inviteRole = invite.role; invitePassword = invite.password }
  emailService.sendVerificationCode = async message => { loginCode = message.code }
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use('/api/blog', router)
  app.use('/api/admin', adminRouter)
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
  const base = `http://127.0.0.1:${server.address().port}/api/blog`
  try {
    const user = await prisma.user.create({ data: { email: 'admin@test.local', name: 'Admin', password: 'unused', role: 'ADMIN' } })
    const token = jwt.sign({ userId: user.id, purpose: 'session' }, process.env.JWT_SECRET)
    const invited = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'New Copywriter', email: 'new-copywriter@test.local', role: 'COPYWRITER' })
    })
    assert.equal(invited.status, 201)
    const invitedUser = (await invited.json()).user
    assert.equal(invitedUser.role, 'COPYWRITER')
    assert.equal(inviteRole, 'COPYWRITER')
    const login = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invitedUser.email, password: invitePassword, adminLogin: true })
    })
    assert.equal(login.status, 202)
    const challenge = (await login.json()).challengeToken
    assert.equal(jwt.verify(challenge, process.env.JWT_SECRET).adminPanel, true)
    const verification = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/verify-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invitedUser.email, code: loginCode, purpose: 'login_verification', challengeToken: challenge, adminLogin: true })
    })
    assert.equal(verification.status, 200)
    const copywriterToken = (await verification.json()).token
    assert.equal(jwt.verify(copywriterToken, process.env.JWT_SECRET).adminPanel, true)
    const publicToken = jwt.sign({ userId: invitedUser.id, purpose: 'session' }, process.env.JWT_SECRET)
    const customer = await prisma.user.create({ data: { email: 'customer@test.local', name: 'Customer', password: 'unused', role: 'USER' } })
    const customerToken = jwt.sign({ userId: customer.id, purpose: 'session', adminPanel: true }, process.env.JWT_SECRET)
    const copywriterHeaders = { Authorization: `Bearer ${copywriterToken}` }
    assert.equal((await fetch(`${base}/admin/posts`, { headers: copywriterHeaders })).status, 200)
    assert.equal((await fetch(`${base}/admin/posts`, { headers: { Authorization: `Bearer ${publicToken}` } })).status, 403)
    assert.equal((await fetch(`${base}/admin/posts`, { headers: { Authorization: `Bearer ${customerToken}` } })).status, 403)
    assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/admin/stats`, { headers: copywriterHeaders })).status, 403)
    const category = await prisma.blogCategory.create({ data: { name: 'Исследования', slug: 'research' } })
    const create = await fetch(`${base}/admin/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: 'Проверка блога', excerpt: 'Краткое описание', cover: '/blog-assets/dna-molecules.webp', coverAlt: 'Молекула', categoryId: category.id, content: '<h2>Раздел</h2><p>Текст<script>alert(1)</script></p><img src="/uploads/photo.jpg" alt="Фото">', status: 'DRAFT' }) })
    assert.equal(create.status, 201)
    const draft = await create.json()
    assert.equal(draft.status, 'DRAFT')
    assert.equal((await (await fetch(`${base}/posts`)).json()).total, 0)
    assert.equal((await fetch(`${base}/posts/${draft.slug}`)).status, 404)
    const update = await fetch(`${base}/admin/posts/${draft.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...draft, content: '<h2>Раздел</h2><p>Текст<script>alert(1)</script></p>', status: 'PUBLISHED' }) })
    assert.equal(update.status, 200)
    const published = await (await fetch(`${base}/posts/${draft.slug}`)).json()
    assert.equal(published.post.status, 'PUBLISHED')
    assert.equal(published.post.content.includes('<script'), false)
    assert.equal((await (await fetch(`${base}/posts`)).json()).total, 1)
    const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
    assert.match(sitemap, new RegExp(draft.slug))
    const rendered = await fetch(`${base}/render/${draft.slug}`)
    assert.equal(rendered.status, 200)
    const renderedHtml = await rendered.text()
    assert.match(renderedHtml, /<link rel="canonical" href="https:\/\/angel-wings\.ru\/blog\/proverka-bloga">/)
    assert.match(renderedHtml, /application\/ld\+json/)
    assert.match(renderedHtml, /<h1>Проверка блога<\/h1>/)
    assert.equal((await fetch(`${base}/admin/posts`)).status, 401)
    const copywriterDraft = await fetch(`${base}/admin/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...copywriterHeaders }, body: JSON.stringify({ title: 'Черновик копирайтера', content: '<p>Текст</p>', status: 'DRAFT' }) })
    assert.equal(copywriterDraft.status, 201)
    const confirmationToken = 'a'.repeat(64)
    const subscriber = await prisma.blogSubscriber.create({ data: {
      email: 'reader@test.local',
      confirmationTokenHash: crypto.createHash('sha256').update(confirmationToken).digest('hex'),
      confirmationExpiresAt: new Date(Date.now() + 60_000)
    } })
    assert.equal(subscriber.active, false)
    const confirmation = await fetch(`${base}/confirm-subscription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: confirmationToken }) })
    assert.equal(confirmation.status, 200)
    assert.equal((await prisma.blogSubscriber.findUnique({ where: { id: subscriber.id } })).active, true)
    assert.equal((await fetch(`${base}/confirm-subscription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: confirmationToken }) })).status, 400)
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(subscriber.id)).digest('hex')
    const unsubscribe = await fetch(`${base}/unsubscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: `${subscriber.id}.${signature}` }) })
    assert.equal(unsubscribe.status, 200)
    assert.equal((await prisma.blogSubscriber.findUnique({ where: { id: subscriber.id } })).active, false)
  } finally {
    emailService.sendAdminInvite = sendAdminInvite
    emailService.sendVerificationCode = sendVerificationCode
    await prisma.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
