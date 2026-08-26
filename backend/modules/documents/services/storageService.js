/**
 * Сервис для работы с физическим хранилищем файлов
 * Рефакторинг: использует централизованный StorageService
 */
const path = require('path');
const logger = require('../../../utils/logger');
const storage = require('../../../services/storage');

const uploadsDir = path.join(__dirname, '../../../uploads/documents');

/**
 * Удалить файл
 * @param {string} storedFilename 
 * @returns {Promise<boolean>}
 */
async function deleteFile(storedFilename) {
  if (!storedFilename) return false;
  try {
    await storage.delete(`documents/${storedFilename}`);
    return true;
  } catch (error) {
    logger.error(`[storageService.deleteFile] Error: ${error.message}`);
    return false;
  }
}

/**
 * Сохранить файл в хранилище
 */
async function saveFile(storedFilename, data) {
  return await storage.save(`documents/${storedFilename}`, data);
}

/**
 * Проверить существование файла
 * @param {string} storedFilename 
 * @returns {Promise<boolean>}
 */
async function fileExists(storedFilename) {
  if (!storedFilename) return false;
  return await storage.exists(`documents/${storedFilename}`);
}

/**
 * Получить полный путь к файлу (только для локального хранилища)
 * @param {string} storedFilename 
 * @returns {Promise<string>}
 */
async function getFilePath(storedFilename) {
  return await storage.getLocalPath(`documents/${storedFilename}`);
}

/**
 * Получить поток данных файла
 * @param {string} storedFilename 
 */
async function getFileStream(storedFilename) {
  return await storage.get(`documents/${storedFilename}`);
}

module.exports = {
  deleteFile,
  saveFile,
  fileExists,
  getFilePath,
  getFileStream,
  uploadsDir
};
