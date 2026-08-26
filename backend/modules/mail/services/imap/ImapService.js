/**
 * IMAP Connection Service
 * Управление IMAP подключением и операциями на уровне папок/писем
 */

const logger = require('../../../../utils/logger');
const { validateImapPath, validateFolderName } = require('../../utils/fieldNormalizer');
const mailConfig = require('../../config');

class ImapService {
  constructor() {
    this.connectTimeout = mailConfig.imap.connectTimeout;
    this.foldersTimeout = mailConfig.imap.foldersTimeout;
  }

  /**
   * Получить список папок из IMAP сервера
   */
  async getFolders(imap) {
    return new Promise((resolve, reject) => {
      logger.debug('[ImapService] getFolders() called, requesting boxes from IMAP server');
      
      imap.getBoxes((err, boxes) => {
        if (err) {
          logger.error(`[ImapService] Error getting boxes: ${err.message}`);
          return reject(err);
        }

        logger.debug(`[ImapService] Received ${Object.keys(boxes).length} root folders, processing...`);
        
        const folders = [];
        let processedCount = 0;
        
        const processBox = (name, boxData, path = '') => {
          processedCount++;
          try {
            // Строгая типизация всех параметров
            const folderName = String(name || '').trim();
            if (!folderName) {
              logger.warn('[ImapService] Skipping folder with empty name');
              return;
            }
            
            // Разделитель всегда должен быть строкой
            let delimiter = '/';
            if (boxData && boxData.delimiter) {
              delimiter = String(boxData.delimiter).trim();
              if (!delimiter) delimiter = '/';
            }
            
            // Конструируем путь с гарантией строк
            let folderPath = folderName;
            if (path && String(path).trim()) {
              const safePath = String(path).trim();
              folderPath = `${safePath}${delimiter}${folderName}`;
            }
            
            logger.debug(`[ImapService] Processed folder: name="${folderName}", path="${folderPath}"`);
            
            folders.push({
              name: folderName,
              path: folderPath,
              attribs: boxData && boxData.attribs ? boxData.attribs : []
            });

            // Рекурсивно обрабатываем подпапки
            if (boxData && boxData.children && typeof boxData.children === 'object') {
              Object.entries(boxData.children).forEach(([childName, childBox]) => {
                processBox(childName, childBox, folderPath);
              });
            }
          } catch (error) {
            logger.warn(`[ImapService] Error processing folder: ${error.message}`);
          }
        };

        Object.entries(boxes).forEach(([name, boxData]) => processBox(name, boxData));
        
        logger.debug(`[ImapService] Processed ${processedCount} folders total, resolving with ${folders.length} entries`);
        resolve(folders);
      });
    });
  }

