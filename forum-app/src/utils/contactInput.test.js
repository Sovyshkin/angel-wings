import test from 'node:test'
import assert from 'node:assert/strict'
import { emailSuggestions, formatRussianPhone, maskPhoneInput, normalizeEmailInput, subscriberDigits } from './contactInput.js'

test('Russian phone mask handles local, country and trunk prefixes, including paste', () => {
  assert.equal(formatRussianPhone('9991234567'), '+7 (999) 123-45-67')
  assert.equal(formatRussianPhone('8 (999) 123-45-67'), '+7 (999) 123-45-67')
  assert.equal(formatRussianPhone('+7 999 123 45 67'), '+7 (999) 123-45-67')
  assert.equal(formatRussianPhone('999'), '+7 (999')
  assert.equal(subscriberDigits('+7 (999) 123-45-67'), '9991234567')
})

test('editing a separator removes the adjacent phone digit and keeps a useful caret', () => {
  assert.deepEqual(maskPhoneInput('9', 1, 'insertText', ''), { value: '+7 (9', caret: 5 })
  const previous = '+7 (999) 123-45-67'
  const backward = maskPhoneInput('+7 (999) 12345-67', 12, 'deleteContentBackward', previous)
  assert.equal(backward.value, '+7 (999) 124-56-7')
  assert.ok(backward.caret < backward.value.length)
  const middle = maskPhoneInput('+7 (999) 123-95-67', 15, 'insertText', previous)
  assert.equal(middle.value, '+7 (999) 123-95-67')
})

test('email input removes spaces, preserves the local part and suggests common domains', () => {
  assert.equal(normalizeEmailInput('  Name+promo @GMAIL.COM '), 'Name+promo@gmail.com')
  assert.deepEqual(emailSuggestions('user@g'), ['user@gmail.com'])
  assert.deepEqual(emailSuggestions('user@gmial.com'), ['user@gmail.com'])
  assert.deepEqual(emailSuggestions('user@custom.example'), [])
})
