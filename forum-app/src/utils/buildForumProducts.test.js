import test from 'node:test'
import assert from 'node:assert/strict'
import { buildForumProducts } from './buildForumProducts.js'

const catalog = [
  { id: 1, title: 'Первый', active: true, image: '/first.webp', description: 'Описание первого', price: 100, categories: [{ name: 'База' }] },
  { id: 2, title: 'Второй', active: true, image: '/second.webp', description: 'Описание второго', price: 200, categories: [{ name: 'База' }] },
  { id: 3, title: 'Третий', active: true, image: '/third.webp', description: 'Описание третьего', price: 300, categories: [{ name: 'База' }] }
]

test('catalog products can be featured, edited and hidden without losing API data', () => {
  const settings = { items: [
    { productId: '3', visible: true, title: 'Третий для форума', category: 'Форум', text: 'Новый текст', image: '/uploads/third.webp', price: '', link: '' },
    { productId: '2', visible: false, title: 'Второй' }
  ] }
  const products = buildForumProducts(catalog, settings)
  assert.deepEqual(products.map(product => product.id), [3, 1])
  assert.equal(products[0].title, 'Третий для форума')
  assert.equal(products[0].categories[0].name, 'Форум')
  assert.equal(products[0].text, 'Новый текст')
  assert.equal(products[0].price, 300)
  assert.equal(products[0].image, 'https://angel-wings.ru/uploads/third.webp')
  assert.equal(products[1].title, 'Первый')
})

test('legacy title selections still resolve until admin assigns product IDs', () => {
  const products = buildForumProducts(catalog, { items: [{ title: 'ВТОРОЙ', visible: true }] })
  assert.deepEqual(products.map(product => product.id), [2, 1, 3])
})

test('selected catalog mode only shows cards added in the forum editor', () => {
  const settings = { showAllCatalog: false, items: [{ productId: '2', visible: true, title: 'Второй' }] }
  assert.deepEqual(buildForumProducts(catalog, settings).map(product => product.id), [2])
  settings.items[0].visible = false
  assert.deepEqual(buildForumProducts(catalog, settings), [])
})
