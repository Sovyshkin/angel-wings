import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

test('manual-order origin migration is repeatable and preserves existing orders', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-order-origin-'))
  const databasePath = join(directory, 'test.db')
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  try {
    execFileSync('sqlite3', [databasePath, "CREATE TABLE orders (id INTEGER PRIMARY KEY, total REAL NOT NULL); INSERT INTO orders (id, total) VALUES (1, 900);"])
    const env = { ...process.env, DATABASE_URL: `file:${databasePath}` }
    execFileSync('node', ['apply-manual-order-origin-schema.mjs'], { cwd: scriptDirectory, env })
    execFileSync('node', ['apply-manual-order-origin-schema.mjs'], { cwd: scriptDirectory, env })
    const rows = execFileSync('sqlite3', [databasePath, 'SELECT id, total, origin FROM orders'], { encoding: 'utf8' }).trim()
    const [id, total, origin] = rows.split('|')
    assert.equal(id, '1')
    assert.equal(Number(total), 900)
    assert.equal(origin, 'CHECKOUT')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
