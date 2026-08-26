/**
 * Mail Module - Folders Controller
 * CRUD папок, IMAP-синхронизация папок, очистка, удаление дубликатов
 */

const db = require('../../../db');
const { v4: uuidv4 } = require('uuid');
const mailSyncService = require('../services/mailSyncService');
const helpers = require('../utils/helpers');
const logger = require('../../../utils/logger');

// Используем централизованную функцию разрешения путей из helpers
const resolveImapBoxPath = helpers.resolveImapBoxPath;

// ----- GET folders -----

async function getFolders(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      'SELECT id, folder_name, folder_type, parent_folder_id, unseen_count, total_count, imap_folder_path, display_order, is_visible, is_sync_enabled FROM mail_folders WHERE account_id = $1 AND user_id = $2 ORDER BY display_order ASC',
      [req.params.accountId, userId]
    );
    res.json(rows);
  } catch (error) {
    logger.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
}

// ----- CLEANUP duplicate folders -----

async function cleanupDuplicateFolders(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    await db.query('BEGIN');

    const { rows } = await db.query(
      `SELECT id, folder_name, folder_type, imap_folder_path, display_order
       FROM mail_folders
       WHERE account_id = $1 AND user_id = $2
         AND LOWER(COALESCE(folder_type, '')) IN ('system', 'inbox', 'sent', 'drafts', 'archive', 'spam', 'trash')
       ORDER BY display_order ASC, created_at ASC`,
      [req.params.accountId, userId]
    );

    const groups = new Map();
    for (const folder of rows) {
      const key = helpers.toCanonicalFolderType(folder.folderType, folder.folderName);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(folder);
    }

    let removedDuplicates = 0;
    let movedMails = 0;
    let updatedFilters = 0;

    for (const group of groups.values()) {
      if (group.length <= 1) continue;

      const preferred = group.find((f) => (f.folderType || '').toLowerCase() !== 'system') || group[0];
      const duplicates = group.filter((f) => f.id !== preferred.id);

      for (const duplicate of duplicates) {
        const moved = await db.query(
          `UPDATE mail SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE folder_id = $2 AND user_id = $3`,
          [preferred.id, duplicate.id, userId]
        );
        movedMails += moved.rowCount || 0;

        const updated = await db.query(
          `UPDATE mail_filters SET target_folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE target_folder_id = $2 AND user_id = $3`,
          [preferred.id, duplicate.id, userId]
        );
        updatedFilters += updated.rowCount || 0;

        await db.query('DELETE FROM mail_folders WHERE id = $1 AND user_id = $2', [duplicate.id, userId]);
        removedDuplicates += 1;
      }
    }

    await db.query('COMMIT');
    res.json({ success: true, removedDuplicates, movedMails, updatedFilters });
  } catch (error) {
    await db.query('ROLLBACK');
    logger.error('Error cleaning folder duplicates:', error);
    res.status(500).json({ error: 'Failed to cleanup duplicate folders' });
  }
}

// ----- GET IMAP folders -----

