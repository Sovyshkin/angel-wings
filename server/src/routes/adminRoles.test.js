import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('custom roles are admin-managed, section-scoped and revoked immediately', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-admin-roles-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'admin-roles-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)

  const { default: rolesRouter } = await import('./adminRoles.js')
  const { default: adminRouter } = await import('./admin.js')
  const { default: blogRouter } = await import('./blog.js')
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin/roles', rolesRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/blog', blogRouter)
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const token = (user, adminPanel = true) => jwt.sign({ userId: user.id, purpose: 'session', ...(adminPanel ? { adminPanel: true } : {}) }, process.env.JWT_SECRET)
  const send = (url, user, options = {}) => fetch(`${base}${url}`, { ...options, headers: { Authorization: `Bearer ${token(user)}`, 'Content-Type': 'application/json', ...options.headers } })

  try {
    const admin = await db.user.create({ data: { email: 'admin@roles.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const regular = await db.user.create({ data: { email: 'user@roles.test', password: 'unused', name: 'User', role: 'USER' } })
    const create = await send('/api/admin/roles', admin, { method: 'POST', body: JSON.stringify({ name: 'Аналитик', permissions: ['DASHBOARD'] }) })
    const createdBody = await create.json()
    assert.equal(create.status, 201, JSON.stringify(createdBody))
    const role = createdBody.role
    const staff = await db.user.create({ data: { email: 'staff@roles.test', password: 'unused', name: 'Staff', role: role.code } })
    assert.equal((await send('/api/admin/roles', staff)).status, 403)
    assert.equal((await send(`/api/admin/roles/${role.id}`, staff, { method: 'PUT', body: JSON.stringify({ name: 'Суперадмин', permissions: ['DASHBOARD'] }) })).status, 403)
    assert.equal((await send('/api/admin/roles', regular)).status, 403)
    assert.equal((await send('/api/admin/roles', admin, { method: 'POST', body: JSON.stringify({ name: 'Опасная роль', permissions: ['USERS'] }) })).status, 400)
    assert.equal((await send('/api/admin/stats', staff)).status, 200)
    assert.equal((await send('/api/admin/orders', staff)).status, 403)
    assert.equal((await send('/api/admin/users', staff)).status, 403)
    assert.equal((await fetch(`${base}/api/admin/stats`, { headers: { Authorization: `Bearer ${token(staff, false)}` } })).status, 403)
    const update = await send(`/api/admin/roles/${role.id}`, admin, { method: 'PUT', body: JSON.stringify({ name: 'Редактор', permissions: ['BLOG'] }) })
    assert.equal(update.status, 200, await update.text())
    assert.equal((await send('/api/admin/stats', staff)).status, 403)
    assert.equal((await send('/api/blog/admin/posts', staff)).status, 200)
    assert.equal((await send(`/api/admin/roles/${role.id}`, admin, { method: 'DELETE' })).status, 409)
    await db.user.update({ where: { id: staff.id }, data: { role: 'USER' } })
    assert.equal((await send('/api/blog/admin/posts', staff)).status, 403)
    assert.equal((await send(`/api/admin/roles/${role.id}`, admin, { method: 'DELETE' })).status, 200)
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
