const path = require('path');
const fs = require('fs');

// Проверка путей из mailSyncService
const mailSyncService = require('../modules/mail/services/mailSyncService');
const helpers = require('../modules/mail/utils/helpers');

console.log('=== Проверка путей вложений ===\n');

// 1. Проверка конфигурации
const config = require('../modules/mail/config');
console.log('Конфигурация attachments.uploadDir:', config.attachments.uploadDir);

// 2. Проверка вычисленного пути в mailSyncService
const syncService = new mailSyncService();
console.log('mailSyncService.uploadsDir:', syncService.uploadsDir);

// 3. Проверка пути из helpers
const accountId = 'mail_account_33673b4f-9fcf-448e-aa93-e4e5ccfecaa0';
const folderId = 'folder_a973e673-e508-419d-b7a3-35988b4f1092';
const mailId = 'test_mail_123';
const originalName = 'test.pdf';
const attachmentPath = helpers.buildAttachmentPath(accountId, folderId, mailId, originalName);
console.log('helpers.buildAttachmentPath:', attachmentPath);

// 4. Проверка существования директории uploads
const uploadsDir = path.join(__dirname, 'uploads', 'mail');
console.log('Ожидаемая директория uploads:', uploadsDir);
if (fs.existsSync(uploadsDir)) {
  console.log('✅ Директория uploads существует');
} else {
  console.log('❌ Директория uploads не существует, создаём...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 5. Проверка структуры поддиректорий (год/месяц/день)
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateDir = path.join(uploadsDir, String(year), month, day);
console.log('Дата-директория:', dateDir);
if (fs.existsSync(dateDir)) {
  console.log('✅ Дата-директория существует');
} else {
  console.log('⚠️  Дата-директория не существует (будет создана при сохранении вложения)');
}

console.log('\n=== Проверка завершена ===');