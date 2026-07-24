-- =====================================================================
-- DEPLOY OUT OF STOCK — Tambah kolom outOfStock di Product
-- Run SEKALI di phpMyAdmin. Aman di-run ulang.
-- =====================================================================

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Product'
      AND COLUMN_NAME = 'outOfStock'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `Product` ADD COLUMN `outOfStock` TINYINT(1) NOT NULL DEFAULT 0 AFTER `isFeatured`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Selesai
