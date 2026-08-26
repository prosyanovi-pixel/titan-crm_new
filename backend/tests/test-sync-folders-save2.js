const db = require('../db');
const { updateAccount } = require('../modules/mail/controllers/accounts');

// Мокаем объекты req и res
async function testUpdateAccount() {
  const accountId = 'mail_account_33673b4f-9fcf-448e-aa93-e4e5ccfecaa0';
  const userId = 'user_1';

  const syncFolders = {
    INBOX: 'INBOX',
    Sent: '[Gmail]/Отправленные',
    Drafts: '[Gmail]/Черновики',
    Trash: '[Gmail]/Корзина',
    Spam: '[Gmail]/Спам'
  };

  const req = {
    params: { accountId },
    body: {
      displayName: 'Test Account Updated',
      syncFolders: syncFolders // объект, не строка
    },
    get: function(header) {
      if (header === 'x-user-id') return userId;
      return null;
    }
  };

  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      console.log('Response JSON:', data);
      return this;
    }
  };

  try {
    console.log('Testing updateAccount with syncFolders...');
    console.log('Account ID:', accountId);
    console.log('syncFolders:', req.body.syncFolders);
    
    await updateAccount(req, res);
    
    // Проверим, что данные сохранились в БД
    const { rows } = await db.query(
      'SELECT sync_folders FROM mail_accounts WHERE id = $1',
      [accountId]
    );
    
    console.log('Result from DB:', rows[0]?.sync_folders);
    
    if (rows[0]?.sync_folders) {
      console.log('✅ sync_folders успешно сохранены в БД');
      try {
        const parsed = JSON.parse(rows[0].sync_folders);
        console.log('Parsed:', parsed);
      } catch (e) {
        console.log('Не удалось распарсить JSON:', e.message);
      }
    } else {
      console.log('❌ sync_folders не сохранены или null');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testUpdateAccount();