async function getImapFolders(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  let imap = null;
  try {
    const { rows: accountRows } = await db.query(
      'SELECT id, email, login, password_encrypted, imap_host, imap_port, use_tls FROM mail_accounts WHERE id = $1 AND user_id = $2', 
      [req.params.accountId, userId]
    );
    if (accountRows.length === 0) return res.status(404).json({ error: 'Account not found' });

    const account = helpers.normalizeAccount(accountRows[0]);
    const connectionManager = require('../services/mailConnectionManager');
    
    logger.info(`[MailFolders] Requesting IMAP folders for ${account.email}`);
    
    // Пытаемся получить соединение. Если оно занято синхронизацией, connectionManager вернет его,
    // но команды IMAP могут конфликтовать или стоять в очереди.
    imap = await connectionManager.getImapConnection(account);

    const folders = await new Promise((resolve, reject) => {
      // Таймаут на получение списка папок 30 секунд
      const timeout = setTimeout(() => {
        reject(new Error('IMAP getBoxes timeout (30s)'));
      }, 30000);

      imap.getBoxes((err, boxes) => {
        clearTimeout(timeout);
        if (err) {
          logger.error(`[MailFolders] Error in imap.getBoxes for ${account.email}:`, err.message);
          return reject(err);
        }
        
        const folderList = [];
        const processBoxes = (obj, pathPrefix = '') => {
          Object.keys(obj).forEach(name => {
            const box = obj[name];
            const delimiter = box.delimiter || '.';
            const fullPath = pathPrefix ? `${pathPrefix}${delimiter}${name}` : name;
            
            folderList.push({ 
              name: name, 
              path: fullPath,
              delimiter: delimiter
            });
            
            if (box.children) {
              processBoxes(box.children, fullPath);
            }
          });
        };
        
        processBoxes(boxes);
        resolve(folderList);
      });
    });

    logger.info(`[MailFolders] Successfully retrieved ${folders.length} folders from IMAP for ${account.email}`);
    res.json(folders);
  } catch (error) {
    logger.error(`[MailFolders] Failed to get IMAP folders for ${req.params.accountId}:`, error.message);
    
    // Если произошла ошибка (таймаут или занятость сервера), попробуем вернуть папки из локальной БД
    try {
      const { rows: localFolders } = await db.query(
        'SELECT id, folder_name as name, imap_folder_path as path FROM mail_folders WHERE account_id = $1 AND user_id = $2',
        [req.params.accountId, userId]
      );
      
      if (localFolders.length > 0) {
        logger.info(`[MailFolders] Returning ${localFolders.length} local folders as fallback after IMAP error`);
        // Добавляем пометку, что это локальные данные
        return res.json(localFolders.map(f => ({ ...f, isFallback: true })));
      }
    } catch (dbError) {
      logger.error(`[MailFolders] Fallback to local DB failed:`, dbError.message);
    }

    res.status(500).json({ 
      error: 'Failed to fetch IMAP folders', 
      details: error.message,
      isTimeout: (error.message || '').includes('timeout')
    });
  }
}

// ----- SYNC folders with IMAP -----

