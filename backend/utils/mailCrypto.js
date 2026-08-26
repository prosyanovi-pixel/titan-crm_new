/**
 * Утилиты для шифрования/дешифрования паролей
 * AES-256-CBC encryption
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SALT = 'mail-module-salt-v1'; // Соль для scrypt
const LEGACY_DEFAULT_KEY = 'default-secret-key-for-mail-module';

/**
 * Получить ключ шифрования из переменных окружения
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || LEGACY_DEFAULT_KEY;
  return crypto.scryptSync(key, SALT, 32);
}

/**
 * Получить набор возможных ключей для обратной совместимости
 */
function getCandidateEncryptionKeys() {
  const keys = [];
  const primary = process.env.ENCRYPTION_KEY || LEGACY_DEFAULT_KEY;
  keys.push(primary);

  // Если используется кастомный ключ, пробуем legacy ключ как fallback
  if (primary !== LEGACY_DEFAULT_KEY) {
    keys.push(LEGACY_DEFAULT_KEY);
  }

  return keys;
}

/**
 * Зашифровать пароль
 * @param {string} password - Исходный пароль
 * @returns {{encrypted: string, iv: string}} - Зашифрованный пароль и IV
 */
function encryptPassword(password) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted: `${iv.toString('hex')}:${encrypted}`,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('[MailCrypto] Encryption error:', error.message);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Расшифровать пароль
 * @param {string} encryptedData - Зашифрованные данные в формате iv:encrypted
 * @returns {string} - Исходный пароль
 */
function decryptPassword(encryptedData) {
  try {
    if (!encryptedData) {
      throw new Error('No encrypted data provided');
    }

    // Поддержка legacy форматов: объект или JSON-строка с полем encrypted
    if (typeof encryptedData === 'object' && encryptedData.encrypted) {
      encryptedData = encryptedData.encrypted;
    }

    if (typeof encryptedData === 'string' && encryptedData.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(encryptedData);
        if (parsed && parsed.encrypted) {
          encryptedData = parsed.encrypted;
        }
      } catch (_) {
        // Не JSON — продолжаем обычную обработку
      }
    }

    const [iv, encrypted] = String(encryptedData).split(':');

    // Legacy fallback: если формат не iv:cipher, считаем что это старый plaintext
    if (!iv || !encrypted) {
      return encryptedData;
    }

    const candidateKeys = getCandidateEncryptionKeys();
    for (const keyValue of candidateKeys) {
      try {
        const key = crypto.scryptSync(keyValue, SALT, 32);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (_) {
        // Пробуем следующий ключ
      }
    }

    throw new Error('Invalid encryption key or payload');
  } catch (error) {
    console.error('[MailCrypto] Decryption error:', error.message);
    throw new Error('Failed to decrypt password');
  }
}

/**
 * Проверить наличие ключа шифрования
 */
function hasEncryptionKey() {
  return !!process.env.ENCRYPTION_KEY;
}

module.exports = {
  encryptPassword,
  decryptPassword,
  hasEncryptionKey
};
