
const db = require('../db');

async function inspectMail() {
  try {
    console.log('\n📊 ОБЗОР МОДУЛЯ ПОЧТА В БД\n');

    // 1. Аккаунты
    const { rows: accounts } = await db.query(`
      SELECT id, email, display_name, sync_mode, is_active 
      FROM mail_accounts
    `);
    console.log(`✅ Аккаунтов: ${accounts.length}`);
    accounts.forEach(a => {
      console.log(`   - ${a.email} [${a.syncMode || 'light'}] (Active: ${a.isActive})`);
    });

    // 2. Папки
    const { rows: folders } = await db.query(`
      SELECT f.id, f.folder_name as "folderName", f.folder_type as "folderType", a.email,
             (SELECT COUNT(*) FROM mail m WHERE m.folder_id = f.id) as mail_count
      FROM mail_folders f
      JOIN mail_accounts a ON f.account_id = a.id
      ORDER BY a.email, f.folder_name
    `);
    console.log(`\n✅ Папок: ${folders.length}`);
    let currentEmail = '';
    folders.forEach(f => {
      if (currentEmail !== f.email) {
        currentEmail = f.email;
        console.log(`   📧 ${currentEmail}:`);
      }
      console.log(`      - ${f.folderName} (${f.folderType}): ${f.mailCount || 0} писем`);
    });

    // 3. Общая статистика писем
    const { rows: mailStats } = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN has_attachments = true THEN 1 END) as with_attachments
      FROM mail
    `);
    console.log(`\n✅ Всего писем в БД: ${mailStats[0].total}`);
    console.log(`   - Непрочитанных: ${mailStats[0].unread}`);
    console.log(`   - С вложениями: ${mailStats[0].withAttachments}`);

    // 4. Статистика вложений
    const { rows: attStats } = await db.query(`
      SELECT COUNT(*) as total, SUM(file_size) as "totalSize"
      FROM mail_attachments
    `);
    const sizeMb = (attStats[0].totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\n✅ Вложений в БД: ${attStats[0].total}`);
    console.log(`   - Общий объем: ${sizeMb} MB`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при инспекции БД:', error);
    process.exit(1);
  }
}

inspectMail();
