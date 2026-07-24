-- Add lastSeenNotificationAt to User
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `lastSeenNotificationAt` DATETIME(3) NULL;

-- Add trackingResi to Order
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `trackingResi` VARCHAR(191) NULL;

-- Notification table
CREATE TABLE IF NOT EXISTS `Notification` (
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
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- WhatsAppTemplate
CREATE TABLE IF NOT EXISTS `WhatsAppTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `eventKey` VARCHAR(64) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `WhatsAppTemplate_eventKey_key`(`eventKey`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- WhatsAppLog
CREATE TABLE IF NOT EXISTS `WhatsAppLog` (
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
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
