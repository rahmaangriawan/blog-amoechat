-- Drop rating column from Product (rating sekarang dihitung dari ProductReview)
ALTER TABLE `Product` DROP COLUMN IF EXISTS `rating`;

-- CreateTable: ProductReview
-- ENGINE=InnoDB eksplisit karena shared hosting kadang pakai MyISAM/Aria default
-- yang hanya izinkan key 1000 bytes.
CREATE TABLE IF NOT EXISTS `ProductReview` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductReview_status_idx`(`status`),
    INDEX `ProductReview_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ProductReview_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ProductReview_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
