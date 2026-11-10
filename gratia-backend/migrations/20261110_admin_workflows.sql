-- GRATIA internal workflow support.
-- Safe to rerun; this migration is never executed automatically by the app.

SET @gratia_schema = DATABASE();

-- Keep old contact messages without an assumed state. New messages are
-- explicitly created as "Neu" by the matching backend release.
SET @gratia_contact_status_type = NULL;
SET @gratia_contact_status_length = NULL;
SELECT MAX(DATA_TYPE), MAX(CHARACTER_MAXIMUM_LENGTH)
INTO @gratia_contact_status_type, @gratia_contact_status_length
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @gratia_schema
  AND TABLE_NAME = 'contact_messages'
  AND COLUMN_NAME = 'status';
SET @gratia_sql = CASE
    WHEN @gratia_contact_status_type IS NULL THEN
        'ALTER TABLE contact_messages ADD COLUMN status VARCHAR(32) NULL DEFAULT NULL'
    WHEN @gratia_contact_status_type NOT IN ('varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext')
         OR (@gratia_contact_status_type IN ('varchar', 'char') AND COALESCE(@gratia_contact_status_length, 0) < 32) THEN
        'ALTER TABLE contact_messages MODIFY COLUMN status VARCHAR(32) NULL DEFAULT NULL'
    ELSE
        'SELECT ''contact_messages.status already supports workflow values'''
END;
PREPARE gratia_stmt FROM @gratia_sql;
EXECUTE gratia_stmt;
DEALLOCATE PREPARE gratia_stmt;

-- Applications already have a status field in the current API. Widen an enum,
-- numeric, or short text field so the supported workflow values can be stored.
SET @gratia_app_status_type = NULL;
SET @gratia_app_status_length = NULL;
SELECT MAX(DATA_TYPE), MAX(CHARACTER_MAXIMUM_LENGTH)
INTO @gratia_app_status_type, @gratia_app_status_length
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @gratia_schema
  AND TABLE_NAME = 'applications'
  AND COLUMN_NAME = 'status';

SET @gratia_sql = CASE
    WHEN @gratia_app_status_type IS NULL THEN
        'ALTER TABLE applications ADD COLUMN status VARCHAR(50) NULL DEFAULT ''neu'''
    WHEN @gratia_app_status_type NOT IN ('varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext')
         OR (@gratia_app_status_type IN ('varchar', 'char') AND COALESCE(@gratia_app_status_length, 0) < 50) THEN
        'ALTER TABLE applications MODIFY COLUMN status VARCHAR(50) NULL DEFAULT ''neu'''
    ELSE
        'SELECT ''applications.status already supports workflow values'''
END;
PREPARE gratia_stmt FROM @gratia_sql;
EXECUTE gratia_stmt;
DEALLOCATE PREPARE gratia_stmt;

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    actor_name VARCHAR(150) NOT NULL,
    action_key VARCHAR(64) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_value VARCHAR(50) NULL,
    new_value VARCHAR(50) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_admin_audit_log_changed_at (changed_at),
    KEY idx_admin_audit_log_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
