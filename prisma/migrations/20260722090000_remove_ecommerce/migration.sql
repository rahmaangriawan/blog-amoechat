-- Remove the retired modem e-commerce module while remaining safe on
-- installations where these tables were never created.
DROP TABLE IF EXISTS `ProductReview`;
DROP TABLE IF EXISTS `OrderItem`;
DROP TABLE IF EXISTS `Order`;
DROP TABLE IF EXISTS `Product`;

SET @cleanup_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApiSetting'),
  'DELETE FROM `ApiSetting` WHERE `category` IN (''Duitku'', ''Biteship'') OR `key` LIKE ''DUITKU_%'' OR `key` LIKE ''BITESHIP_%''',
  'SELECT 1'
);
PREPARE cleanup_stmt FROM @cleanup_sql;
EXECUTE cleanup_stmt;
DEALLOCATE PREPARE cleanup_stmt;

SET @cleanup_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Notification'),
  'DELETE FROM `Notification` WHERE `type` IN (''ORDER_NEW'', ''PAYMENT_PAID'', ''PAYMENT_FAILED'', ''REVIEW_NEW'') OR `entityType` IN (''order'', ''product'', ''review'')',
  'SELECT 1'
);
PREPARE cleanup_stmt FROM @cleanup_sql;
EXECUTE cleanup_stmt;
DEALLOCATE PREPARE cleanup_stmt;

SET @cleanup_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'WhatsAppTemplate'),
  'DELETE FROM `WhatsAppTemplate` WHERE `eventKey` IN (''ORDER_CREATED'', ''ORDER_PAID'', ''ORDER_SHIPPED'', ''ORDER_DELIVERED'')',
  'SELECT 1'
);
PREPARE cleanup_stmt FROM @cleanup_sql;
EXECUTE cleanup_stmt;
DEALLOCATE PREPARE cleanup_stmt;

SET @cleanup_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'WhatsAppLog'),
  'DELETE FROM `WhatsAppLog` WHERE `event` IN (''ORDER_CREATED'', ''ORDER_PAID'', ''ORDER_SHIPPED'', ''ORDER_DELIVERED'') OR `entityType` IN (''order'', ''product'', ''review'')',
  'SELECT 1'
);
PREPARE cleanup_stmt FROM @cleanup_sql;
EXECUTE cleanup_stmt;
DEALLOCATE PREPARE cleanup_stmt;
