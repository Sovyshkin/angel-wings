import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

test('dosage stock migration is repeatable and leaves old order items unmarked', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-dosage-stock-'))
  const databasePath = join(directory, 'test.db')
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  try {
    execFileSync('sqlite3', [databasePath, "CREATE TABLE order_items (id INTEGER PRIMARY KEY, dosage TEXT, quantity INTEGER NOT NULL); INSERT INTO order_items (id, dosage, quantity) VALUES (1, '20 мг', 2);"])
    const env = { ...process.env, DATABASE_URL: `file:${databasePath}` }
    execFileSync('node', ['apply-dosage-stock-schema.mjs'], { cwd: scriptDirectory, env })
    execFileSync('node', ['apply-dosage-stock-schema.mjs'], { cwd: scriptDirectory, env })
    const row = execFileSync('sqlite3', [databasePath, 'SELECT quantity, dosageStockDeducted FROM order_items WHERE id = 1'], { encoding: 'utf8' }).trim()
    assert.equal(row, '2|0')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
