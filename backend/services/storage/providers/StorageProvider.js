/**
 * Базовый интерфейс для провайдеров хранилища
 */
class StorageProvider {
  /**
   * Сохранить файл
   * @param {string} filename - Имя файла в хранилище
   * @param {Buffer|Stream|string} data - Содержимое файла или путь к временному файлу
   * @returns {Promise<Object>} Информация о сохраненном файле
   */
  async save(filename, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Получить файл (скачать)
   * @param {string} filename - Имя файла
   * @returns {Promise<Stream>} Поток данных файла
   */
  async get(filename) {
    throw new Error('Method not implemented');
  }

  /**
   * Получить локальный путь к файлу (если возможно)
   * @param {string} filename 
   * @returns {string|null}
   */
  getLocalPath(filename) {
    return null;
  }

  /**
   * Удалить файл
   * @param {string} filename 
   */
  async delete(filename) {
    throw new Error('Method not implemented');
  }

  /**
   * Проверить существование
   * @param {string} filename 
   * @returns {Promise<boolean>}
   */
  async exists(filename) {
    throw new Error('Method not implemented');
  }

  /**
   * Получить публичную ссылку (если поддерживается)
   * @param {string} filename 
   * @returns {Promise<string|null>}
   */
  async getPublicUrl(filename) {
    return null;
  }
}

module.exports = StorageProvider;
