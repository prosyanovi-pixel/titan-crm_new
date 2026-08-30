const {
  getCurrent,
  changePassword,
  createShareLink,
  deleteShareLink,
  getById,
  update
} = require('../controllers');
const db = require('../../db');
const bcrypt = require('bcrypt');
const { sendSuccess, sendNotFound, sendValidationError } = require('../../utils/responseHelpers');

jest.mock('../../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('../../utils/responseHelpers', () => ({
  sendSuccess: jest.fn(),
  sendNotFound: jest.fn(),
  sendValidationError: jest.fn(),
}));

describe('Profile Controllers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: { 'x-user-id': '1' },
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getCurrent', () => {
    it('should return error if no x-user-id', async () => {
      req.headers = {};
      await getCurrent(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'Unauthorized');
    });

    it('should return not found if user does not exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      await getCurrent(req, res);
      expect(sendNotFound).toHaveBeenCalledWith(res, 'User not found');
    });

    it('should return sanitized user', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test', password_hash: 'secret' }] });
      await getCurrent(req, res);
      expect(sendSuccess).toHaveBeenCalledWith(res, expect.objectContaining({ id: 1, name: 'Test' }));
      expect(sendSuccess).toHaveBeenCalledWith(res, expect.not.objectContaining({ password_hash: 'secret' }));
    });
  });

  describe('changePassword', () => {
    it('should return error if missing fields', async () => {
      await changePassword(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'oldPassword and newPassword are required');
    });

    it('should return not found if user missing', async () => {
      req.body = { oldPassword: 'old', newPassword: 'new' };
      db.query.mockResolvedValueOnce({ rows: [] });
      await changePassword(req, res);
      expect(sendNotFound).toHaveBeenCalledWith(res, 'User not found');
    });

    it('should return validation error if wrong old password', async () => {
      req.body = { oldPassword: 'wrong', newPassword: 'new' };
      db.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hash' }] });
      bcrypt.compare.mockResolvedValueOnce(false);
      await changePassword(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'Неверный текущий пароль');
    });

    it('should change password successfully', async () => {
      req.body = { oldPassword: 'old', newPassword: 'new' };
      db.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hash' }] });
      bcrypt.compare.mockResolvedValueOnce(true);
      bcrypt.hash.mockResolvedValueOnce('new_hash');
      
      await changePassword(req, res);
      expect(db.query).toHaveBeenCalledWith('UPDATE users SET password_hash = $1 WHERE id = $2', ['new_hash', '1']);
      expect(sendSuccess).toHaveBeenCalledWith(res, { success: true, message: 'Password changed successfully' });
    });
  });

  describe('createShareLink', () => {
    it('should require documentId', async () => {
      await createShareLink(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'documentId is required');
    });

    it('should create and return share link', async () => {
      req.body = { documentId: 'doc1' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 'link1', createdAt: 'now' }] });
      
      await createShareLink(req, res);
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 'link1', url: '/share/link1', createdAt: 'now' });
    });
  });

  describe('update', () => {
    it('should update user fields and return sanitized user', async () => {
      req.params = { id: '1' };
      req.body = { name: 'John Doe', email: 'john@example.com' };
      
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'John Doe', email: 'john@example.com' }] });
      
      await update(req, res);
      
      expect(db.query).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 1, name: 'John Doe', email: 'john@example.com' });
    });
  });
});
