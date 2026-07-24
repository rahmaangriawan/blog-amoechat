-- Remove the retired internet-service data model. Pricing is now typed static content.
DROP TABLE IF EXISTS `AdministrativeRegion`;
DROP TABLE IF EXISTS `Registration`;
DROP TABLE IF EXISTS `Package`;

ALTER TABLE `SeoGlobal` DROP COLUMN `includePackagesSitemap`;

DELETE FROM `ApiSetting`
WHERE `key` IN (
  'REGISTRATION_SPREADSHEET_ID',
  'REGISTRATION_SHEET_NAME',
  'INTERNAL_FORWARD_WHATSAPP_ENABLED',
  'INTERNAL_FORWARD_WHATSAPP_NUMBER',
  'INTERNAL_FORWARD_WHATSAPP_NAME',
  'INTERNAL_FORWARD_TELEGRAM_ENABLED',
  'INTERNAL_FORWARD_TELEGRAM_BOT_TOKEN',
  'INTERNAL_FORWARD_TELEGRAM_CHAT_ID',
  'HOMEPAGE_PROMO_BANNERS'
);

DELETE FROM `Notification`
WHERE `type` = 'REGISTRATION_NEW' OR `entityType` = 'registration';

DELETE FROM `WhatsAppTemplate`
WHERE `eventKey` LIKE 'REGISTRATION_%';

DELETE FROM `WhatsAppLog`
WHERE `event` LIKE 'REGISTRATION_%' OR `entityType` = 'registration';
