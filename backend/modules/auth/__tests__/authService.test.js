const db = require('../../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const notificationService = require('../../../utils/notificationService');
const logger = require('../../../utils/logger');
const { login, requestPasswordReset, resetPassword } = require('../services/authService');

jest.mock('../../../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));
jest.mock('../../../utils/notificationService', () => ({ sendEmail: jest.fn(), sendTelegram: jest.fn() }));
jest.mock('../../../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw if credentials are missing', async () => {
      await expect(login('', '')).rejects.toThrow('Требуется логин/email и пароль');
    });

    it('should throw if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await expect(login('user@test.com', 'pass')).rejects.toThrow('Пользователь не найден');
    });

    it('should throw if user has no password', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@test.com' }] });
      await expect(login('user@test.com', 'pass')).rejects.toThrow('Ошибка авторизации: пароль не установлен');
    });

    it('should throw if password mismatch', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@test.com', password_hash: 'hash' }] });
      bcrypt.compare.mockResolvedValueOnce(false);
      await expect(login('user@test.com', 'pass')).rejects.toThrow('Неверный пароль');
    });

    it('should return success and token on valid login', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@test.com', password_hash: 'hash', role: 'admin' }] });
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValueOnce('mocked_token');

      const result = await login('user@test.com', 'pass', '127.0.0.1', 'test agent');
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('mocked_token');
      expect(result.user.email).toBe('user@test.com');
      expect(logger.info).toHaveBeenCalledWith('Login successful', expect.any(Object));
    });
  });

  describe('requestPasswordReset', () => {
    it('should return success if user not found (security)', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const result = await requestPasswordReset('unknown');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Если аккаунт существует');
    });

    it('should throw if no contact methods available', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: null, telegram_token: null }] }); // user
      db.query.mockResolvedValueOnce({ rows: [] }); // settings
      await expect(requestPasswordReset('user')).rejects.toThrow('Нет доступных способов восстановления');
    });

    it('should return options if multiple methods available', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@test.com', telegram_token: '123' }] });
      db.query.mockResolvedValueOnce({ 
        rows: [
          { setting_key: 'email_config', value: '{"host":"h","user":"u"}' },
          { setting_key: 'telegram_config', value: '{"botToken":"b","enabled":true}' }
        ] 
      });
      
      const result = await requestPasswordReset('user');
      expect(result.requireSelection).toBe(true);
      expect(result.options.email).toBe('user@test.com');
    });

    it('should send email if requested', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@test.com' }] });
      db.query.mockResolvedValueOnce({ 
        rows: [
          { setting_key: 'email_config', value: '{"host":"h","user":"u"}' },
        ] 
      });
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update token
      notificationService.sendEmail.mockResolvedValueOnce(true);
      
      const result = await requestPasswordReset('user', 'email');
      expect(result.success).toBe(true);
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw if missing token or pass', async () => {
      await expect(resetPassword('', 'newpass')).rejects.toThrow('Требуется токен и новый пароль');
    });

    it('should throw if pass too short', async () => {
      await expect(resetPassword('token', '123')).rejects.toThrow('минимум 6 символов');
    });

    it('should throw if invalid token', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await expect(resetPassword('invalid', 'newpass123')).rejects.toThrow('Токен недействителен');
    });

    it('should reset password on valid token', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      bcrypt.hash.mockResolvedValueOnce('new_hash');
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      
      const result = await resetPassword('valid_token', 'newpass123');
      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(db.query).toHaveBeenCalledTimes(2);
    });
  });
});
