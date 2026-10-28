import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSearchText, matchesAnySearchText, needsUnicodeSearch } from './searchText.js'

test('search matches Cyrillic regardless of case', () => {
  const query = normalizeSearchText('олег')
  assert.equal(matchesAnySearchText(query, ['Олег Иванов']), true)
  assert.equal(matchesAnySearchText(normalizeSearchText('ОЛЕГ'), ['олег Иванов']), true)
  assert.equal(matchesAnySearchText(query, ['Ольга Иванова']), false)
})

test('ё and е are treated consistently, ASCII stays on database search path', () => {
  assert.equal(matchesAnySearchText(normalizeSearchText('семен'), ['Семён']), true)
  assert.equal(needsUnicodeSearch('олег'), true)
  assert.equal(needsUnicodeSearch('oleg@example.com'), false)
})
