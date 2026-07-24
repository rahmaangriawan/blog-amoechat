-- Jalankan sekali di phpMyAdmin untuk menambah profil author publik per user
-- dan relasi author pada tabel Article.

ALTER TABLE `User`
  ADD COLUMN `isAuthor` tinyint(1) NOT NULL DEFAULT 0 AFTER `isActive`,
  ADD COLUMN `authorSlug` varchar(191) NULL AFTER `isAuthor`,
  ADD COLUMN `authorRole` varchar(120) NULL AFTER `authorSlug`,
  ADD COLUMN `authorBio` longtext NULL AFTER `authorRole`,
  ADD COLUMN `authorAvatarUrl` longtext NULL AFTER `authorBio`,
  ADD UNIQUE KEY `User_authorSlug_key` (`authorSlug`),
  ADD KEY `User_isAuthor_idx` (`isAuthor`);

ALTER TABLE `Article`
  ADD COLUMN `authorId` varchar(191) NULL AFTER `featuredImage`,
  ADD KEY `Article_authorId_idx` (`authorId`),
  ADD CONSTRAINT `Article_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `User` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
