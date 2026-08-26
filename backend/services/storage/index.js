const db = require('../../db');
const logger = require('../../utils/logger');
const LocalStorageProvider = require('./providers/LocalStorageProvider');
const S3StorageProvider = require('./providers/S3StorageProvider');

/**
 * Централизованный сервис хранилища
 */
class StorageService {
  constructor() {
    this.provider = null;
    this.config = null;
    this.initialized = false;
  }

  /**
   * Инициализация на основе настроек из БД
   */
  async init() {
    try {
      const { rows } = await db.query(
        "SELECT value FROM module_settings WHERE module_id = 'documents' AND setting_key = 'storage_config' LIMIT 1"
      );

      let config = { provider: 'local' };
      if (rows.length > 0) {
        config = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
      }

      this.config = config;
      
      switch (config.provider) {
        case 's3':
          this.provider = new S3StorageProvider(config.s3);
          break;
        case 'local':
        default:
          this.provider = new LocalStorageProvider(config.local || {});
          break;
      }

      this.initialized = true;
      logger.info(`[StorageService] Initialized with ${config.provider} provider`);
    } catch (err) {
      logger.error('[StorageService] Initialization error:', err);
      // Fallback to local
      this.provider = new LocalStorageProvider({});
      this.initialized = true;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  async save(filename, data) {
    await this.ensureInitialized();
    return this.provider.save(filename, data);
  }

  async get(filename) {
    await this.ensureInitialized();
    return this.provider.get(filename);
  }

  async getLocalPath(filename) {
    await this.ensureInitialized();
    return this.provider.getLocalPath(filename);
  }

  async delete(filename) {
    await this.ensureInitialized();
    return this.provider.delete(filename);
  }

  async exists(filename) {
    await this.ensureInitialized();
    return this.provider.exists(filename);
  }
}

// Экспортируем синглтон
module.exports = new StorageService();
