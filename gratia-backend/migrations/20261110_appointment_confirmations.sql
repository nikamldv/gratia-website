-- Persist the confirmed consultation time and delivery timestamp.
-- Safe to rerun; the application never executes this migration automatically.
SET @gratia_schema = DATABASE();

SET @gratia_has_appointment_time = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @gratia_schema
      AND TABLE_NAME = 'contact_messages'
      AND COLUMN_NAME = 'appointment_confirmed_at'
);
SET @gratia_sql = IF(
    @gratia_has_appointment_time = 0,
    'ALTER TABLE contact_messages ADD COLUMN appointment_confirmed_at DATETIME NULL DEFAULT NULL',
    'SELECT ''contact_messages.appointment_confirmed_at already exists'''
);
PREPARE gratia_stmt FROM @gratia_sql;
EXECUTE gratia_stmt;
DEALLOCATE PREPARE gratia_stmt;

SET @gratia_has_email_sent = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @gratia_schema
      AND TABLE_NAME = 'contact_messages'
      AND COLUMN_NAME = 'appointment_email_sent_at'
);
SET @gratia_sql = IF(
    @gratia_has_email_sent = 0,
    'ALTER TABLE contact_messages ADD COLUMN appointment_email_sent_at DATETIME NULL DEFAULT NULL',
    'SELECT ''contact_messages.appointment_email_sent_at already exists'''
);
PREPARE gratia_stmt FROM @gratia_sql;
EXECUTE gratia_stmt;
DEALLOCATE PREPARE gratia_stmt;