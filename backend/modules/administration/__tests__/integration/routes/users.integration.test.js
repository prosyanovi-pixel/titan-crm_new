/**
 * @jest-environment node
 */
const request = require('supertest');
const express = require('express');
const usersRouter = require('../../../routes/users');

// Mock dependencies
jest.mock('../../../services/userService');
const userService = require('../../../services/userService');

// Mock auth middleware to bypass real JWT checks
jest.mock('../../../../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (req.headers.authorization === 'Bearer invalid') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Simulate req.user assignment
    req.user = { id: 'admin-id', name: 'Admin' };
    next();
  }
}));

// Mock checkPermission middleware
jest.mock('../../../../../middleware/checkPermission', () => {
  return (requiredPermission) => (req, res, next) => {
    const role = req.headers['x-role'] || 'user';
    // Admin has all permissions, user has read permissions
    const permissionsStr = Array.isArray(requiredPermission) ? requiredPermission.join(',') : requiredPermission;
    
    if (role === 'admin' || permissionsStr.includes('read')) {
      req.user = { ...req.user, role: 'admin' };
      return next();
    }
    return res.status(403).json({ error: 'Нет прав доступа' });
  };
});

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/admin/users', usersRouter);

describe('Users Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/users', () => {
    it('should create user successfully', async () => {
      userService.create.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const response = await request(app)
        .post('/api/admin/users')
        .set('x-role', 'admin')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@test.com');
      expect(userService.create).toHaveBeenCalledTimes(1);
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('x-role', 'user')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(403);
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list users with pagination', async () => {
      userService.list.mockResolvedValue({
        users: [{ id: '1', email: 'test@test.com' }],
        total: 1,
        page: 1,
        limit: 20
      });

      const response = await request(app)
        .get('/api/admin/users/paginated')
        .set('x-role', 'user'); // User can read

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
      expect(userService.list).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user by id', async () => {
      userService.getById.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const response = await request(app)
        .get('/api/admin/users/1')
        .set('x-role', 'user');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 if user not found', async () => {
      userService.getById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/users/999')
        .set('x-role', 'admin');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it('should update user', async () => {
      userService.update.mockResolvedValue({ id: '1', first_name: 'Updated' });

      const response = await request(app)
        .patch('/api/admin/users/1')
        .set('x-role', 'admin')
        .send({ first_name: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.first_name).toBe('Updated');
      expect(userService.update).toHaveBeenCalledWith('1', { first_name: 'Updated' }, 'admin-id');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user', async () => {
      userService.delete.mockResolvedValue({ id: '1' });

      const response = await request(app)
        .delete('/api/admin/users/1')
        .set('x-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(userService.delete).toHaveBeenCalledWith('1', 'admin-id');
    });
  });

  describe('POST /api/admin/users/:id/change-password', () => {
    it('should change password', async () => {
      userService.changePassword.mockResolvedValue({ success: true, message: 'Password changed' });

      const response = await request(app)
        .post('/api/admin/users/1/change-password')
        .set('x-role', 'admin')
        .send({ current_password: 'old', new_password: 'new' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed');
      expect(userService.changePassword).toHaveBeenCalledWith('1', 'old', 'new', 'admin-id');
    });

    it('should require passwords in body', async () => {
      const response = await request(app)
        .post('/api/admin/users/1/change-password')
        .set('x-role', 'admin')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Current and new passwords are required');
    });
  });
});
