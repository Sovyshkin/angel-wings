import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { TICKET_STORAGE_FORMAT } from '../utils/giveawayTicket.js'
import { buildGiveawayTicketEmail, deliverGiveawayTicketEmail } from '../services/giveawayTicketEmail.js'

test('giveaway tickets are stable and duplicate submissions create one application', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-wings-ticket-'))
  const databaseUrl = `file:${join(directory, 'forum.db')}`
  const oldDatabaseUrl = process.env.DATABASE_URL
  const mailEnvKeys = ['SMTP_PASSWORD', 'SMTP_PASS', 'EMAIL_RELAY_URL', 'EMAIL_RELAY_SECRET', 'TELEGRAM_RELAY_SECRET']
  const previousMailEnv = Object.fromEntries(mailEnvKeys.map(key => [key, process.env[key]]))
  process.env.DATABASE_URL = databaseUrl
  for (const key of mailEnvKeys) process.env[key] = ''
  t.after(async () => {
    if (oldDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = oldDatabaseUrl
    for (const key of mailEnvKeys) {
      if (previousMailEnv[key] === undefined) delete process.env[key]
      else process.env[key] = previousMailEnv[key]
    }
    await rm(directory, { recursive: true, force: true })
  })

  const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const setup = spawnSync(process.execPath, ['scripts/apply-forum-schema.mjs'], {
    cwd: serverRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8'
  })
  assert.equal(setup.status, 0, setup.stderr)

  const { default: router } = await import('./forum.js')
  const app = express()
  app.use(express.json())
  app.use('/api/forum', router)
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const prisma = new PrismaClient()
  t.after(() => prisma.$disconnect())
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = number => `${String(number).padStart(8, '0')}-1111-4111-8111-111111111111`
  const submit = async (overrides = {}) => {
    const response = await fetch(`${base}/api/forum/applications`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Иван Иванов', email: 'test@example.ru', phone: '+7 (999) 111-22-33', browserId: browser(1), consent: true, ...overrides })
    })
    return { status: response.status, body: await response.json() }
  }

  const first = await submit()
  assert.equal(first.status, 201)
  assert.match(first.body.ticketId, TICKET_STORAGE_FORMAT)
  assert.equal(first.body.emailStatus, 'failed')
  const firstApplication = await prisma.forumApplication.findUnique({ where: { ticketId: first.body.ticketId } })
  assert.equal(firstApplication.ticketEmailAttempts, 1)
  let deliveredMessage
  const delivery = await deliverGiveawayTicketEmail(prisma, firstApplication.id, {
    force: true, now: new Date(Date.now() + 61_000),
    sendMail: async message => { deliveredMessage = message }
  })
  assert.equal(delivery.emailStatus, 'sent')
  assert.equal(deliveredMessage.to, 'test@example.ru')
  assert.ok(deliveredMessage.html.includes(first.body.ticketId))
  assert.ok(deliveredMessage.html.includes('50 000 ₽'))
  assert.ok(buildGiveawayTicketEmail({ name: '<script>', ticketId: first.body.ticketId }).html.includes('&lt;script&gt;'))
  assert.equal((await submit({ browserId: browser(10), phone: '+7 (999) 123-45-6' })).status, 400)
  const again = await submit({ email: 'TEST@example.ru', phone: '8 999 111 22 33' })
  assert.equal(again.status, 200)
  assert.equal(again.body.ticketId, first.body.ticketId)
  assert.equal(again.body.alreadyRegistered, true)
  assert.equal(again.body.emailStatus, 'sent')
  assert.equal((await prisma.forumApplication.findUnique({ where: { id: firstApplication.id } })).ticketEmailAttempts, 2)
  const resend = await fetch(`${base}/api/forum/applications/ticket/email`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ browserId: browser(1), ticketId: first.body.ticketId })
  })
  assert.equal(resend.status, 200)
  assert.equal((await resend.json()).emailStatus, 'cooldown')
  const sameBrowser = await submit({ email: 'someone-else@example.ru', phone: '+7 999 222 33 44' })
  assert.equal(sameBrowser.status, 200)
  assert.equal(sameBrowser.body.ticketId, first.body.ticketId)
  const secondBrowser = await submit({ browserId: browser(2) })
  assert.equal(secondBrowser.body.ticketId, first.body.ticketId)
  assert.equal((await submit({ browserId: browser(2), email: 'another@example.ru', phone: '+7 999 555 44 33' })).body.ticketId, first.body.ticketId)
  assert.equal((await submit({ browserId: browser(3), phone: '+7 999 222 33 44' })).status, 409)
  assert.equal((await submit({ browserId: browser(4), email: 'other@example.ru' })).status, 409)

  const simultaneous = await Promise.all(Array.from({ length: 8 }, () => submit({ browserId: browser(5), email: 'parallel@example.ru', phone: '+7 999 222 33 44' })))
  assert.ok(simultaneous.every(result => [200, 201].includes(result.status)))
  assert.equal(new Set(simultaneous.map(result => result.body.ticketId)).size, 1)
  assert.equal(await prisma.forumApplication.count(), 2)

  const legacy = await prisma.forumApplication.create({
    data: { name: 'Старый участник', email: 'legacy@example.ru', phone: '8 999 555 66 77', message: 'Кампания: Розыгрыш 50 000 ₽' }
  })
  const restored = await submit({ browserId: browser(6), email: 'legacy@example.ru', phone: '+7 999 555 66 77' })
  assert.equal(restored.status, 200)
  assert.match(restored.body.ticketId, TICKET_STORAGE_FORMAT)
  assert.equal((await prisma.forumApplication.findUnique({ where: { id: legacy.id } })).ticketId, restored.body.ticketId)
  assert.equal(await prisma.forumApplication.count(), 3)

  const preMigration = await prisma.forumApplication.create({
    data: { name: 'Ещё один участник', email: 'migrated@example.ru', phone: '8 999 777 88 99', message: 'Кампания: Розыгрыш 50 000 ₽' }
  })
  const backfill = spawnSync(process.execPath, ['scripts/apply-forum-schema.mjs'], {
    cwd: serverRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8'
  })
  assert.equal(backfill.status, 0, backfill.stderr)
  const migrated = await prisma.forumApplication.findUnique({ where: { id: preMigration.id } })
  assert.match(migrated.ticketId, TICKET_STORAGE_FORMAT)
  assert.equal(migrated.giveawayEmail, 'migrated@example.ru')
  assert.equal(migrated.giveawayPhone, '79997778899')
  assert.equal((await submit({ browserId: browser(7), email: 'migrated@example.ru', phone: '+7 999 777 88 99' })).body.ticketId, migrated.ticketId)

  const claim = await fetch(`${base}/api/forum/applications/ticket/claim`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ browserId: browser(8), ticketId: first.body.ticketId })
  })
  assert.equal(claim.status, 200)
  assert.equal((await claim.json()).ticketId, first.body.ticketId)
  assert.equal((await submit({ browserId: browser(8), email: 'new-person@example.ru', phone: '+7 999 888 00 11' })).body.ticketId, first.body.ticketId)

  const oneBrowserManyContacts = await Promise.all(Array.from({ length: 8 }, (_, index) => submit({
    browserId: browser(9), email: `shared-browser-${index}@example.ru`, phone: `+7 999 333 00 ${String(index).padStart(2, '0')}`
  })))
  assert.ok(oneBrowserManyContacts.every(result => [200, 201].includes(result.status)))
  assert.equal(new Set(oneBrowserManyContacts.map(result => result.body.ticketId)).size, 1)
  assert.equal(await prisma.forumApplication.count(), 5)

  const lookup = await fetch(`${base}/api/forum/applications/ticket/${first.body.ticketId}`)
  assert.equal(lookup.status, 200)
  assert.equal((await lookup.json()).ticketId, first.body.ticketId)
  assert.equal((await fetch(`${base}/api/forum/applications/ticket/AW-INVALID`)).status, 404)
})
