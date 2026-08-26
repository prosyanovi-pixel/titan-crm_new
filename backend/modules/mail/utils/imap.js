const Imap = require('imap');
const { simpleParser } = require('mailparser');
const crypto = require('crypto');
const db = require('../../db');

// Дешифровка пароля (из controllers.js)
const decrypt = (encrypted) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-secret-key', 'salt', 32);
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Глобальное хранилище для отслеживания открытых соединений
let imapInstance = null;

/**
 * Основная функция синхронизации - получает письма из всех папок
 */
const syncMailsFromImap = async (accountId, userId) => {
  console.log(`[IMAP] Starting sync for account ${accountId}`);
  
  try {
    // 1. Получить учетные данные аккаунта
    const { rows: accounts } = await db.query(
      'SELECT * FROM mail_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (!accounts.length) {
      throw new Error('Account not found');
    }

    const account = accounts[0];
    
    if (account.accountType !== 'imap') {
      throw new Error('Account is not IMAP type');
    }

    const password = decrypt(account.passwordEncrypted);
    console.log(`[IMAP] Connecting to ${account.imapHost}:${account.imapPort}`);

    // 2. Подключиться к IMAP серверу
    const imap = new Imap({
      user: account.login,
      password: password,
      host: account.imapHost,
      port: account.imapPort,
      tls: account.useTls === true || account.useTls === 1,
      tlsOptions: { rejectUnauthorized: false },
      debug: () => {} // Скрыть verbose логи
    });

    return new Promise((resolve, reject) => {
      imap.on('error', (err) => {
        console.error(`[IMAP CONNECTION ERROR]:`, err);
        reject(err);
      });

      imap.on('ready', async () => {
        console.log(`[IMAP] Connected and authenticated`);

        try {
          // Сначала создадим/обновим структуру папок
          imap.getBoxes((err, boxes) => {
            if (err) {
              console.error(`[IMAP ERROR] Failed to get folders:`, err);
              imap.end();
              return reject(err);
            }

            // Обработать структуру папок
            processFolders(boxes, accountId, userId)
              .then(async () => {
                console.log(`[IMAP] Folders created, now loading mails...`);
                
                // Загрузить письма из всех папок
                const mailCount = await loadAllMails(imap, accountId, userId);
                
                imap.end();
                console.log(`[IMAP] Sync completed. Total mails: ${mailCount}`);
                resolve({ mails: mailCount });
              })
              .catch((err) => {
                console.error(`[IMAP ERROR]:`, err);
                imap.end();
                reject(err);
              });
          });
        } catch (error) {
          console.error(`[IMAP ERROR] Connection error:`, error);
          imap.end();
          reject(error);
        }
      });

      imap.connect();
    });

  } catch (error) {
    console.error(`[IMAP SYNC ERROR] ${error.message}`);
    throw error;
  }
};

/**
 * Обработать структуру папок и создать их в БД
 */
