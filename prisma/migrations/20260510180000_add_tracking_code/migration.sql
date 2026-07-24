-- Add trackingCode column to Registration
ALTER TABLE `Registration`
    ADD COLUMN `trackingCode` VARCHAR(191) NULL AFTER `id`;

-- Kode tracking tidak di-backfill otomatis.
-- Nilai wajib diinput manual dari sistem Telkomsel oleh marketing.

-- Add unique constraint and index
CREATE UNIQUE INDEX `Registration_trackingCode_key` ON `Registration`(`trackingCode`);
CREATE INDEX `Registration_trackingCode_idx` ON `Registration`(`trackingCode`);
