import test from 'node:test'
import assert from 'node:assert/strict'
import { FORUM_DEFAULTS, sanitizeForumContent } from './forumContent.js'

test('saved forum copy and profile fields migrate to the giveaway without changing custom text', () => {
  const saved = structuredClone(FORUM_DEFAULTS)
  saved.hero.eyebrow = 'ФОРУМ ANGEL WINGS'
  saved.hero.title = 'Форум современных пептидных решений'
  saved.hero.description = 'Научные доклады • Новые разработки • Обмен опытом'
  saved.hero.penVisible = true
  saved.hero.secondaryButton = 'О форуме'
  saved.advantages.title = 'Почему стоит участвовать?'
  saved.advantages.description = 'Свой текст администратора'
  saved.products.visible = true
  saved.events.visible = true
  saved.cta.description = 'Участвуйте в форуме, узнавайте о новинках первыми и расширяйте профессиональные связи.'
  saved.form.title = 'Оставьте заявку на форум'
  saved.form.description = 'Укажите имя, телефон и почту, чтобы мы могли с вами связаться.'
  delete saved.form.formatVersion
  saved.form.fields.find(field => field.key === 'position').visible = false
  saved.form.fields.find(field => field.key === 'position').required = false
  saved.form.fields.find(field => field.key === 'topics').required = false
  saved.form.fields.find(field => field.key === 'topics').visible = false

  const restored = sanitizeForumContent(saved)
  assert.equal(restored.hero.title, 'Разыгрываем\n50 000 ₽')
  assert.equal(restored.hero.penVisible, false)
  assert.equal(restored.hero.secondaryButton, 'Как участвовать')
  assert.equal(restored.advantages.description, 'Свой текст администратора')
  assert.equal(restored.products.visible, false)
  assert.equal(restored.events.visible, false)
  assert.equal(restored.form.title, 'Оставьте заявку на розыгрыш')
  assert.equal(restored.form.description, FORUM_DEFAULTS.form.description)
  assert.equal(restored.form.fields.find(field => field.key === 'position').visible, true)
  assert.equal(restored.form.fields.find(field => field.key === 'position').required, true)
  assert.equal(restored.form.fields.find(field => field.key === 'topics').visible, true)
  assert.equal(restored.form.fields.find(field => field.key === 'topics').required, true)
  assert.equal(restored.form.formatVersion, 'giveaway-3-step')
  assert.deepEqual(sanitizeForumContent(restored), restored)
})

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

test('new audience fields are restored for older pages and answer options remain editable', () => {
  const old = structuredClone(FORUM_DEFAULTS)
  delete old.form.formatVersion
  old.form.fields = old.form.fields.filter(field => !['city', 'role', 'topics'].includes(field.key))
  Object.assign(old.form.fields.find(field => field.key === 'position'), { label: 'Должность', placeholder: 'Ваша должность', required: false })
  Object.assign(old.form.fields.find(field => field.key === 'company'), { label: 'Компания / Организация', placeholder: 'Название организации' })
  const restored = sanitizeForumContent(old)
  assert.deepEqual(restored.form.fields.filter(field => ['city', 'role', 'topics'].includes(field.key)).map(field => field.key), ['city', 'role', 'topics'])
  assert.equal(restored.form.fields.find(field => field.key === 'position').label, 'Специальность / должность')
  assert.equal(restored.form.fields.find(field => field.key === 'position').required, true)
  assert.equal(restored.form.fields.find(field => field.key === 'position').visible, true)
  assert.equal(restored.form.fields.find(field => field.key === 'company').label, 'Организация / место работы')

  restored.form.fields.find(field => field.key === 'role').options[0] = 'Другой специалист'
  restored.form.fields.find(field => field.key === 'topics').visible = false
  const saved = sanitizeForumContent(restored)
  assert.equal(saved.form.fields.find(field => field.key === 'role').options[0], 'Другой специалист')
  assert.equal(saved.form.fields.find(field => field.key === 'topics').visible, false)
})
