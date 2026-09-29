ALTER TABLE consultation_requests ADD COLUMN rewardGrantedAt DATETIME;
ALTER TABLE consultation_requests ADD COLUMN rewardOrderId INTEGER;

CREATE INDEX IF NOT EXISTS consultation_requests_userId_status_rewardGrantedAt_idx
  ON consultation_requests(userId, status, rewardGrantedAt);
CREATE INDEX IF NOT EXISTS consultation_requests_rewardOrderId_idx
  ON consultation_requests(rewardOrderId);
