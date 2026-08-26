/**
 * Unit Tests for User Service
 * 
 * Tests cover:
 * - User creation with validation
 * - Email validation and uniqueness
 * - Password hashing and strength validation
 * - CRUD operations
 * - Audit logging
 * - Error handling
 */

// Mock db BEFORE importing userService (to avoid pg initialization)
jest.mock('../../../../../db', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('../../../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const userService = require('../../../services/userService');
const db = require('../../../../../db');
const bcrypt = require('bcrypt');
const logger = require('../../../../../utils/logger');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 'user',
      phone: '+1234567890',
    };

    it('should create a user with valid data', async () => {
      const hashedPassword = 'hashed_password_123';
      const createdUser = {
        id: 'uuid-123',
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        phone: userData.phone,
        is_active: true,
        created_at: new Date(),
      };

      db.query
        .mockResolvedValueOnce({ rows: [] }) // Check duplicate email
        .mockResolvedValueOnce({ rows: [{ id: 'user' }] }) // Check role exists
        .mockResolvedValueOnce({ rows: [createdUser] }) // Insert user
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      bcrypt.hash.mockResolvedValueOnce(hashedPassword);

      const user = await userService.create(userData, 'admin-id');

      expect(user).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      const invalidData = { ...userData, email: 'invalid-email' };

      await expect(userService.create(invalidData)).rejects.toThrow('Invalid email format');
    });

    it('should reject weak password (less than 8 chars)', async () => {
      const weakData = { ...userData, password: 'weak' };

      await expect(userService.create(weakData)).rejects.toThrow(/минимум 8 символов/);
    });

    it('should reject password without uppercase letters', async () => {
      const weakData = { ...userData, password: 'weakpass123!' };

      await expect(userService.create(weakData)).rejects.toThrow(/прописные буквы/);
    });

    it('should reject password without digits', async () => {
      const weakData = { ...userData, password: 'WeakPass!' };

      await expect(userService.create(weakData)).rejects.toThrow(/цифры/);
    });

    it('should reject if email already exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

      const error = await userService.create(userData).catch(err => err);

      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should reject if role does not exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const error = await userService.create(userData).catch(err => err);

      expect(error.message).toContain('Role');
      expect(error.statusCode).toBe(400);
    });

    it('should use default role if not provided', async () => {
      const dataWithoutRole = { ...userData };
      delete dataWithoutRole.role_id;

      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ ...userData, role_id: 'user' }] })
        .mockResolvedValueOnce({ rows: [] });

      bcrypt.hash.mockResolvedValueOnce('hashed');

      const user = await userService.create(dataWithoutRole, 'admin');

      expect(user.role_id).toBe('user');
    });
  });

  describe('getById', () => {
    it('should return user if found', async () => {
      const user = { id: 'uuid-123', email: 'test@example.com', first_name: 'John' };
      db.query.mockResolvedValueOnce({ rows: [user] });

      const result = await userService.getById('uuid-123');

      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await userService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return user if found by email', async () => {
      const user = { id: 'uuid-123', email: 'test@example.com' };
      db.query.mockResolvedValueOnce({ rows: [user] });

      const result = await userService.getByEmail('test@example.com');

      expect(result).toEqual(user);
    });

    it('should return null if email not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await userService.getByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list users with pagination', async () => {
      const users = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];

      db.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: users });

      const result = await userService.list({ page: 1, limit: 20 });

      expect(result.users).toEqual(users);
      expect(result.total).toBe(10);
    });

    it('should not use deleted_at column in query', async () => {
      const users = [{ id: '1', email: 'user1@example.com' }];

      db.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: users });

      await userService.list({ page: 1, limit: 20 });

      // Check that no query contains 'deleted_at'
      db.query.mock.calls.forEach(([query]) => {
        expect(typeof query).toBe('string');
        expect(query.toLowerCase()).not.toContain('deleted_at');
      });
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const oldUser = { id: 'uuid-123', email: 'old@example.com', role_id: 'user' };
      const updatedUser = { ...oldUser, email: 'new@example.com', role_id: 'manager' };

      db.query
        .mockResolvedValueOnce({ rows: [oldUser] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'manager' }] })
        .mockResolvedValueOnce({ rows: [updatedUser] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await userService.update('uuid-123', { email: 'new@example.com', role_id: 'manager' }, 'admin');

      expect(result.email).toBe('new@example.com');
    });

    it('should reject if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const error = await userService.update('non-existent', { first_name: 'Test' }).catch(err => err);

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('delete', () => {
    it('should soft-delete user by setting is_active=false', async () => {
      const user = { id: 'uuid-123', email: 'test@example.com', is_active: true };
      const deletedUser = { ...user, is_active: false, status: 'inactive' };

      db.query
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [deletedUser] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await userService.delete('uuid-123', 'admin');

      expect(result.is_active).toBe(false);
      expect(result.status).toBe('inactive');
    });

    it('should reject if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const error = await userService.delete('non-existent').catch(err => err);

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('changePassword', () => {
    it('should change password if current password is correct', async () => {
      const user = { id: 'uuid-123', password_hash: 'hashed_old_password' };

      db.query
        .mockResolvedValueOnce({ rows: [user] })
        .mockResolvedValueOnce({ rows: [] });

      bcrypt.compare.mockResolvedValueOnce(true);
      bcrypt.hash.mockResolvedValueOnce('hashed_new_password');

      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await userService.changePassword('uuid-123', 'OldPass123!', 'NewPass123!', 'admin');

      expect(result.success).toBe(true);
    });

    it('should reject if current password is wrong', async () => {
      const user = { id: 'uuid-123', password_hash: 'hashed_password' };

      db.query.mockResolvedValueOnce({ rows: [user] });
      bcrypt.compare.mockResolvedValueOnce(false);

      const error = await userService.changePassword('uuid-123', 'WrongPass123!', 'NewPass123!').catch(err => err);

      expect(error.message).toBe('Current password is incorrect');
      expect(error.statusCode).toBe(401);
    });
  });
});