async function processFolders(folderMap, accountId, userId, parent = null) {
  for (const folderName in folderMap) {
    const folderData = folderMap[folderName];
    
    // Определить тип и имя папки
    let folderType = 'custom';
    let displayFolderName = folderName;

    if (folderName === 'INBOX') {
      folderType = 'system';
      displayFolderName = 'Inbox';
    } else if (folderData.special_use_flags) {
      folderType = 'system';
      if (folderData.special_use_flags.includes('\\All')) displayFolderName = 'Archive';
      if (folderData.special_use_flags.includes('\\Archive')) displayFolderName = 'Archive';
      if (folderData.special_use_flags.includes('\\Drafts')) displayFolderName = 'Drafts';
      if (folderData.special_use_flags.includes('\\Sent')) displayFolderName = 'Sent Mail';
      if (folderData.special_use_flags.includes('\\Spam')) displayFolderName = 'Spam';
      if (folderData.special_use_flags.includes('\\Trash')) displayFolderName = 'Trash';
    }

    try {
      // Проверить существует ли папка
      const { rows: existing } = await db.query(
        'SELECT id FROM mail_folders WHERE account_id = $1 AND folder_name = $2',
        [accountId, displayFolderName]
      );

      if (existing.length === 0) {
        const folderId = `folder_${crypto.randomUUID()}`;
        await db.query(
          `INSERT INTO mail_folders 
           (id, account_id, user_id, folder_name, folder_type, imap_folder_path, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [folderId, accountId, userId, displayFolderName, folderType, folderName]
        );
        console.log(`[IMAP] Created folder: ${displayFolderName}`);
      }
    } catch (err) {
      console.error(`[IMAP] Error with folder ${displayFolderName}:`, err.message);
    }

    // Рекурсивно обработать подпапки
    if (folderData.children) {
      await processFolders(folderData.children, accountId, userId, folderName);
    }
  }
}

/**
 * Загрузить письма из всех папок
 */
async function loadAllMails(imap, accountId, userId) {
  try {
    // Получить все папки из БД для этого аккаунта
    const { rows: folders } = await db.query(
      `SELECT id, folder_name, imap_folder_path FROM mail_folders 
       WHERE account_id = $1 
       ORDER BY folder_name`,
      [accountId]
    );

    console.log(`[IMAP] Loading mails from ${folders.length} folders`);
    let totalMails = 0;

    // Загрузить письма из каждой папки
    for (const folder of folders) {
      try {
        const imapPath = folder.imapFolderPath || folder.imap_folder_path;
        console.log(`[IMAP] Loading from folder: ${folder.folderName} (${imapPath})`);
        
        const count = await loadMailsFromFolder(imap, accountId, userId, folder.id, imapPath);
        totalMails += count;
      } catch (err) {
        console.error(`[IMAP] Error loading folder ${folder.folderName}:`, err.message);
      }
    }

    return totalMails;
  } catch (error) {
    console.error(`[IMAP] Error loading all mails:`, error);
    return 0;
  }
}

/**
 * Загрузить письма из одной папки
 */
function loadMailsFromFolder(imap, accountId, userId, folderId, imapPath) {
  return new Promise((resolve, reject) => {
    imap.openBox(imapPath, false, (err, box) => {
      if (err) {
        console.error(`[IMAP] Failed to open ${imapPath}:`, err.message);
        return resolve(0);
      }

      const totalMessages = box.messages.total;
      console.log(`[IMAP] ${imapPath}: ${totalMessages} messages`);

      if (totalMessages === 0) {
        return resolve(0);
      }

      // Получить последние 50 писем
      const searchCriteria = ['ALL'];
      imap.search(searchCriteria, async (err, results) => {
        if (err) {
          console.error(`[IMAP] Search failed in ${imapPath}:`, err);
          return resolve(0);
        }

        if (results.length === 0) {
          return resolve(0);
        }

        const toFetch = results.slice(Math.max(0, results.length - 50));
        let processedCount = 0;

        const f = imap.fetch(toFetch, { bodies: '' });

        f.on('message', (msg, seqno) => {
          let chunks = '';

          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              chunks += chunk.toString();
            });

            stream.on('end', () => {
              simpleParser(chunks, async (err, parsed) => {
                if (err) {
                  console.error(`[IMAP] Parse error:`, err);
                  return;
                }

                try {
                  // MAIL-7: Уникальный ID на основе Message-ID или хеша
                  const messageId = parsed.messageId || `${parsed.from?.address || ''}-${parsed.subject || ''}-${parsed.date?.toISOString() || ''}`;
                  const mailId = `mail_${crypto.createHash('md5').update(messageId).digest('hex')}`;
                  
                  // MAIL-7: Корректная обработка даты
                  let mailDate = new Date();
                  if (parsed.date) {
                    mailDate = new Date(parsed.date);
                    if (isNaN(mailDate.getTime())) {
                      console.warn(`[IMAP] Invalid date ${parsed.date}, using current date`);
                      mailDate = new Date();
                    }
                  }
                  const dateStr = mailDate.toISOString();

                  await db.query(
                    `INSERT INTO mail
                     (id, account_id, folder_id, user_id, subject, sender, senderemail, content, preview, html_content, date, is_read, is_starred, has_attachments, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                     ON CONFLICT(id) DO UPDATE SET
                       subject = EXCLUDED.subject,
                       sender = EXCLUDED.sender,
                       senderemail = EXCLUDED.senderemail,
                       content = EXCLUDED.content,
                       preview = EXCLUDED.preview,
                       html_content = EXCLUDED.html_content,
                       date = EXCLUDED.date,
                       is_read = EXCLUDED.is_read,
                       has_attachments = EXCLUDED.has_attachments,
                       updated_at = NOW()`,
                    [
                      mailId,
                      accountId,
                      folderId,
                      userId,
                      parsed.subject || '(No Subject)',
                      parsed.from?.text || 'Unknown',
                      parsed.from?.address || '',
                      parsed.text || '',
                      (parsed.text || '').substring(0, 200),
                      parsed.html || '',
                      dateStr,
                      Boolean(msg.flags && msg.flags.includes('\\Seen')),
                      false,
                      Boolean(parsed.attachments && parsed.attachments.length > 0),
                      new Date().toISOString(),
                      new Date().toISOString()
                    ]
                  );
                  processedCount++;
                  console.log(`[IMAP] Saved mail: ${mailId} - ${parsed.subject}`);
                } catch (dbErr) {
                  console.error(`[IMAP] DB error:`, dbErr.message);
                }
              });
            });
          });
        });

        f.on('error', (err) => {
          console.error(`[IMAP] Fetch error in ${imapPath}:`, err);
          resolve(processedCount);
        });

        f.on('end', () => {
          setTimeout(() => {
            console.log(`[IMAP] Completed ${imapPath}: ${processedCount} mails`);
            resolve(processedCount);
          }, 500);
        });
      });
    });
  });
}

module.exports = {
  syncMailsFromImap
};

