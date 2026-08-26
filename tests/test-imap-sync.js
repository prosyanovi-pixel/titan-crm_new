/**
 * Тестовый скрипт для синхронизации IMAP
 */
const { syncMailsFromImap } = require('./backend/modules/mail/imap');

const accountId = 'mail_account_cad830a0-a4e2-4ed1-83ec-2a62ab4a7514';
const userId = '2';

console.log('🔄 Starting IMAP sync test...');
console.log(`accountId: ${accountId}`);
console.log(`userId: ${userId}`);

syncMailsFromImap(accountId, userId)
  .then(result => {
    console.log('✅ Sync completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Sync failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  });

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Sync timeout');
  process.exit(1);
}, 30000);
