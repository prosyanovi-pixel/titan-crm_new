/**
 * Mail controller helpers for document export and account cleanup
 */

const fs = require('fs');
const path = require('path');
const storageService = require('../../documents/services/storageService');
const { getOrCreateFolder } = require('../../documents/utils/helpers');
const logger = require('../../../utils/logger');

async function saveToDocuments({ req, res, db, helpers, logger, uuidv4 }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { attachmentId } = req.params;

    const { rows: attRows } = await db.query(
      `SELECT ma.*, m.subject FROM mail_attachments ma
       JOIN mail m ON m.id = ma.mail_id
       WHERE ma.id = $1 AND m.user_id = $2`,
      [attachmentId, userId]
    );
    if (attRows.length === 0) return res.status(404).json({ error: 'Attachment not found' });

    const att = attRows[0];
    const emailSubject = att.subject || 'Без темы';
    const docId = `doc_${uuidv4()}`;

    let parentId = null;
    try {
      const rootFolderId = await getOrCreateFolder('Модуль Почта');
      parentId = await getOrCreateFolder(emailSubject, rootFolderId);
    } catch (error) {
      logger.error('[saveToDocuments] Folder creation error:', error.message);
    }

    const sourcePath = path.join(helpers.uploadsDir, att.stored_path || att.storedPath);
    const uniqueSuffix = uuidv4();
    const ext = path.extname(att.filename);
    const newStoredFilename = `${uniqueSuffix}${ext}`;
    const targetPath = path.join(storageService.uploadsDir, newStoredFilename);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
    } else {
      logger.error(`[saveToDocuments] Source file not found: ${sourcePath}`);
      return res.status(404).json({ error: 'Source file not found' });
    }

    await db.query(
      `INSERT INTO documents (id, name, type, size, date, stored_filename, parent_id, uploaded_by)
       VALUES ($1, $2, 'file', $3, CURRENT_DATE, $4, $5, $6) RETURNING *`,
      [docId, att.filename, att.file_size, newStoredFilename, parentId, userId]
    );

    res.json({ success: true, documentId: docId });
  } catch (error) {
    logger.error('Error saving to documents:', error);
    res.status(500).json({ error: 'Failed to save to documents' });
  }
}

async function clearAccountMails({ req, res, db, helpers }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId } = req.params;
  if (!accountId) return res.status(400).json({ error: 'Account ID required' });

  try {
    const { rows: accountRows } = await db.query(
      'SELECT id FROM mail_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (accountRows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // 1. Получаем пути всех вложений перед удалением из БД
    const { rows: attachmentRows } = await db.query(
      `SELECT stored_path FROM mail_attachments 
       WHERE mail_id IN (SELECT id FROM mail WHERE account_id = $1 AND user_id = $2)`,
      [accountId, userId]
    );

    // 2. Физически удаляем вложения с диска
    let filesDeleted = 0;
    if (attachmentRows.length > 0 && helpers && helpers.resolveAttachmentPath) {
      const uniqueDirs = new Set();
      for (const att of attachmentRows) {
        const storedPath = att.stored_path || att.storedPath;
        if (!storedPath) continue;

        const fullPath = helpers.resolveAttachmentPath(storedPath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            filesDeleted++;
            uniqueDirs.add(path.dirname(fullPath));
          } catch (err) {
            logger.error(`[clearAccountMails] Error deleting file ${fullPath}:`, err.message);
          }
        }
      }

      // Пробуем удалить пустые директории (рекурсивно вверх до uploadsDir)
      for (const dir of uniqueDirs) {
        try {
          let currentDir = dir;
          const baseUploadsDir = helpers.uploadsDir;
          // Удаляем пока директория пустая и мы не вышли выше базовой папки вложений
          while (currentDir && currentDir.startsWith(baseUploadsDir) && currentDir !== baseUploadsDir) {
            if (fs.existsSync(currentDir) && fs.readdirSync(currentDir).length === 0) {
              fs.rmdirSync(currentDir);
              currentDir = path.dirname(currentDir);
            } else {
              break;
            }
          }
        } catch (err) {
          // Игнорируем ошибки удаления директорий (могут быть не пустыми)
        }
      }
    }

    // Также пробуем старый метод на случай если структура всё же содержит accountId в корне
    if (helpers && typeof helpers.deleteAccountAttachments === 'function') {
      helpers.deleteAccountAttachments(accountId);
    }

    // 3. Удаляем письма из БД (вложения удалятся каскадом или отдельным запросом в БД)
    const { rowCount } = await db.query(
      'DELETE FROM mail WHERE account_id = $1 AND user_id = $2',
      [accountId, userId]
    );

    logger.info(`[clearAccountMails] Deleted ${rowCount} mails and ${filesDeleted} attachment files for account ${accountId} (user: ${userId})`);

    res.json({
      success: true,
      message: `База данных очищена и вложения удалены (${rowCount} писем, ${filesDeleted} файлов). Они будут перезагружены при следующей синхронизации.`,
      deletedCount: rowCount,
      filesDeleted
    });
  } catch (error) {
    logger.error('Error clearing account mails:', error);
    res.status(500).json({ error: 'Failed to clear account mails' });
  }
}

module.exports = {
  saveToDocuments,
  clearAccountMails,
};
