ALTER TABLE orders ADD COLUMN isFavorite BOOLEAN NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS orders_isFavorite_createdAt_idx
  ON orders(isFavorite, createdAt DESC);
