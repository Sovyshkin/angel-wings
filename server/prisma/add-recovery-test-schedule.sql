-- Run once when recovery_email_logs was created by an earlier deployment.
ALTER TABLE recovery_email_logs ADD COLUMN scheduledFor DATETIME;
ALTER TABLE recovery_email_logs ADD COLUMN processingAt DATETIME;
CREATE INDEX recovery_email_logs_status_scheduledFor_idx ON recovery_email_logs(status, scheduledFor);
