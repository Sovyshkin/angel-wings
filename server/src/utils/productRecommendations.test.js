import assert from 'node:assert/strict'
import test from 'node:test'
import { isRecommendationAvailable, parseRecommendationIds, saveProductRecommendations } from './productRecommendations.js'

test('recommendation IDs are limited, unique and positive', () => {
  assert.deepEqual(parseRecommendationIds('[2,3]'), [2, 3])
  assert.deepEqual(parseRecommendationIds('[]'), [])
  assert.equal(parseRecommendationIds(undefined), null)
  assert.throws(() => parseRecommendationIds('[2,2]'), /повторы/)
  assert.throws(() => parseRecommendationIds('[0]'), /ошибку/)
  assert.throws(() => parseRecommendationIds('[1,2,3,4,5,6,7,8,9]'), /не более 8/)
})

test('each placement is saved independently and keeps its order', async () => {
  const deleted = []
  const created = []
  const tx = {
    product: { count: async () => 3 },
    productRecommendation: {
      deleteMany: async query => deleted.push(query.where),
      createMany: async query => created.push(query.data)
    }
  }

  await saveProductRecommendations(tx, 1, { PRODUCT: [2, 3], CART: [4] })
  assert.deepEqual(deleted, [
    { sourceProductId: 1, placement: 'PRODUCT' },
    { sourceProductId: 1, placement: 'CART' }
  ])
  assert.deepEqual(created[0].map(item => [item.targetProductId, item.position]), [[2, 0], [3, 1]])
  assert.deepEqual(created[1].map(item => [item.targetProductId, item.position]), [[4, 0]])
})

test('a product cannot recommend itself', async () => {
  await assert.rejects(
    saveProductRecommendations({}, 12, { PRODUCT: [12], CART: null }),
    /самому себе/
  )
})

test('recommendations respect both product and dosage stock', () => {
  assert.equal(isRecommendationAvailable({ active: true, stock: 2, specs: '{}' }), true)
  assert.equal(isRecommendationAvailable({ active: false, stock: 2, specs: '{}' }), false)
  assert.equal(isRecommendationAvailable({ active: true, stock: 0, specs: '{"dosages":[{"quantity":2}]}' }), true)
  assert.equal(isRecommendationAvailable({ active: true, stock: 5, specs: '{"dosages":[{"quantity":0}]}' }), false)
})
