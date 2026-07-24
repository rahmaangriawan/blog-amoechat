-- =====================================================================
-- DEPLOY REGISTRATION REGIONS - Run in phpMyAdmin SQL tab
-- Adds administrative region lookup and region fields for registrations.
-- Source: https://github.com/cahyadsn/wilayah db/wilayah.sql (MIT)
-- Safe to run again. Existing Registration rows are preserved.
-- =====================================================================

SET NAMES utf8mb4;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'provinceCode');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `provinceCode` VARCHAR(13) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'provinceName');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `provinceName` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'regencyCode');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `regencyCode` VARCHAR(13) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'regencyName');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `regencyName` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'districtCode');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `districtCode` VARCHAR(13) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'districtName');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `districtName` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'villageCode');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `villageCode` VARCHAR(13) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'villageName');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `villageName` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'sheetSyncedAt');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `sheetSyncedAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND COLUMN_NAME = 'sheetSyncError');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `Registration` ADD COLUMN `sheetSyncError` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND INDEX_NAME = 'Registration_provinceCode_idx');
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX `Registration_provinceCode_idx` ON `Registration` (`provinceCode`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Registration' AND INDEX_NAME = 'Registration_regencyCode_idx');
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX `Registration_regencyCode_idx` ON `Registration` (`regencyCode`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `AdministrativeRegion` (
  `code` VARCHAR(13) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `level` VARCHAR(16) NOT NULL,
  `parentCode` VARCHAR(13) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AdministrativeRegion_level_name_idx` (`level`, `name`),
  INDEX `AdministrativeRegion_parentCode_name_idx` (`parentCode`, `name`),
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ApiSetting` (`id`, `key`, `value`, `category`, `isSecret`, `createdAt`, `updatedAt`)
VALUES (CONCAT('manual-', 'REGISTRATION_SPREADSHEET_ID'), 'REGISTRATION_SPREADSHEET_ID', '', 'Google', 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `category` = VALUES(`category`), `isSecret` = VALUES(`isSecret`);

INSERT INTO `ApiSetting` (`id`, `key`, `value`, `category`, `isSecret`, `createdAt`, `updatedAt`)
VALUES (CONCAT('manual-', 'REGISTRATION_SHEET_NAME'), 'REGISTRATION_SHEET_NAME', 'Pendaftaran Paket', 'Google', 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `category` = VALUES(`category`), `isSecret` = VALUES(`isSecret`);

