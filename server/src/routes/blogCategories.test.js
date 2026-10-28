import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('blog posts and products keep multiple categories; old blog categories migrate safely', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-blog-categories-'))
  const databasePath = join(directory, 'test.db')
  const previousDatabaseUrl = process.env.DATABASE_URL
  const previousJwtSecret = process.env.JWT_SECRET
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'blog-categories-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const db = new PrismaClient()
  let server

  try {
    const admin = await db.user.create({ data: { email: 'admin@categories.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const first = await db.blogCategory.create({ data: { name: 'Здоровье', slug: 'health' } })
    const second = await db.blogCategory.create({ data: { name: 'Исследования', slug: 'research' } })
    const legacy = await db.blogPost.create({ data: { slug: 'legacy', title: 'Старая статья', categoryId: first.id } })
    execFileSync('node', ['scripts/apply-blog-schema.mjs'], { cwd: process.cwd(), env: process.env, stdio: 'pipe' })
    assert.deepEqual((await db.blogPostCategory.findMany({ where: { postId: legacy.id } })).map(link => link.categoryId), [first.id])
    execFileSync('node', ['scripts/apply-blog-schema.mjs'], { cwd: process.cwd(), env: process.env, stdio: 'pipe' })
    assert.equal(await db.blogPostCategory.count({ where: { postId: legacy.id } }), 1)

    const { default: blogRouter } = await import('./blog.js')
    const { default: productRouter } = await import('./products.js')
    const app = express()
    app.use(express.json())
    app.use('/api/blog', blogRouter)
    app.use('/api/products', productRouter)
    app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
    const base = `http://127.0.0.1:${server.address().port}`
    const token = jwt.sign({ userId: admin.id, purpose: 'session', adminPanel: true }, process.env.JWT_SECRET)
    const send = async (path, options = {}) => fetch(`${base}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers } })

    const create = await send('/api/blog/admin/posts', { method: 'POST', body: JSON.stringify({ title: 'Новая статья', excerpt: 'Описание', content: '<p>Текст статьи</p>', cover: '/cover.webp', coverAlt: 'Обложка', status: 'PUBLISHED', categoryIds: [first.id, second.id] }) })
    assert.equal(create.status, 201, await create.clone().text())
    const post = await create.json()
    assert.deepEqual(post.categories.map(category => category.id), [first.id, second.id])
    assert.equal(post.categoryId, first.id)

    for (const slug of [first.slug, second.slug]) {
      const response = await send(`/api/blog/posts?category=${slug}`)
      assert.equal(response.status, 200)
      assert.deepEqual((await response.json()).posts.map(item => item.id), [post.id])
    }
    const invalid = await send(`/api/blog/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify({ categoryIds: [second.id, 999999] }) })
    assert.equal(invalid.status, 400)
    assert.equal(await db.blogPostCategory.count({ where: { postId: post.id } }), 2)

    const update = await send(`/api/blog/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify({ categoryIds: [second.id] }) })
    assert.equal(update.status, 200, await update.clone().text())
    assert.deepEqual((await update.json()).categories.map(category => category.id), [second.id])
    assert.deepEqual((await db.blogPostCategory.findMany({ where: { postId: post.id } })).map(link => link.categoryId), [second.id])
    const oldCategory = await send(`/api/blog/posts?category=${first.slug}`)
    assert.equal((await oldCategory.json()).total, 0)
    const clearDraft = await send(`/api/blog/admin/posts/${legacy.id}`, { method: 'PUT', body: JSON.stringify({ categoryIds: [] }) })
    assert.equal(clearDraft.status, 200, await clearDraft.clone().text())
    assert.equal((await db.blogPost.findUnique({ where: { id: legacy.id } })).categoryId, null)
    assert.equal(await db.blogPostCategory.count({ where: { postId: legacy.id } }), 0)

    const productCategoryOne = await db.category.create({ data: { name: 'Иммунитет', slug: 'immunity' } })
    const productCategoryTwo = await db.category.create({ data: { name: 'Восстановление', slug: 'recovery' } })
    const productForm = new FormData()
    for (const [key, value] of Object.entries({ title: 'Товар', description: 'Описание', price: '100', stock: '1', weight: '100', categories: JSON.stringify([productCategoryOne.id, productCategoryTwo.id]) })) productForm.set(key, value)
    const productResponse = await fetch(`${base}/api/products`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: productForm })
    assert.equal(productResponse.status, 201, await productResponse.clone().text())
    const productId = (await productResponse.json()).product.id
    assert.deepEqual((await db.product.findUnique({ where: { id: productId }, include: { categories: true } })).categories.map(category => category.id).sort(), [productCategoryOne.id, productCategoryTwo.id])
    productForm.set('categories', JSON.stringify([productCategoryTwo.id]))
    const productUpdate = await fetch(`${base}/api/products/${productId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: productForm })
    assert.equal(productUpdate.status, 200, await productUpdate.clone().text())
    assert.deepEqual((await db.product.findUnique({ where: { id: productId }, include: { categories: true } })).categories.map(category => category.id), [productCategoryTwo.id])
    productForm.set('categories', '[]')
    const clearCategories = await fetch(`${base}/api/products/${productId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: productForm })
    assert.equal(clearCategories.status, 200, await clearCategories.clone().text())
    assert.equal((await db.product.findUnique({ where: { id: productId }, include: { categories: true } })).categories.length, 0)
  } finally {
    if (server) await new Promise(resolve => server.close(resolve))
    await db.$disconnect()
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousJwtSecret
    await rm(directory, { recursive: true, force: true })
  }
})
