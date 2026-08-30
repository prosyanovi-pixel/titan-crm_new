const { login, forgotPassword, resetPassword } = require('../controllers');
const authService = require('../services/authService');
const logger = require('../../../utils/logger');

jest.mock('../services/authService', () => ({
  login: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

describe('Auth Controllers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'jest-test'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('login', () => {
    it('should login successfully', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      const mockResult = { success: true, token: 'mock-token' };
      authService.login.mockResolvedValueOnce(mockResult);

      await login(req, res);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', '127.0.0.1', 'jest-test');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle login error', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };
      authService.login.mockRejectedValueOnce(new Error('Пользователь не найден'));

      await login(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Пользователь не найден' });
    });
    
    it('should handle validation error', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };
      authService.login.mockRejectedValueOnce(new Error('Неверный пароль'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Неверный пароль' });
    });
  });

  describe('forgotPassword', () => {
    it('should return error if no identifier', async () => {
      req.body = {};
      
      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Требуется указать email или никнейм' });
    });

    it('should call service and return success', async () => {
      req.body = { identifier: 'user1' };
      const mockResult = { success: true };
      authService.requestPasswordReset.mockResolvedValueOnce(mockResult);

      await forgotPassword(req, res);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith('user1', undefined);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle service errors', async () => {
      req.body = { identifier: 'user1' };
      authService.requestPasswordReset.mockRejectedValueOnce(new Error('Error'));

      await forgotPassword(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error' });
    });
  });

  describe('resetPassword', () => {
    it('should call service and return success', async () => {
      req.body = { token: 'valid-token', newPassword: 'new-password' };
      const mockResult = { success: true };
      authService.resetPassword.mockResolvedValueOnce(mockResult);

      await resetPassword(req, res);

      expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'new-password');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle invalid token error', async () => {
      req.body = { token: 'invalid-token', newPassword: 'new-password' };
      authService.resetPassword.mockRejectedValueOnce(new Error('недействителен'));

      await resetPassword(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'недействителен' });
    });
  });
});
