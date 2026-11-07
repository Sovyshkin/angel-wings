import test from 'node:test'
import assert from 'node:assert/strict'
import { FORUM_DEFAULTS, sanitizeForumContent } from './forumContent.js'

test('forum editor settings survive sanitizing and older content gets visible defaults', () => {
  const old = structuredClone(FORUM_DEFAULTS)
  delete old.events.items[0].visible
  delete old.advantages.items[0].visible
  delete old.products.items[0].productId
  delete old.hero.sceneAssets
  const restored = sanitizeForumContent(old)
  assert.equal(restored.events.items[0].visible, true)
  assert.equal(restored.advantages.items[0].visible, true)
  assert.equal(restored.products.items[0].productId, '')
  assert.equal(restored.hero.sceneAssets.length, 11)
})

test('added and hidden cards, media, scene assets and custom form fields persist', () => {
  const content = structuredClone(FORUM_DEFAULTS)
  content.events.items.push({ visible: false, title: 'Дополнительное событие', date: '', place: '', image: '/uploads/event.webp', video: '', link: '' })
  content.advantages.items.push({ visible: false, title: 'Новое преимущество', icon: 'flask', text: '', image: '' })
  content.products.items.push({ productId: '42', visible: false, title: 'Новое имя товара', category: 'Форум', price: '', text: 'Описание', image: '/uploads/product.webp', video: '', link: '' })
  content.about.stats.push({ visible: false, value: '7', label: 'лет' })
  content.hero.sceneAssets[0].visible = false
  content.hero.objects[0].lightImage = '/uploads/light.webp'
  content.form.fields.push({ key: 'custom_affiliation', label: 'Специализация', placeholder: 'Укажите специализацию', required: true, visible: true })
  const result = sanitizeForumContent(content)
  assert.equal(result.events.items.at(-1).visible, false)
  assert.equal(result.advantages.items.at(-1).visible, false)
  assert.equal(result.products.items.at(-1).productId, '42')
  assert.equal(result.products.items.at(-1).visible, false)
  assert.equal(result.about.stats.at(-1).visible, false)
  assert.equal(result.hero.sceneAssets[0].visible, false)
  assert.equal(result.hero.objects[0].lightImage, '/uploads/light.webp')
  assert.deepEqual(result.form.fields.at(-1), content.form.fields.at(-1))
  assert.deepEqual(sanitizeForumContent(result), result)
})

test('required contact fields cannot be hidden and unknown form keys are rejected', () => {
  const content = structuredClone(FORUM_DEFAULTS)
  content.form.fields.find(field => field.key === 'email').visible = false
  content.form.fields.push({ key: 'admin', label: 'Unexpected', placeholder: '', required: false, visible: true })
  const result = sanitizeForumContent(content)
  assert.equal(result.form.fields.find(field => field.key === 'email').visible, true)
  assert.equal(result.form.fields.some(field => field.key === 'admin'), false)
})
