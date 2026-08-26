/**
 * Mail Connection Manager
 * Управляет подключениями к IMAP/SMTP серверам
 * - Пул подключений
 * - Автоматический реконнект
 * - Таймауты и лимиты
 */

const Imap = require('imap');
const nodemailer = require('nodemailer');
const { decryptPassword } = require('../../../utils/mailCrypto');
const logger = require('../../../utils/logger');

class MailConnectionManager {
  constructor() {
    // Пул активных подключений: { accountId: { imap, smtp, lastUsed, status } }
    this.connections = new Map();
    // Лимит подключений на аккаунт
    this.maxConnectionsPerAccount = 3;
    // Таймаут бездействия (мс) перед закрытием подключения
    this.idleTimeout = 5 * 60 * 1000; // 5 минут
    // Максимальное количество повторных попыток
    this.maxRetries = 3;
    // Задержка между попытками (мс)
    this.retryDelay = 2000;
  }

  /**
   * Получить IMAP подключение для аккаунта
   */
  async getImapConnection(account) {
    const accountId = account.id;

    // Проверяем существующее подключение
    if (this.connections.has(accountId)) {
      const conn = this.connections.get(accountId);
      if (conn.imap && conn.status === 'ready') {
        conn.lastUsed = Date.now();
        return conn.imap;
      }
    }

    // Создаём новое подключение
    return this.createImapConnection(account);
  }

  /**
   * Создать новое IMAP подключение
   */
  async createImapConnection(account, retryCount = 0) {
    const accountId = account.id;

    try {
      const encryptedPassword = account.password_encrypted || account.passwordEncrypted;
      const imapHost = account.imap_host || account.imapHost;
      const imapPort = account.imap_port || account.imapPort || 993;
      const useTls = account.use_tls ?? account.useTls;
      const password = decryptPassword(encryptedPassword);

      const imapConfig = {
        user: account.login || account.email,
        password: password,
        host: imapHost,
        port: imapPort,
        tls: useTls !== false,
        tlsOptions: {
          rejectUnauthorized: false // Для самоподписанных сертификатов
        },
        authTimeout: 10000,
        connTimeout: 15000,
        debug: process.env.MAIL_DEBUG === 'true' ? console.log : null
      };

      logger.debug(`[MailConnection] Creating IMAP connection for ${account.email}`, {
        host: imapHost,
        port: imapPort,
        tls: useTls
      });

      const imap = new Imap(imapConfig);

      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          imap.end();
          reject(new Error('Connection timeout'));
        }, 20000);

        imap.once('ready', () => {
          clearTimeout(connectionTimeout);
          logger.debug(`[MailConnection] IMAP ready for ${account.email}`);

          // Сохраняем подключение в пул
          this.connections.set(accountId, {
            imap,
            status: 'ready',
            lastUsed: Date.now(),
            account
          });

          // Обработка ошибок подключения
          imap.once('error', (err) => {
            logger.error(`[MailConnection] IMAP error for ${account.email}:`, err.message);
            this.connections.delete(accountId);
          });

          imap.once('end', () => {
            logger.debug(`[MailConnection] IMAP ended for ${account.email}`);
            this.connections.delete(accountId);
          });

          resolve(imap);
        });

