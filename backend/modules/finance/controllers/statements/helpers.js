/**
 * Вспомогательные функции для контроллера выписок
 */

const fs = require('fs');
const path = require('path');
const { getModuleSettings } = require('../../../../utils/moduleSettingsLoader');

/**
 * Получить путь к папке для сохранения файлов выписок (используем настройки воркфлоу или дефолт)
 */
async function getStatementStorageInfo() {
  const settings = await getModuleSettings('workflows');
  const relPathFromBackend = settings.defaults?.attachmentsDir || 'uploads/documents/workflow';
  
  const baseDocsDir = 'uploads/documents';
  let relPathForDB = '';
  if (relPathFromBackend.startsWith(baseDocsDir)) {
    relPathForDB = relPathFromBackend.substring(baseDocsDir.length);
    while (relPathForDB.startsWith('/') || relPathForDB.startsWith('\\')) {
      relPathForDB = relPathForDB.substring(1);
    }
    if (relPathForDB && !relPathForDB.endsWith('/')) relPathForDB += '/';
  }

  const absPath = path.join(__dirname, '../../../../', relPathFromBackend);
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true });
  }
  return { absPath, relPathForDB };
}

module.exports = {
  getStatementStorageInfo,
};