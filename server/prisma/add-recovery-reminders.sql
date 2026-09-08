-- Run once on an existing production SQLite database before deploying the new server.
ALTER TABLE users ADD COLUMN marketingConsentAt DATETIME;
ALTER TABLE users ADD COLUMN marketingUnsubscribedAt DATETIME;

ALTER TABLE orders ADD COLUMN recoveryReminderSentAt DATETIME;
ALTER TABLE orders ADD COLUMN recoveryProcessingAt DATETIME;

CREATE TABLE recovery_settings (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  cartEnabled BOOLEAN NOT NULL DEFAULT true,
  cartDelayHours INTEGER NOT NULL DEFAULT 24,
  unpaidOrderEnabled BOOLEAN NOT NULL DEFAULT true,
  unpaidOrderDelayHours INTEGER NOT NULL DEFAULT 3,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE recovery_carts (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  email TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',
  cartHash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  lastActivityAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reminderSentAt DATETIME,
  processingAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  CONSTRAINT recovery_carts_userId_fkey FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX recovery_carts_userId_key ON recovery_carts(userId);
CREATE INDEX recovery_carts_active_lastActivityAt_reminderSentAt_idx ON recovery_carts(active, lastActivityAt, reminderSentAt);

CREATE TABLE recovery_email_logs (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  targetId TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  error TEXT,
  sentAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX recovery_email_logs_type_targetId_fingerprint_key ON recovery_email_logs(type, targetId, fingerprint);
CREATE INDEX recovery_email_logs_createdAt_idx ON recovery_email_logs(createdAt);
