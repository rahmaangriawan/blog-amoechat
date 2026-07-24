-- Reconcile the empty local Amoechat database with the current blog schema.
-- This migration intentionally contains no seed data and no e-commerce tables.

ALTER TABLE `article` ADD COLUMN `authorId` VARCHAR(191) NULL;

ALTER TABLE `package` ADD COLUMN `cardBadge` VARCHAR(191) NULL,
    ADD COLUMN `cardLabel` VARCHAR(191) NULL,
    ADD COLUMN `featuredImage` TEXT NULL;

ALTER TABLE `registration` ADD COLUMN `districtCode` VARCHAR(13) NULL,
    ADD COLUMN `districtName` VARCHAR(100) NULL,
    ADD COLUMN `provinceCode` VARCHAR(13) NULL,
    ADD COLUMN `provinceName` VARCHAR(100) NULL,
    ADD COLUMN `regencyCode` VARCHAR(13) NULL,
    ADD COLUMN `regencyName` VARCHAR(100) NULL,
    ADD COLUMN `sheetSyncError` TEXT NULL,
    ADD COLUMN `sheetSyncedAt` DATETIME(3) NULL,
    ADD COLUMN `trackingCode` VARCHAR(191) NULL,
    ADD COLUMN `villageCode` VARCHAR(13) NULL,
    ADD COLUMN `villageName` VARCHAR(100) NULL;

CREATE TABLE `AdministrativeRegion` (
    `code` VARCHAR(13) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `level` VARCHAR(16) NOT NULL,
    `parentCode` VARCHAR(13) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `AdministrativeRegion_level_name_idx`(`level`, `name`),
    INDEX `AdministrativeRegion_parentCode_name_idx`(`parentCode`, `name`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InternshipApplication` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(32) NOT NULL,
    `institutionName` VARCHAR(191) NOT NULL,
    `major` VARCHAR(191) NULL,
    `educationLevel` VARCHAR(32) NOT NULL,
    `internshipType` VARCHAR(32) NOT NULL,
    `interestField` VARCHAR(191) NOT NULL,
    `startPeriod` VARCHAR(64) NULL,
    `duration` VARCHAR(64) NULL,
    `portfolioUrl` TEXT NULL,
    `message` TEXT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    `sheetSyncedAt` DATETIME(3) NULL,
    `sheetSyncError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `InternshipApplication_status_idx`(`status`),
    INDEX `InternshipApplication_createdAt_idx`(`createdAt`),
    INDEX `InternshipApplication_phoneNumber_idx`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'MEMBER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isAuthor` BOOLEAN NOT NULL DEFAULT false,
    `authorSlug` VARCHAR(191) NULL,
    `authorRole` VARCHAR(120) NULL,
    `authorBio` TEXT NULL,
    `authorAvatarUrl` TEXT NULL,
    `lastSeenNotificationAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_authorSlug_key`(`authorSlug`),
    INDEX `User_isAuthor_idx`(`isAuthor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` TEXT NULL,
    `entityType` VARCHAR(32) NULL,
    `entityId` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    INDEX `Notification_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WhatsAppTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `eventKey` VARCHAR(64) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `WhatsAppTemplate_eventKey_key`(`eventKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WhatsAppLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` VARCHAR(64) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `entityType` VARCHAR(32) NULL,
    `entityId` VARCHAR(64) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    `responseBody` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `WhatsAppLog_status_idx`(`status`),
    INDEX `WhatsAppLog_createdAt_idx`(`createdAt`),
    INDEX `WhatsAppLog_event_idx`(`event`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Article_authorId_idx` ON `Article`(`authorId`);
CREATE UNIQUE INDEX `Registration_trackingCode_key` ON `Registration`(`trackingCode`);
CREATE INDEX `Registration_trackingCode_idx` ON `Registration`(`trackingCode`);
CREATE INDEX `Registration_provinceCode_idx` ON `Registration`(`provinceCode`);
CREATE INDEX `Registration_regencyCode_idx` ON `Registration`(`regencyCode`);

ALTER TABLE `Article` ADD CONSTRAINT `Article_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
