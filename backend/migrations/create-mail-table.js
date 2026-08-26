const db = require('../db');

async function createMailTable() {
  console.log('Creating mail table...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS mail (
      id VARCHAR(50) PRIMARY KEY,
      subject VARCHAR(500),
      sender VARCHAR(500),
      sender_email VARCHAR(500),
      content TEXT,
      html_content TEXT,
      folder VARCHAR(50) DEFAULT 'inbox',
      read BOOLEAN DEFAULT FALSE,
      is_starred BOOLEAN DEFAULT FALSE,
      label VARCHAR(100),
      has_attachments BOOLEAN DEFAULT FALSE,
      date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed test data
  const mails = [
    {
      id: 'm1',
      subject: 'Добро пожаловать в TITAN CRM',
      sender: 'Администратор',
      sender_email: 'admin@titan-crm.local',
      content: 'Добро пожаловать в систему TITAN CRM!\n\nЭто тестовое письмо для проверки почтового модуля.',
      folder: 'inbox',
      read: false,
      is_starred: true,
      label: 'important'
    },
    {
      id: 'm2',
      subject: 'Новая задача назначена',
      sender: 'Система задач',
      sender_email: 'tasks@titan-crm.local',
      content: 'Вам назначена новая задача: "Подготовить отчёт за квартал".\n\nСрок: до конца недели.',
      folder: 'inbox',
      read: false,
      label: 'tasks'
    },
    {
      id: 'm3',
      subject: 'Напоминание о встрече',
      sender: 'Календарь',
      sender_email: 'calendar@titan-crm.local',
      content: 'Напоминаем о встрече с клиентом через 30 минут.\n\nМесто: Переговорная №1',
      folder: 'inbox',
      read: true,
      label: 'meetings'
    },
    {
      id: 'm4',
      subject: 'Обновление системы',
      sender: 'System',
      sender_email: 'system@titan-crm.local',
      content: 'Система обновлена до версии 1.0.0\n\nИзменения:\n- Улучшена производительность\n- Исправлены ошибки',
      folder: 'inbox',
      read: true
    },
    {
      id: 'm5',
      subject: 'Финансовый отчёт',
      sender: 'Финансы',
      sender_email: 'finance@titan-crm.local',
      content: 'Финансовый отчёт за март готов.\n\nОбщая выручка: 1 500 000 руб.\nРасходы: 800 000 руб.\nПрибыль: 700 000 руб.',
      folder: 'inbox',
      read: false,
      is_starred: true,
      label: 'finance'
    }
  ];

  for (const mail of mails) {
    await db.query(
      `INSERT INTO mail (id, subject, sender, sender_email, content, folder, read, is_starred, label)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         subject = EXCLUDED.subject,
         sender = EXCLUDED.sender,
         sender_email = EXCLUDED.sender_email,
         content = EXCLUDED.content,
         folder = EXCLUDED.folder,
         read = EXCLUDED.read,
         is_starred = EXCLUDED.is_starred,
         label = EXCLUDED.label`,
      [mail.id, mail.subject, mail.sender, mail.sender_email, mail.content, mail.folder, mail.read, mail.is_starred, mail.label]
    );
  }

  console.log('✅ Mail table created and seeded with', mails.length, 'test emails');
}

module.exports = createMailTable;