  /**
   * Подсчитать письма во всех папках
   */
  async countFolderEmails(imap, folders, syncStateGetter) {
    const folderCounts = [];
    let totalEmails = 0;
    let newEmails = 0;

    for (const folder of folders) {
      try {
        // МАКСИМАЛЬНО ранняя валидация и логирование
        if (!folder || typeof folder !== 'object') {
          logger.warn(`[ImapService] Skipping invalid folder: ${JSON.stringify(folder)}`);
          folderCounts.push({ name: 'unknown', path: '', total: 0, newEmails: 0 });
          continue;
        }

        // АБСОЛЮТНО строгая конвертация - гарантируем строку
        let folderPath = '';
        let folderName = '';
        
        try {
          // КРИТИЧЕСКИЙ FIX: если folder.path - число (баг БД), используем folder.name
          if (typeof folder.path === 'number') {
            logger.warn(`[ImapService] folder.path is NUMBER (${folder.path}) for folder "${folder.name}". Using folder.name as path.`);
            folderPath = String(folder.name || '').trim();
          } else if (folder.path !== null && folder.path !== undefined) {
            folderPath = String(folder.path).trim();
          }
          
          if (folder.name !== null && folder.name !== undefined) {
            folderName = String(folder.name).trim();
          }
        } catch (convertError) {
          logger.error(`[ImapService] Conversion error: ${convertError.message}`);
          folderCounts.push({ name: 'conversion_error', path: '', total: 0, newEmails: 0 });
          continue;
        }

        // Логируем тип ДО вызова IMAP
        if (typeof folderPath !== 'string' || typeof folderName !== 'string') {
          logger.error(`[ImapService] After conversion - path type: ${typeof folderPath}, name type: ${typeof folderName}`);
          folderCounts.push({ name: folderName || 'unknown', path: '', total: 0, newEmails: 0 });
          continue;
        }

        if (!folderPath || !folderName) {
          logger.warn(`[ImapService] Skipping empty folder: path="${folderPath}", name="${folderName}"`);
          folderCounts.push({ name: folderName || 'empty', path: folderPath, total: 0, newEmails: 0 });
          continue;
        }

        logger.info(`[ImapService] Counting emails in folder: "${folderName}" (path="${folderPath}")`);

        const count = await new Promise((resolve, reject) => {
          // Финальная проверка перед вызовом
          const safePath = String(folderPath); // Ещё раз гарантируем
          
          imap.openBox(safePath, true, (err, box) => {
            if (err) {
              logger.warn(`[ImapService] Error opening "${folderName}": ${err.message}`);
              return reject(err);
            }
            const total = box?.messages?.total || 0;
            logger.info(`[ImapService] Folder "${folderName}": ${total} emails`);
            resolve(total);
          });
        });

        // Получаем состояние синхронизации через callback
        const syncState = await syncStateGetter(folderName);
        let newCount = count;
        if (syncState && syncState.last_uid) {
          const lastUidNum = parseInt(syncState.last_uid, 10);
          if (!isNaN(lastUidNum) && lastUidNum > 0) {
            newCount = Math.max(0, count - lastUidNum);
          }
        }

        folderCounts.push({ name: folderName, path: folderPath, total: count, newEmails: newCount });
        totalEmails += count;
        newEmails += newCount;
      } catch (error) {
        const safeName = (folder && typeof folder === 'object' && folder.name)
          ? String(folder.name).trim()
          : 'unknown';
        logger.error(`[ImapService] Could not count emails in "${safeName}": ${error.message}`);
        logger.error(`[ImapService] Stack trace:`, error.stack);
        // Continue with next folder instead of adding to counts
        folderCounts.push({ name: safeName, path: '', total: 0, newEmails: 0 });
      }
    }

    return { folderCounts, totalEmails, newEmails };
  }

  /**
   * Получить письма из папки по UID диапазону
   */
  async fetchMessagesByUid(imap, boxPath, uidRange, options = {}) {
    return new Promise((resolve, reject) => {
      imap.search([['UID', uidRange]], (err, uids) => {
        if (err) return reject(err);

        if (!uids || uids.length === 0) {
          logger.debug(`[ImapService] No messages found with UID range: ${uidRange}`);
          return resolve([]);
        }

        logger.debug(`[ImapService] Found ${uids.length} messages`);
        resolve(uids);
      });
    });
  }

  /**
   * Открыть папку и получить информацию
   */
  async openBox(imap, boxPath, readOnly = false) {
    return new Promise((resolve, reject) => {
      const path = String(boxPath || '').trim();
      if (!path || typeof path !== 'string') {
        return reject(new Error(`Invalid boxPath: must be non-empty string, got ${typeof boxPath}: ${boxPath}`));
      }
      imap.openBox(path, readOnly, (err, box) => {
        if (err) return reject(err);
        resolve(box);
      });
    });
  }

  /**
   * Выполнить операцию с таймаутом
   */
  async withTimeout(promise, timeoutMs, timeoutMessage) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Получить raw fetch stream для писем
   */
  getFetchStream(imap, uids, options = {}) {
    const defaultOptions = {
      bodies: [''],
      struct: true,
      markSeen: false,
    };

    const fetchOptions = { ...defaultOptions, ...options };
    return imap.fetch(uids, fetchOptions);
  }
}

module.exports = ImapService;
