ALTER TABLE `Comment` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

UPDATE `Comment`
SET `status` = CASE
  WHEN `isApproved` = true THEN 'APPROVED'
  ELSE 'PENDING'
END;

CREATE INDEX `Comment_status_createdAt_idx` ON `Comment`(`status`, `createdAt`);