async function syncFolders(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { imapFolders } = req.body; // Array of {name, path, delimiter}
  const accountId = req.params.accountId;

  try {
    const { rows: accountRows } = await db.query(
      'SELECT id FROM mail_accounts WHERE id = $1 AND user_id = $2', [accountId, userId]
    );
    if (accountRows.length === 0) return res.status(404).json({ error: 'Account not found' });

    // 1. Создаем или обновляем папки
    const pathToIdMap = new Map();

    for (const imapFolder of imapFolders) {
      const folderType = mailSyncService.getFolderTypeStatic(imapFolder.name);

      const { rows: existing } = await db.query(
        'SELECT id FROM mail_folders WHERE account_id = $1 AND imap_folder_path = $2',
        [accountId, imapFolder.path]
      );

      let folderId;
      if (existing.length === 0) {
        folderId = `folder_${uuidv4()}`;
        await db.query(
          `INSERT INTO mail_folders (id, account_id, user_id, folder_name, folder_type, imap_folder_path, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, 999)`,
          [folderId, accountId, userId, imapFolder.name, folderType, imapFolder.path]
        );
      } else {
        folderId = existing[0].id;
        await db.query(
          `UPDATE mail_folders SET folder_name = $1, folder_type = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [imapFolder.name, folderType, folderId]
        );
      }
      pathToIdMap.set(imapFolder.path, folderId);
    }

    // 2. Устанавливаем иерархию (parent_folder_id)
    for (const imapFolder of imapFolders) {
      const path = imapFolder.path;
      const delimiter = imapFolder.delimiter || (path.includes('/') ? '/' : '.');
      
      if (path.includes(delimiter)) {
        const pathParts = path.split(delimiter);
        pathParts.pop(); // удаляем само имя папки
        const parentPath = pathParts.join(delimiter);
        
        const parentId = pathToIdMap.get(parentPath);
        if (parentId) {
          await db.query(
            'UPDATE mail_folders SET parent_folder_id = $1 WHERE imap_folder_path = $2 AND account_id = $3',
            [parentId, path, accountId]
          );
        }
      } else {
        // Коренная папка
        await db.query(
          'UPDATE mail_folders SET parent_folder_id = NULL WHERE imap_folder_path = $1 AND account_id = $2',
          [path, accountId]
        );
      }
    }

    res.json({ success: true, count: imapFolders.length });
  } catch (error) {
    logger.error('Error syncing folders:', error);
    res.status(500).json({ error: 'Failed to sync folders' });
  }
}

// ----- CREATE folder -----

async function createFolder(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId, folderName, parentFolderId, folderType = 'custom', imapFolderPath = null } = req.body;
  try {
    if (!accountId || !folderName) {
      return res.status(400).json({ error: 'Account ID and folder name required' });
    }

    const id = `folder_${uuidv4()}`;
    const { rows } = await db.query(
      `INSERT INTO mail_folders (id, account_id, user_id, folder_name, folder_type, parent_folder_id, imap_folder_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, folder_name, folder_type`,
      [id, accountId, userId, folderName, folderType, parentFolderId || null, imapFolderPath]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

// ----- UPDATE folder -----

async function updateFolder(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { folderId } = req.params;
  const { folderName, folderType, imapFolderPath, displayOrder, isVisible, isSyncEnabled, parentFolderId } = req.body;
  
  try {
    // 1. Получаем текущие данные папки
    const { rows: currentRows } = await db.query(
      'SELECT * FROM mail_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (currentRows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    
    const folder = currentRows[0];
    const oldImapPath = folder.imap_folder_path;
    const accountId = folder.account_id;

    // 2. Если изменился родитель или имя — нужно переместить на IMAP
    if ((parentFolderId !== undefined && parentFolderId !== folder.parent_folder_id) || 
        (folderName !== undefined && folderName !== folder.folder_name)) {
      
      // Запрещаем перемещать системные папки
      if (helpers.toCanonicalFolderType(folder.folder_type, folder.folder_name)) {
        return res.status(400).json({ error: 'System folders cannot be moved or renamed' });
      }

      // Защита от циклической вложенности (нельзя переместить папку в саму себя или своего потомка)
      if (parentFolderId) {
        if (parentFolderId === folderId) {
          return res.status(400).json({ error: 'Cannot move folder into itself' });
        }

        // Проверяем всех родителей целевой папки
        let checkId = parentFolderId;
        const visited = new Set([folderId]);
        while (checkId) {
          if (visited.has(checkId)) {
            return res.status(400).json({ error: 'Circular dependency detected' });
          }
          visited.add(checkId);
          const { rows: pRows } = await db.query('SELECT parent_folder_id FROM mail_folders WHERE id = $1', [checkId]);
          checkId = pRows[0]?.parent_folder_id;
        }
      }

      // Определяем новый путь
      let newImapPath = folderName || folder.folder_name;
      if (parentFolderId) {
        const { rows: parentRows } = await db.query(
          'SELECT imap_folder_path FROM mail_folders WHERE id = $1', [parentFolderId]
        );
        if (parentRows.length > 0 && parentRows[0].imap_folder_path) {
          // Определяем разделитель (обычно . или /)
          const delimiter = oldImapPath && oldImapPath.includes('.') ? '.' : '/';
          newImapPath = `${parentRows[0].imap_folder_path}${delimiter}${newImapPath}`;
        }
      }

      // Физическое перемещение на сервере
      if (oldImapPath && oldImapPath !== newImapPath) {
        try {
          await helpers.renameImapBox(userId, accountId, oldImapPath, newImapPath);
          
          // Рекурсивно обновляем пути для всех подпапок в БД
          // Это важно, так как IMAP пути строятся иерархически
          const oldPathPrefix = oldImapPath + (oldImapPath.includes('.') ? '.' : '/');
          const newPathPrefix = newImapPath + (newImapPath.includes('.') ? '.' : '/');
          
          await db.query(`
            UPDATE mail_folders 
            SET imap_folder_path = REPLACE(imap_folder_path, $1, $2)
            WHERE account_id = $3 AND imap_folder_path LIKE $4
          `, [oldPathPrefix, newPathPrefix, accountId, `${oldImapPath}%`]);
          
          // Обновляем путь самой папки в текущем запросе
          req.body.imapFolderPath = newImapPath;
        } catch (imapError) {
          logger.error(`[MailFolders] IMAP rename failed: ${imapError.message}`);
          return res.status(500).json({ error: 'Failed to move folder on mail server', details: imapError.message });
        }
      }
    }

    // 3. Обновляем запись в БД
    const fields = [];
    const values = [];
    let p = 1;

    const bodyToDb = {
      folder_name: folderName,
      folder_type: folderType,
      imap_folder_path: req.body.imapFolderPath || imapFolderPath,
      display_order: displayOrder,
      is_visible: isVisible,
      is_sync_enabled: isSyncEnabled,
      parent_folder_id: parentFolderId
    };

    Object.entries(bodyToDb).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(`${key} = $${p++}`);
        values.push(val);
      }
    });

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(folderId, userId);

    const query = `UPDATE mail_folders SET ${fields.join(', ')} WHERE id = $${p++} AND user_id = $${p++} RETURNING *`;
    const { rows } = await db.query(query, values);
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error updating folder:', error.message);
    res.status(500).json({ error: 'Failed to update folder' });
  }
}

// ----- DELETE folder -----

async function deleteFolder(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      'DELETE FROM mail_folders WHERE id = $1 AND user_id = $2 AND folder_type = $3 RETURNING id',
      [req.params.folderId, userId, 'custom']
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Folder not found or is a system folder' });

    res.json({ message: 'Folder deleted' });
  } catch (error) {
    logger.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}

// ----- GET folder stats (mail counts per folder) -----

async function getFolderStats(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { accountId } = req.params;

    // Verify account ownership
    const { rows: accountRows } = await db.query(
      'SELECT id FROM mail_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (accountRows.length === 0) return res.status(404).json({ error: 'Account not found' });

    // Get mail counts per folder
    const { rows: mailCounts } = await db.query(`
      SELECT 
        f.folder_name as "folderName",
        f.id as "folderId",
        COUNT(m.id) as "mailCount"
      FROM mail_folders f
      LEFT JOIN mail m ON f.id = m.folder_id
      WHERE f.account_id = $1 AND f.user_id = $2
      GROUP BY f.id, f.folder_name
    `, [accountId, userId]);

    res.json(mailCounts);
  } catch (error) {
    logger.error('[MailFolderStats] Error:', error);
    res.status(500).json({ error: 'Failed to get folder stats' });
  }
}

// ----- CLEAR folder (delete all mails, local + IMAP) -----

async function clearFolder(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { folderId } = req.params;

    const { rows: folderRows } = await db.query(
      'SELECT id, folder_name, folder_type, imap_folder_path, account_id FROM mail_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderRows.length === 0) return res.status(404).json({ error: 'Folder not found' });

    const folderData = folderRows[0];
    const accountId = folderData.accountId || folderData.account_id;
    let imapDeleted = 0;

    // 1. Delete from IMAP — clear entire mailbox on server
    if (accountId) {
      try {
        const account = await helpers.requireAccount(accountId, userId);
        if (account && account.imap_host && account.login && account.password_encrypted) {
          const connectionManager = require('../services/mailConnectionManager');
          const imap = await connectionManager.getImapConnection(account);

          // Resolve correct IMAP mailbox path
          const boxPath = resolveImapBoxPath(folderData);

          logger.info(`[MailClear] Opening IMAP box "${boxPath}" to clear server messages`);

          const deletedCount = await new Promise((resolve, reject) => {
            imap.openBox(boxPath, false, (err) => {
              if (err) {
                 // Если папка не найдена на сервере — это не фатально для очистки
                 if (err.message.includes('not exist')) return resolve(0);
                 return reject(err);
              }

              imap.search(['ALL'], (err, uids) => {
                if (err) return reject(err);
                if (!uids || uids.length === 0) return resolve(0);

                imap.addFlags(uids, '\\Deleted', (err) => {
                  if (err) return reject(err);
                  imap.expunge((err) => {
                    if (err) return reject(err);
                    resolve(uids.length);
                  });
                });
              });
            });
          });

          imapDeleted = deletedCount;
          logger.info(`[MailClear] Deleted ${deletedCount} messages from IMAP box "${boxPath}"`);
        }
      } catch (error) {
        logger.error(`[MailClear] IMAP delete error:`, error.message);
        // Продолжаем локальную очистку даже при ошибке IMAP
      }
    }

    // 2. Физически удаляем все файлы вложений этой папки
    const fs = require('fs');
    const path = require('path');
    const folderUploadDir = path.join(helpers.uploadsDir, folderData.accountId || folderData.account_id, folderId);
    if (fs.existsSync(folderUploadDir)) {
      try {
        fs.rmSync(folderUploadDir, { recursive: true, force: true });
        logger.info(`[MailClear] Deleted physical attachments for folder ${folderId}`);
      } catch (err) {
        logger.error(`[MailClear] Error deleting physical attachments:`, err.message);
      }
    }

    // 3. Delete from local DB
    const { rowCount: deleted } = await db.query(
      'DELETE FROM mail WHERE folder_id = $1 AND user_id = $2', [folderId, userId]
    );

    await db.query(
      'UPDATE mail_folders SET total_count = 0, unseen_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [folderId]
    );

    res.json({
      success: true,
      message: 'Folder cleared',
      deleted: deleted || 0,
      imapDeleted,
      localDeleted: deleted || 0
    });
  } catch (error) {
    logger.error('Error clearing folder:', error);
    res.status(500).json({ error: 'Failed to clear folder' });
  }
}

// ----- CLEAR folder local (delete only from CRM DB) -----

async function clearFolderLocal(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { folderId } = req.params;

    const { rows: folderRows } = await db.query(
      'SELECT id, account_id FROM mail_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderRows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    const folderData = folderRows[0];

    // 1. Физически удаляем все файлы вложений этой папки
    const fs = require('fs');
    const path = require('path');
    const folderUploadDir = path.join(helpers.uploadsDir, folderData.accountId || folderData.account_id, folderId);
    if (fs.existsSync(folderUploadDir)) {
      try {
        fs.rmSync(folderUploadDir, { recursive: true, force: true });
      } catch (err) {
        logger.error(`[MailClearLocal] Error deleting physical attachments:`, err.message);
      }
    }

    // 2. Просто удаляем письма из БД
    const { rowCount: deleted } = await db.query(
      'DELETE FROM mail WHERE folder_id = $1 AND user_id = $2', 
      [folderId, userId]
    );

    // 3. Обнуляем счетчики папки
    await db.query(
      'UPDATE mail_folders SET total_count = 0, unseen_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [folderId]
    );

    logger.info(`[MailClearLocal] Folder ${folderId} cleared locally. Deleted ${deleted} messages.`);

    res.json({
      success: true,
      message: 'Folder cleared locally',
      localDeleted: deleted || 0
    });
  } catch (error) {
    logger.error('Error clearing folder locally:', error);
    res.status(500).json({ error: 'Failed to clear folder locally', details: error.message });
  }
}

// ----- MARK all as read (local + IMAP) -----

async function markFolderAllRead(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { folderId } = req.params;

    const { rows: folderRows } = await db.query(
      'SELECT id, folder_name, imap_folder_path, account_id FROM mail_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderRows.length === 0) return res.status(404).json({ error: 'Folder not found' });

    const folderData = folderRows[0];
    let imapMarked = 0;

    // Get accounts used by mails in this folder
    const { rows: accountRows } = await db.query(
      'SELECT DISTINCT account_id FROM mail WHERE folder_id = $1 AND user_id = $2 AND is_read = false AND account_id IS NOT NULL',
      [folderId, userId]
    );

    // Update IMAP
    for (const acRow of accountRows) {
      try {
        const account = await helpers.requireAccount(acRow.account_id, userId);
        if (!account) continue;

        if (!account.imap_host || !account.login || !account.password_encrypted) continue;

        const connectionManager = require('../services/mailConnectionManager');
        const imap = await connectionManager.getImapConnection(account);
        const boxPath = resolveImapBoxPath(folderData);

        const markedCount = await new Promise((resolve, reject) => {
          imap.openBox(boxPath, false, (err) => {
            if (err) return reject(err);

            // Search only unread messages
            imap.search(['UNSEEN'], (err, uids) => {
              if (err) return reject(err);
              if (!uids || uids.length === 0) return resolve(0);

              const count = uids.length;
              // Add \Seen flag
              imap.addFlags(uids, '\\Seen', (err) => {
                if (err) return reject(err);
                resolve(count);
              });
            });
          });
        });

        imapMarked += markedCount;
      } catch (error) {
        logger.error(`[MailMarkAllRead] IMAP error for account ${acRow.account_id}:`, error.message);
      }
    }

    // Update local DB
    const { rowCount: updated } = await db.query(
      'UPDATE mail SET is_read = true, updated_at = CURRENT_TIMESTAMP WHERE folder_id = $1 AND user_id = $2 AND is_read = false',
      [folderId, userId]
    );

    // Update folder unseen count
    await db.query(
      'UPDATE mail_folders SET unseen_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [folderId]
    );

    res.json({
      success: true,
      updated: updated || 0,
      imapMarked
    });
  } catch (error) {
    logger.error('Error marking folder as read:', error);
    res.status(500).json({ error: 'Failed to mark folder as read' });
  }
}

module.exports = {
  getFolders,
  getFolderStats,
  cleanupDuplicateFolders,
  getImapFolders,
  syncFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  clearFolder,
  clearFolderLocal,
  markFolderAllRead,
};
