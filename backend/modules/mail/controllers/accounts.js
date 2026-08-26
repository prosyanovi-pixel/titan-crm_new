/**
 * Mail Module - Accounts Controller
 * CRUD для почтовых аккаунтов, тест подключения, синхронизация
 */

const db = require('../../../db');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { encryptPassword, decryptPassword } = require('../../../utils/mailCrypto');
const mailSyncService = require('../services/mailSyncService');
const helpers = require('../utils/helpers');
const logger = require('../../../utils/logger');

// ----- GET accounts -----

async function getAccounts(req, res) {
  const userId = (req.get && req.get('x-user-id')) || (req.user && req.user.id) || (req.headers && req.headers['x-user-id']);
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      'SELECT id, email, display_name, account_type, is_default, is_active, last_sync, sync_enabled, sync_interval_minutes, include_subfolders, sync_folders, sync_mode FROM mail_accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    logger.info('📋 Loaded accounts', { accounts: rows.map(r => ({ email: r.email, isActive: r.isActive })) });
    res.json(rows);
  } catch (error) {
    logger.error('Error fetching mail accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}

// ----- GET single account -----

async function getAccount(req, res) {
  const userId = (req.get && req.get('x-user-id')) || (req.user && req.user.id) || (req.headers && req.headers['x-user-id']);
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT id, email, display_name, account_type, imap_host, imap_port, smtp_host, smtp_port, use_tls, is_default, is_active, sync_enabled, sync_interval_minutes, include_subfolders, sync_folders, sync_mode, login, password_encrypted FROM mail_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });

    const a = rows[0];
    logger.info('📖 Loaded account', { accountId, accountType: a.accountType });

    res.json({
      id: a.id, email: a.email, displayName: a.displayName, accountType: a.accountType,
      imapHost: a.imapHost, imapPort: a.imapPort, smtpHost: a.smtpHost, smtpPort: a.smtpPort,
      useTls: a.useTls, isActive: a.isActive, isDefault: a.isDefault, login: a.login,
      syncEnabled: a.syncEnabled, syncIntervalMinutes: a.syncIntervalMinutes,
      includeSubfolders: a.includeSubfolders, syncFolders: a.syncFolders,
      syncMode: a.syncMode || 'light',
      hasPassword: !!a.passwordEncrypted,
    });
  } catch (error) {
    logger.error('Error fetching mail account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
}

// ----- CREATE account -----

async function createAccount(req, res) {
  const userId = (req.get && req.get('x-user-id')) || (req.user && req.user.id) || (req.headers && req.headers['x-user-id']);
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { email, displayName, accountType, imapHost, imapPort, smtpHost, smtpPort, login, password, useTls } = req.body;
  try {
    if (!email || !accountType || !login || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info('📝 Creating account', { email, accountType, imapHost, smtpHost });

    const id = `mail_account_${uuidv4()}`;
    const passwordEncrypted = encryptPassword(password).encrypted;

    const { rows: existing } = await db.query(
      'SELECT id FROM mail_accounts WHERE user_id = $1 AND email = $2', [userId, email]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Account with this email already exists' });

    const { rows: accountCount } = await db.query(
      'SELECT COUNT(*) as count FROM mail_accounts WHERE user_id = $1', [userId]
    );
    const isDefault = accountCount[0].count === 0;

    const { rows } = await db.query(
      `INSERT INTO mail_accounts
       (id, user_id, email, display_name, account_type, imap_host, imap_port, smtp_host, smtp_port, login, password_encrypted, use_tls, is_default, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
       RETURNING id, email, display_name, account_type, is_default`,
      [id, userId, email, displayName || email, accountType,
        imapHost || 'imap.gmail.com', imapPort || 993,
        smtpHost || 'smtp.gmail.com', smtpPort || 587,
        login, passwordEncrypted, useTls !== false, isDefault]
    );

    logger.info('✅ Account created', { accountType: rows[0].account_type });
    await helpers.createSystemFolders(id, userId);

    res.status(201).json({
      id: rows[0].id, email: rows[0].email, displayName: rows[0].displayName,
      accountType: rows[0].accountType, isDefault: rows[0].isDefault, hasPassword: true,
    });
  } catch (error) {
    logger.error('Error creating mail account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

// ----- UPDATE account -----

async function updateAccount(req, res) {
  const userId = (req.get && req.get('x-user-id')) || (req.user && req.user.id) || (req.headers && req.headers['x-user-id']);
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId } = req.params;
  const { email, displayName, accountType, login, imapHost, imapPort, smtpHost, smtpPort, useTls, isActive, syncEnabled, syncIntervalMinutes, includeSubfolders, syncFolders, syncMode, password } = req.body;

  try {
    logger.info('🔧 Updating account', { accountId, accountType, email, imapHost, smtpHost, login });
    logger.debug('Password provided for update', { provided: !!password });

    const fields = [];
    const values = [];
    let p = 1;

    const pushField = (col, val) => { if (val !== undefined) { fields.push(`${col} = $${p++}`); values.push(val); } };

    pushField('email', email);
    pushField('display_name', displayName);
    pushField('account_type', accountType);
    if (accountType !== undefined) logger.debug('  → Setting account_type to:', { accountType });
    pushField('login', login);
    if (login !== undefined) logger.debug('  → Setting login to:', { login });
    if (password !== undefined && password) {
      fields.push(`password_encrypted = $${p++}`);
      values.push(encryptPassword(password).encrypted);
      logger.debug('  → Password encrypted and updated');
    } else if (password === undefined) {
      logger.debug('  → No password update (password not provided)');
    }
    pushField('imap_host', imapHost);
    pushField('imap_port', imapPort);
    pushField('smtp_host', smtpHost);
    pushField('smtp_port', smtpPort);
    pushField('use_tls', useTls);
    pushField('is_active', isActive);
    if (isActive !== undefined) logger.debug('  → Setting is_active to:', { isActive });
    pushField('sync_enabled', syncEnabled);
    pushField('sync_interval_minutes', syncIntervalMinutes);
    pushField('include_subfolders', includeSubfolders);
    if (syncFolders !== undefined) { 
      fields.push(`sync_folders = $${p++}`); 
      values.push(syncFolders !== null ? JSON.stringify(syncFolders) : null); 
    }
    if (syncMode !== undefined) { fields.push(`sync_mode = $${p++}`); values.push(syncMode); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(accountId, userId);

    const query = `UPDATE mail_accounts SET ${fields.join(', ')} WHERE id = $${p++} AND user_id = $${p++} RETURNING *`;
    logger.info('📋 Update query will update', { fieldsCount: fields.length });

    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });

    logger.info('✅ Account updated successfully', { id: rows[0].id, email: rows[0].email, accountType: rows[0].accountType, login: rows[0].login, hasPassword: !!rows[0].passwordEncrypted });

    res.json({ ...rows[0], hasPassword: !!rows[0].passwordEncrypted });
  } catch (error) {
    logger.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
}

// ----- TEST account -----

async function testAccount(req, res) {
  const userId = (req.get && req.get('x-user-id')) || (req.user && req.user.id) || (req.headers && req.headers['x-user-id']);
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId } = req.params;
  try {
    logger.info('🧪 Testing account', { accountId });

    const { rows } = await db.query(
      'SELECT id, email, login, password_encrypted, smtp_host, smtp_port, use_tls, imap_host, imap_port FROM mail_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });

    const a = rows[0];

    if (!a.login || !a.passwordEncrypted) {
      return res.status(400).json({
        error: 'Missing credentials',
        details: !a.passwordEncrypted
          ? 'Password not saved for this account. Please edit the account and enter the password again.'
          : 'Login not set for this account'
      });
    }
    if (!a.smtpHost || !a.smtpPort) {
      return res.status(400).json({ error: 'Missing SMTP configuration', details: 'SMTP host or port is not configured' });
    }

    const password = decryptPassword(a.passwordEncrypted);
    if (!password) {
      return res.status(400).json({ error: 'Failed to decrypt password', details: 'Could not decrypt account password. Please re-enter the password.' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: a.smtpHost, port: a.smtpPort,
        secure: a.useTls && a.smtpPort === 465,
        auth: { user: a.login, pass: password },
        ...(a.useTls ? { tls: { rejectUnauthorized: false } } : {})
      });
      await transporter.verify();
      await db.query('UPDATE mail_accounts SET last_sync = CURRENT_TIMESTAMP WHERE id = $1', [accountId]);
      logger.info('✅ SMTP connection successful');
      res.json({ success: true, message: 'Connection successful', email: a.email });
    } catch (error) {
      logger.error('SMTP connection test failed:', error);
      res.status(400).json({ success: false, error: 'Connection failed', details: error.message });
    }
  } catch (error) {
    logger.error('Error testing account:', error);
    res.status(500).json({ error: 'Failed to test account' });
  }
}

// ----- TEST connection (temporary) -----

async function testConnectionTemp(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { login, password, smtpHost, smtpPort, useTls, imapHost, imapPort } = req.body;
  try {
    if (!login || !password) {
      return res.status(400).json({ error: 'Missing credentials', details: 'Login or password is required' });
    }

    const results = {
      imap: { success: false, message: 'Not tested', error: null },
      smtp: { success: false, message: 'Not tested', error: null }
    };

    // Test IMAP connection if imapHost is provided
    if (imapHost && imapPort) {
      try {
        logger.info(`[Test Connection] Testing IMAP: ${imapHost}:${imapPort}`, { login, useTls });
        
        const Imap = require('imap');
        const imap = new Imap({
          user: login,
          password: password,
          host: imapHost,
          port: imapPort,
          tls: useTls !== false,
          tlsOptions: { rejectUnauthorized: false },
          authTimeout: 10000,
          connTimeout: 15000
        });

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('IMAP connection timeout (15s)')), 15000);
          
          imap.once('ready', () => {
            clearTimeout(timeout);
            imap.end();
            resolve();
          });
          
          imap.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
          
          imap.connect();
        });

        results.imap = {
          success: true,
          message: 'IMAP connection successful',
          error: null
        };
        logger.info('[Test Connection] IMAP test successful');
      } catch (imapError) {
        logger.error('[Test Connection] IMAP test failed:', imapError.message);
        results.imap = {
          success: false,
          message: 'IMAP connection failed',
          error: imapError.message
        };
        // Don't stop on IMAP error, continue with SMTP test
      }
    }

    // Test SMTP connection
    if (!smtpHost || !smtpPort) {
      return res.status(400).json({ 
        error: 'Missing SMTP configuration', 
        details: 'SMTP host or port is required',
        results
      });
    }

    try {
      const isSecurePort = smtpPort === 465;
      logger.info(`[Test Connection] Testing SMTP: ${smtpHost}:${smtpPort}`, { login, useTls, secure: isSecurePort });
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: useTls && isSecurePort, // true for port 465, false for 587
        auth: { user: login, pass: password },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000
      });
      
      await transporter.verify();
      results.smtp = {
        success: true,
        message: 'SMTP connection successful',
        error: null
      };
      logger.info('[Test Connection] SMTP test successful');
    } catch (smtpError) {
      logger.error('[Test Connection] SMTP test failed:', smtpError.message);
      
      // Provide helpfulful error messages for common issues
      let userFriendlyMessage = smtpError.message;
      
      if (smtpError.message.includes('Password') || smtpError.message.includes('credentials') || smtpError.message.includes('auth')) {
        userFriendlyMessage = 'Ошибка аутентификации. Проверьте логин и пароль. Для Mail.ru/Gmail может требоваться пароль приложения, а не обычный пароль.';
      } else if (smtpError.message.includes('timeout') || smtpError.message.includes('ETIMEDOUT')) {
        userFriendlyMessage = 'Таймаут подключения. Проверьте хост, порт и настройки брандмауэра.';
      } else if (smtpError.message.includes('ECONNREFUSED')) {
        userFriendlyMessage = 'Подключение отклонено. Проверьте хост и порт SMTP сервера.';
      } else if (smtpError.message.includes('CERT') || smtpError.message.includes('certificate')) {
        userFriendlyMessage = 'Ошибка SSL сертификата. Попробуйте изменить настройку TLS.';
      }
      
      results.smtp = {
        success: false,
        message: 'SMTP connection failed',
        error: userFriendlyMessage,
        originalError: smtpError.message
      };
    }

    // Return overall result
    const hasSuccess = results.imap.success || results.smtp.success;
    const allSuccess = results.imap.success && results.smtp.success;
    
    if (hasSuccess) {
      res.json({ 
        success: allSuccess,
        message: allSuccess ? 'Все подключения успешны' : 'Частичный успех',
        results
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Все подключения не успешны',
        results
      });
    }
  } catch (error) {
    logger.error('[Test Connection] Unexpected error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test connection', 
      details: error.message 
    });
  }
}

