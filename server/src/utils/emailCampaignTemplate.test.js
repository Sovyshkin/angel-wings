import test from 'node:test'
import assert from 'node:assert/strict'
import { renderEmailCampaign, validateEmailCampaign } from './emailCampaignTemplate.js'

const input = {
  audience: 'clients', type: 'PRODUCT_DISCOUNT', subject: 'Скидка на товар',
  headline: 'Специальная цена', body: 'Здравствуйте, {{name}}!\nПосмотрите предложение.',
  buttonText: 'Посмотреть', buttonUrl: 'https://angel-wings.ru/product/42',
  imageUrl: '/uploads/product.png'
}

test('campaign template validates links and renders a personalized email', () => {
  const settings = validateEmailCampaign(input)
  assert.equal(settings.imageUrl, 'https://angel-wings.ru/uploads/product.png')
  const result = renderEmailCampaign(settings, 'Анна')
  assert.match(result.text, /Здравствуйте, Анна!/)
  assert.match(result.text, /https:\/\/angel-wings.ru\/product\/42/)
  assert.match(result.html, /Специальная цена/)
  assert.match(result.html, /src="https:\/\/angel-wings.ru\/uploads\/product.png"/)
  assert.match(result.html, /href="https:\/\/angel-wings.ru\/product\/42"/)
})

test('campaign template escapes user content and rejects unsafe or incomplete buttons', () => {
  const settings = validateEmailCampaign({ ...input, body: 'Здравствуйте, {{name}}! <script>alert(1)</script>' })
  const result = renderEmailCampaign(settings, '<img src=x onerror=alert(1)>')
  assert.doesNotMatch(result.html, /<script>|<img src=x/)
  assert.match(result.html, /&lt;script&gt;/)
  assert.throws(() => validateEmailCampaign({ ...input, buttonUrl: 'javascript:alert(1)' }), /angel-wings.ru/)
  assert.throws(() => validateEmailCampaign({ ...input, buttonUrl: 'https://other.example/path' }), /angel-wings.ru/)
  assert.throws(() => validateEmailCampaign({ ...input, buttonText: '' }), /кнопки/)
  assert.throws(() => validateEmailCampaign({ ...input, audience: 'unexpected' }), /аудиторию/)
})
