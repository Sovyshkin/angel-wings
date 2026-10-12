ALTER TABLE orders ADD COLUMN paymentUrl TEXT;
ALTER TABLE orders ADD COLUMN paymentAmount REAL;
ALTER TABLE orders ADD COLUMN paymentLinkId TEXT;
ALTER TABLE orders ADD COLUMN paymentCreationToken TEXT;
ALTER TABLE orders ADD COLUMN paymentCreationStartedAt DATETIME;
