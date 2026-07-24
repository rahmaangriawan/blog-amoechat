-- =====================================================================
-- DEPLOY NOTIFICATIONS & WHATSAPP — Run di phpMyAdmin setelah kode di-push
-- Menambahkan:
--   * Notification (broadcast list untuk admin dashboard)
--   * WhatsAppTemplate (template pesan editable)
--   * WhatsAppLog (audit log pengiriman)
--   * User.lastSeenNotificationAt
--   * Seed template WhatsApp default
-- Aman di-run ulang.
-- =====================================================================

-- 1. User.lastSeenNotificationAt
SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'User'
      AND COLUMN_NAME = 'lastSeenNotificationAt'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `User` ADD COLUMN `lastSeenNotificationAt` DATETIME(3) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Notification
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

-- 3. WhatsAppTemplate
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

-- 4. WhatsAppLog
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

-- 5. Seed template WhatsApp default
INSERT IGNORE INTO `WhatsAppTemplate` (`id`, `eventKey`, `title`, `body`, `isEnabled`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'REGISTRATION_CREATED', 'Pendaftaran Diterima',
 'Halo {{name}}, terima kasih sudah daftar di AMOECHAT!\n\nPendaftaran paket "{{package}}" sudah kami terima. Kode tracking kamu: *{{code}}*\n\nCek status kapan saja di: {{trackingUrl}}\n\nTim kami akan menghubungi kamu segera.',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_INSTALLED', 'Pemasangan Selesai',
 'Halo {{name}}, paket internet kamu sudah terpasang dan aktif. Selamat menikmati layanan AMOECHAT!\n\nKode tracking: {{code}}',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_APPROVED', 'Pendaftaran Disetujui',
 'Halo {{name}}, pendaftaran paket internet kamu telah disetujui. Terima kasih telah memilih AMOECHAT!',
 true, NOW(3), NOW(3)),

-- Follow-up per status registrasi (dipakai tombol Follow Up di dashboard)
(UUID(), 'REGISTRATION_FOLLOWUP_PENDING', 'Follow Up: Pending',
 'Halo {{name}}, pendaftaran paket *{{package}}* masih dalam review kami.\n\nKode tracking: *{{code}}*\n\nTim kami akan segera memproses pendaftaran Anda. Terima kasih telah memilih AMOECHAT.',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_FOLLOWUP_CONTACTED', 'Follow Up: Sudah Dihubungi',
 'Halo {{name}}, kami ingin follow up pendaftaran paket *{{package}}* Anda.\n\nKode tracking: {{code}}\n\nApakah ada pertanyaan atau kendala yang perlu kami bantu?',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_FOLLOWUP_SURVEY', 'Follow Up: Survey Lokasi',
 'Halo {{name}}, tim survey kami akan mengunjungi lokasi Anda untuk cek ketersediaan jaringan untuk paket *{{package}}*.\n\nMohon konfirmasi jadwal dan pastikan ada yang bisa menemui tim kami. Kode tracking: {{code}}',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_FOLLOWUP_INSTALLATION', 'Follow Up: Proses Pemasangan',
 'Halo {{name}}, paket *{{package}}* Anda sedang dalam proses pemasangan oleh teknisi kami.\n\nMohon pastikan ada yang di rumah untuk mendampingi proses instalasi. Kode tracking: {{code}}',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_FOLLOWUP_INSTALLED', 'Follow Up: Sudah Terpasang',
 'Halo {{name}}, paket *{{package}}* Anda sudah terpasang dan aktif.\n\nSelamat menikmati layanan AMOECHAT. Apabila ada kendala, jangan ragu untuk menghubungi kami. Kode tracking: {{code}}',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_FOLLOWUP_APPROVED', 'Follow Up: Disetujui',
 'Halo {{name}}, selamat! Pendaftaran paket *{{package}}* sudah disetujui dan layanan dapat digunakan.\n\nTerima kasih telah memilih AMOECHAT. Kode tracking: {{code}}',
 true, NOW(3), NOW(3)),

(UUID(), 'REGISTRATION_FOLLOWUP_REJECTED', 'Follow Up: Ditolak',
 'Halo {{name}}, mohon maaf, pendaftaran paket *{{package}}* belum bisa kami proses saat ini.\n\nSilakan hubungi tim kami untuk informasi lebih lanjut. Kode tracking: {{code}}',
 true, NOW(3), NOW(3));

-- 6. Sync Prisma migration state
INSERT IGNORE INTO `_prisma_migrations`
    (`id`, `checksum`, `migration_name`, `started_at`, `finished_at`, `applied_steps_count`)
VALUES
    (UUID(), 'manual-deploy-2026-05-11-notifications', '20260511150000_add_notifications', NOW(3), NOW(3), 1);
