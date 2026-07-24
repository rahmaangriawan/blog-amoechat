-- Migration: add_user_table
CREATE TABLE IF NOT EXISTS `User` (
  `id`           VARCHAR(191) NOT NULL,
  `name`         VARCHAR(191) NOT NULL,
  `email`        VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role`         VARCHAR(191) NOT NULL DEFAULT 'MEMBER',
  `isActive`     TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_email_idx` (`email`),
  KEY `User_role_idx` (`role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
