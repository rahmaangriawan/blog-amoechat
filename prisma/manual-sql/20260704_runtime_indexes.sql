-- Optional CMS runtime index for existing installations.
SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Article' AND INDEX_NAME = 'Article_type_isPublished_createdAt_opt_idx'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `Article` ADD INDEX `Article_type_isPublished_createdAt_opt_idx` (`type`, `isPublished`, `createdAt`)',
  'SELECT ''Article_type_isPublished_createdAt_opt_idx already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
