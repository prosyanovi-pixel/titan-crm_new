/**
 * MailFolderFilterService
 * Логика фильтрации папок по видимости и другим критериям
 */

const logger = require('../../../utils/logger');
const db = require('../../../db');

class MailFolderFilterService {
  /**
   * Получить карту настроек папок из БД
   */
  async getFolderSettingsMap(accountId, userId) {
    try {
      const { rows: dbFolders } = await db.query(
        `SELECT imap_folder_path, is_visible, is_sync_enabled FROM mail_folders 
         WHERE account_id = $1 AND user_id = $2`,
        [accountId, userId]
      );

      const folderSettingsMap = new Map();
      for (const dbFolder of dbFolders) {
        if (dbFolder.imap_folder_path) {
          folderSettingsMap.set(dbFolder.imap_folder_path, {
            isVisible: dbFolder.is_visible !== false,
            isSyncEnabled: dbFolder.is_sync_enabled !== false
          });
        }
      }
      return folderSettingsMap;
    } catch (error) {
      logger.error('[MailFolderFilter] Error getting folder settings map:', error.message);
      return new Map();
    }
  }

  /**
   * Фильтровать папки по имени
   */
  filterByName(folders, folderName) {
    if (!folderName) return folders;
    return folders.filter(f => f.name === folderName);
  }

  /**
   * Фильтровать папки по списку имён
   */
  filterByNames(folders, folderNames, accountId) {
    if (!folderNames || !Array.isArray(folderNames) || folderNames.length === 0) {
      return folders;
    }

    const folderNamesLower = folderNames.map(f => f.toLowerCase());
    const filtered = folders.filter(f => folderNamesLower.includes(f.name.toLowerCase()));

    logger.info(`[MailFolderFilter] Folder filtering:`);
    logger.info(`  - Requested folders: ${JSON.stringify(folderNames)}`);
    logger.info(`  - Available IMAP folders: ${folders.map(f => f.name).join(', ')}`);
    logger.info(`  - Will sync: ${filtered.map(f => f.name).join(', ')}`);

    if (filtered.length === 0) {
      logger.warn(`[MailFolderFilter] No matching folders found, falling back to all folders`);
      return folders;
    }
    return filtered;
  }

  /**
   * Фильтровать папки по активности синхронизации (is_sync_enabled)
   */
  filterBySyncEnabled(folders, folderSettingsMap) {
    const disabledFolders = [];
    const filtered = folders.filter(folder => {
      const settings = folderSettingsMap.get(folder.path);
      // Если папки нет в БД, считаем синхронизацию включенной по умолчанию
      if (!settings) return true;
      
      const isSyncEnabled = settings.isSyncEnabled;
      
      if (isSyncEnabled === false) {
        disabledFolders.push(folder.name);
        logger.info(`[MailFolderFilter] Skipping sync-disabled folder: "${folder.name}" (path: ${folder.path})`);
        return false;
      }
      return true;
    });

    if (disabledFolders.length > 0) {
      logger.info(`[MailFolderFilter] Skipped ${disabledFolders.length} sync-disabled folders: ${disabledFolders.join(', ')}`);
    }

    return { filtered, disabledFolders };
  }

  /**
   * Скомбинировать все фильтры
   */
  async applyAllFilters(folders, accountId, userId, options = {}) {
    const { folderName = null, syncFolders = null } = options;

    // 1. Получить карту настроек
    const folderSettingsMap = await this.getFolderSettingsMap(accountId, userId);

    // 2. Фильтровать по имени(ам)
    let foldersToSync = folders;
    if (folderName) {
      foldersToSync = this.filterByName(foldersToSync, folderName);
    } else if (syncFolders) {
      foldersToSync = this.filterByNames(foldersToSync, syncFolders, accountId);
    }

    // 3. Фильтровать по активности синхронизации (теперь используем is_sync_enabled)
    const { filtered, disabledFolders } = this.filterBySyncEnabled(foldersToSync, folderSettingsMap);

    return { foldersToSync: filtered, disabledFolders };
  }
}

module.exports = MailFolderFilterService;
