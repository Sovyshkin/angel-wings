CREATE TABLE IF NOT EXISTS consultation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  customerName TEXT NOT NULL,
  customerEmail TEXT NOT NULL,
  customerPhone TEXT NOT NULL,
  specialist TEXT NOT NULL,
  contactFormat TEXT NOT NULL,
  question TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 4000,
  paymentStatus TEXT NOT NULL DEFAULT 'PENDING',
  paymentId TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  adminNote TEXT,
  handledById INTEGER,
  handledAt DATETIME,
  completedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (handledById) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS consultation_requests_status_createdAt_idx
  ON consultation_requests(status, createdAt);
CREATE INDEX IF NOT EXISTS consultation_requests_paymentStatus_createdAt_idx
  ON consultation_requests(paymentStatus, createdAt);
CREATE INDEX IF NOT EXISTS consultation_requests_customerEmail_idx
  ON consultation_requests(customerEmail);