// ----- DELETE account -----

async function deleteAccount(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId } = req.params;
  try {
    const { rows: account } = await db.query(
      'SELECT is_default FROM mail_accounts WHERE id = $1 AND user_id = $2', [accountId, userId]
    );
    if (account.length === 0) return res.status(404).json({ error: 'Account not found' });

    // 1. Delete all DB records (mails, attachments, folders)
    await db.query('DELETE FROM mail_attachments WHERE mail_id IN (SELECT id FROM mail WHERE account_id = $1 AND user_id = $2)', [accountId, userId]);
    await db.query('DELETE FROM mail WHERE account_id = $1 AND user_id = $2', [accountId, userId]);
    await db.query('DELETE FROM mail_folders WHERE account_id = $1 AND user_id = $2', [accountId, userId]);
    await db.query('DELETE FROM mail_accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);

    if (account[0].is_default) {
      const { rows: nextAccount } = await db.query(
        'SELECT id FROM mail_accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1', [userId]
      );
      if (nextAccount.length > 0) {
        await db.query('UPDATE mail_accounts SET is_default = TRUE WHERE id = $1', [nextAccount[0].id]);
      }
    }

    // 2. Delete entire account directory on disk (all attachments)
    helpers.deleteAccountAttachments(accountId);

    res.json({ message: 'Account deleted' });
  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

// ----- SYNC account -----

async function syncAccount(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId } = req.params;
  const { background = false, folderName = null } = req.body || {};

  try {
    logger.info(`[MAIL SYNC] Starting sync for account ${accountId}, background: ${background}`);
    const account = await helpers.requireAccount(accountId, userId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (!account.imap_host || !account.login || !account.password_encrypted) {
      return res.status(400).json({
        error: 'IMAP credentials missing',
        details: 'Проверьте IMAP host/login/password в настройках аккаунта.'
      });
    }

    // Read syncFolders from account settings (if not overridden in request)
    const syncFolders = req.body?.syncFolders !== undefined
      ? req.body.syncFolders
      : (account.sync_folders || account.syncFolders || null);

    if (background) {
      logger.info(`[MAIL SYNC] Queuing background sync for account ${accountId}`);
      mailSyncService.syncAccount(account, { background: true, folderName, syncFolders })
        .then(result => logger.info(`[MAIL SYNC] Background sync completed for account ${accountId}: ${JSON.stringify(result)}`))
        .catch(error => logger.error(`[MAIL SYNC ERROR] Background sync failed for account ${accountId}:`, error.message));

      return res.json({ success: true, message: 'Синхронизация поставлена в очередь', accountId, background: true });
    } else {
      logger.info(`[MAIL SYNC] Starting foreground sync for account ${accountId}`);
      const result = await mailSyncService.syncAccount(account, { background: false, folderName, syncFolders });
      return res.json({ success: true, message: 'Синхронизация завершена', accountId, ...result, background: false });
    }
  } catch (error) {
    logger.error(`[MAIL SYNC ERROR] Failed to sync account ${accountId}:`, error);
    if ((error.message || '').includes('decrypt')) {
      return res.status(400).json({
        error: 'Failed to decrypt password',
        details: 'Пароль аккаунта зашифрован другим ключом. Откройте аккаунт и сохраните пароль заново.'
      });
    }
    res.status(500).json({ error: 'Failed to sync emails', details: error.message });
  }
}

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  testAccount,
  testConnectionTemp,
  deleteAccount,
  syncAccount,
};
