-- Apply once to existing SQLite databases before starting the updated server.
ALTER TABLE orders ADD COLUMN paymentType TEXT;
