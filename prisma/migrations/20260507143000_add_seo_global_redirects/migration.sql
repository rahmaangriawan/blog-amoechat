CREATE TABLE `SeoGlobal` (
    `id` VARCHAR(191) NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `canonicalUrl` VARCHAR(191) NULL,
    `ogTitle` VARCHAR(191) NULL,
    `ogDescription` TEXT NULL,
    `ogImage` VARCHAR(191) NULL,
    `twitterTitle` VARCHAR(191) NULL,
    `twitterDescription` TEXT NULL,
    `twitterImage` VARCHAR(191) NULL,
    `headerLogo` VARCHAR(191) NULL,
    `footerLogo` VARCHAR(191) NULL,
    `favicon` VARCHAR(191) NULL,
    `appleTouchIcon` VARCHAR(191) NULL,
    `ogDefaultImage` VARCHAR(191) NULL,
    `allowIndexing` BOOLEAN NOT NULL DEFAULT true,
    `disallowPaths` TEXT NULL,
    `includeBlogSitemap` BOOLEAN NOT NULL DEFAULT true,
    `includePagesSitemap` BOOLEAN NOT NULL DEFAULT true,
    `includePackagesSitemap` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Redirect` (
    `id` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `targetUrl` VARCHAR(191) NOT NULL,
    `type` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Redirect_sourceUrl_key`(`sourceUrl`),
    INDEX `Redirect_isActive_type_idx`(`isActive`, `type`),
    INDEX `Redirect_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
