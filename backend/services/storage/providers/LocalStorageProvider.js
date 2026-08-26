const fs = require('fs');
const path = require('path');
const StorageProvider = require('./StorageProvider');

/**
 * Провайдер для локальной файловой системы
 */
class LocalStorageProvider extends StorageProvider {
  constructor(config) {
    super();
    this.baseDir = config.baseDir || path.join(__dirname, '../../../uploads');
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(filename, data) {
    const fullPath = path.join(this.baseDir, filename);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(fullPath, data);
    } else if (typeof data === 'string' && fs.existsSync(data)) {
      // Если это путь к временному файлу
      fs.copyFileSync(data, fullPath);
    } else {
      // Поток (stream)
      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(fullPath);
        data.pipe(writeStream);
        data.on('error', reject);
        writeStream.on('finish', () => resolve({ path: fullPath, filename }));
        writeStream.on('error', reject);
      });
    }

    return { path: fullPath, filename };
  }

  async get(filename) {
    const fullPath = path.join(this.baseDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }
    return fs.createReadStream(fullPath);
  }

  getLocalPath(filename) {
    return path.join(this.baseDir, filename);
  }

  async delete(filename) {
    const fullPath = path.join(this.baseDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async exists(filename) {
    return fs.existsSync(path.join(this.baseDir, filename));
  }
}

module.exports = LocalStorageProvider;
