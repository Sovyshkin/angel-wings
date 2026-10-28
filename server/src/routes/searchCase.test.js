import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('search finds Cyrillic names regardless of case and keeps pagination totals', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-search-case-'))
  const databasePath = join(directory, 'test.db')
  const previousDatabaseUrl = process.env.DATABASE_URL
  const previousJwtSecret = process.env.JWT_SECRET
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'search-case-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)

  const { default: adminRouter } = await import('./admin.js')
  const { default: productRouter } = await import('./products.js')
  const { default: blogRouter } = await import('./blog.js')
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRouter)
  app.use('/api/products', productRouter)
  app.use('/api/blog', blogRouter)
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  const base = `http://127.0.0.1:${server.address().port}`

  try {
    const admin = await db.user.create({ data: { email: 'admin@search.test', password: 'unused', name: 'Админ', role: 'ADMIN' } })
    const oleg = await db.user.create({ data: { email: 'oleg@search.test', password: 'unused', name: 'Олег' } })
    const semen = await db.user.create({ data: { email: 'semen@search.test', password: 'unused', name: 'Семён' } })
    await db.user.create({ data: { email: 'other@search.test', password: 'unused', name: 'Анна' } })
    const product = await db.product.create({ data: { title: 'Пептид Олег', slug: 'peptid-oleg', description: 'Описание', price: 100 } })
    await db.product.create({ data: { title: 'Другой товар', slug: 'other-product', description: 'Описание', price: 200 } })
    const order = await db.order.create({ data: { customerName: 'Олег', customerEmail: 'oleg@search.test', customerPhone: '+70000000000', total: 100 } })
    await db.order.create({ data: { customerName: 'Анна', customerEmail: 'anna@search.test', customerPhone: '+71111111111', total: 200 } })
    const post = await db.blogPost.create({ data: { title: 'Советы для Олега', slug: 'sovety-olega', status: 'PUBLISHED', publishedAt: new Date() } })
    await db.blogPost.create({ data: { title: 'Другие советы', slug: 'other-advice', status: 'PUBLISHED', publishedAt: new Date() } })

    const token = jwt.sign({ userId: admin.id, purpose: 'session', adminPanel: true }, process.env.JWT_SECRET)
    const get = async path => {
      const response = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } })
      assert.equal(response.status, 200, await response.clone().text())
      return response.json()
    }

    for (const query of ['олег', 'ОЛЕГ']) {
      const users = await get(`/api/admin/users?q=${encodeURIComponent(query)}&limit=1&offset=0`)
      assert.equal(users.total, 1)
      assert.deepEqual(users.users.map(user => user.id), [oleg.id])
      const nextUsers = await get(`/api/admin/users?q=${encodeURIComponent(query)}&limit=1&offset=1`)
      assert.equal(nextUsers.total, 1)
      assert.equal(nextUsers.users.length, 0)

      const products = await get(`/api/admin/products?q=${encodeURIComponent(query)}`)
      assert.equal(products.total, 1)
      assert.deepEqual(products.products.map(item => item.id), [product.id])
      const orders = await get(`/api/admin/orders?q=${encodeURIComponent(query)}`)
      assert.equal(orders.total, 1)
      assert.deepEqual(orders.orders.map(item => item.id), [order.id])
      const catalog = await get(`/api/products?search=${encodeURIComponent(query)}`)
      assert.equal(catalog.total, 1)
      assert.deepEqual(catalog.products.map(item => item.id), [product.id])
      const blog = await get(`/api/blog/posts?search=${encodeURIComponent(query)}`)
      assert.equal(blog.total, 1)
      assert.deepEqual(blog.posts.map(item => item.id), [post.id])
      const adminBlog = await get(`/api/blog/admin/posts?search=${encodeURIComponent(query)}`)
      assert.deepEqual(adminBlog.map(item => item.id), [post.id])
    }
    const yoSearch = await get('/api/admin/users?q=семен')
    assert.deepEqual(yoSearch.users.map(user => user.id), [semen.id])
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousJwtSecret
    await rm(directory, { recursive: true, force: true })
  }
})