        imap.once('error', (err) => {
          clearTimeout(connectionTimeout);
          logger.error(`[MailConnection] IMAP connection error for ${account.email}:`, err.message);

          if (retryCount < this.maxRetries) {
            logger.info(`[MailConnection] Retrying IMAP connection (${retryCount + 1}/${this.maxRetries})`);
            setTimeout(() => {
              this.createImapConnection(account, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, this.retryDelay);
          } else {
            reject(err);
          }
        });

        imap.once('end', () => {
          clearTimeout(connectionTimeout);
          logger.debug(`[MailConnection] IMAP connection ended for ${account.email}`);
          this.connections.delete(accountId);
        });

        imap.connect();
      });
    } catch (error) {
      logger.error(`[MailConnection] Failed to create IMAP connection:`, error.message);
      throw error;
    }
  }

  /**
   * Получить SMTP транспортер для аккаунта
   */
  async getSmtpTransporter(account) {
    const accountId = account.id;

    // Проверяем существующий транспортер
    if (this.connections.has(accountId)) {
      const conn = this.connections.get(accountId);
      if (conn.smtp && conn.status === 'ready') {
        conn.lastUsed = Date.now();
        return conn.smtp;
      }
    }

    // Создаём новый транспортер
    return this.createSmtpTransporter(account);
  }

  /**
   * Создать новый SMTP транспортер
   */
  async createSmtpTransporter(account, retryCount = 0) {
    const accountId = account.id;

    try {
      const encryptedPassword = account.password_encrypted || account.passwordEncrypted;
      const smtpHost = account.smtp_host || account.smtpHost;
      const smtpPort = account.smtp_port || account.smtpPort || 587;
      const useTls = account.use_tls ?? account.useTls;
      const password = decryptPassword(encryptedPassword);

      const smtpConfig = {
        host: smtpHost,
        port: smtpPort,
        secure: useTls !== false && smtpPort === 465,
        auth: {
          user: account.login || account.email,
          pass: password
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000
      };

      logger.debug(`[MailConnection] Creating SMTP transporter for ${account.email}`, {
        host: smtpHost,
        port: smtpPort,
        secure: smtpConfig.secure
      });

      const transporter = nodemailer.createTransport(smtpConfig);

      // Проверяем подключение
      await transporter.verify();

      // Сохраняем в пул
      this.connections.set(accountId, {
        smtp: transporter,
        status: 'ready',
        lastUsed: Date.now(),
        account
      });

      logger.debug(`[MailConnection] SMTP transporter ready for ${account.email}`);

      return transporter;
    } catch (error) {
      logger.error(`[MailConnection] Failed to create SMTP transporter:`, error.message);

      if (retryCount < this.maxRetries) {
        logger.info(`[MailConnection] Retrying SMTP connection (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.createSmtpTransporter(account, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Закрыть подключение для аккаунта
   */
  async closeConnection(accountId) {
    const conn = this.connections.get(accountId);
    if (!conn) return;

    logger.debug(`[MailConnection] Closing connections for account ${accountId}`);

    if (conn.imap) {
      try {
        conn.imap.end();
      } catch (error) {
        logger.error(`[MailConnection] Error closing IMAP:`, error.message);
      }
    }

    if (conn.smtp) {
      try {
        conn.smtp.close();
      } catch (error) {
        logger.error(`[MailConnection] Error closing SMTP:`, error.message);
      }
    }

    this.connections.delete(accountId);
  }

  /**
   * Закрыть все подключения
   */
  async closeAll() {
    logger.info('[MailConnection] Closing all connections');

    const closePromises = Array.from(this.connections.keys()).map(accountId =>
      this.closeConnection(accountId)
    );

    await Promise.all(closePromises);
    logger.info('[MailConnection] All connections closed');
  }

  /**
   * Очистить старые подключения (таймаут бездействия)
   */
  cleanupIdleConnections() {
    const now = Date.now();
    const idleConnections = [];

    for (const [accountId, conn] of this.connections.entries()) {
      if (now - conn.lastUsed > this.idleTimeout) {
        idleConnections.push(accountId);
      }
    }

    if (idleConnections.length > 0) {
      logger.debug(`[MailConnection] Cleaning up ${idleConnections.length} idle connections`);
      idleConnections.forEach(accountId => this.closeConnection(accountId));
    }
  }

  /**
   * Получить статистику подключений
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      connections: []
    };

    for (const [accountId, conn] of this.connections.entries()) {
      stats.connections.push({
        accountId,
        email: conn.account?.email,
        status: conn.status,
        lastUsed: new Date(conn.lastUsed).toISOString(),
        hasImap: !!conn.imap,
        hasSmtp: !!conn.smtp
      });
    }

    return stats;
  }
}

// Singleton instance
const instance = new MailConnectionManager();

// Периодическая очистка старых подключений
setInterval(() => {
  instance.cleanupIdleConnections();
}, 60000); // Каждую минуту

module.exports = instance;
