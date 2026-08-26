/**
 * User Service
 * Handles user CRUD operations, password management, and validation
 * 
 * @module administration/services/userService
 * @requires pg
 * @requires bcrypt
 */

const db = require('../../../db');
const bcrypt = require('bcrypt');
const logger = require('../../../utils/logger');
const { DEFAULT_ROLES } = require('../settings');

const SALT_ROUNDS = 10;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validates email format
 * @private
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * @private
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Пароль должен быть минимум 8 символов' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Пароль должен содержать строчные буквы' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Пароль должен содержать прописные буквы' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Пароль должен содержать цифры' };
  }
  return { isValid: true, message: 'OK' };
}

class UserService {
  /**
   * Creates a new user
   * 
   * @async
   * @param {Object} userData - User data
   * @param {string} userData.email - User email (unique)
   * @param {string} userData.password - User password (will be hashed)
   * @param {string} [userData.first_name] - First name
   * @param {string} [userData.last_name] - Last name
   * @param {string} [userData.role_id='user'] - Role ID
   * @param {string} [userData.phone] - Phone number
   * @param {string} [createdBy] - User ID of creator (for audit)
   * 
   * @returns {Promise<Object>} Created user object
   * @throws {Error} If email exists, password invalid, or role not found
   * 
   * @example
   * const user = await userService.create({
   *   email: 'john@example.com',
   *   password: 'SecurePass123!',
   *   first_name: 'John',
   *   role_id: 'manager'
   * }, adminUserId);
   */
  async create(userData, createdBy = null) {
    const { email, password, first_name, last_name, role_id = 'user', phone } = userData;

    logger.info('User creation initiated', { email, role_id });

    // Validate email
    if (!email || !isValidEmail(email)) {
      const error = new Error('Invalid email format');
      error.statusCode = 400;
      throw error;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = new Error(passwordValidation.message);
      error.statusCode = 400;
      throw error;
    }

    // Check if email already exists
    try {
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        const error = new Error('Email already exists');
        error.statusCode = 409;
        throw error;
      }
    } catch (err) {
      if (err.statusCode === 409) throw err;
      logger.error('Error checking duplicate email', { email, error: err.message });
      throw err;
    }

    // Verify role exists
    try {
      const roleExists = await db.query('SELECT id FROM roles WHERE id = $1', [role_id]);
      if (roleExists.rows.length === 0) {
        const error = new Error(`Role '${role_id}' not found`);
        error.statusCode = 400;
        throw error;
      }
    } catch (err) {
      if (err.statusCode === 400) throw err;
      logger.error('Error verifying role', { role_id, error: err.message });
      throw err;
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    } catch (err) {
      logger.error('Password hashing failed', { email, error: err.message });
      throw new Error('Password hashing failed');
    }

    // Create user
    try {
      const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role_id, phone, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, email, first_name, last_name, role_id, phone, is_active, created_at`,
        [email, hashedPassword, first_name || null, last_name || null, role_id, phone || null]
      );

      const user = result.rows[0];

      // Log audit entry
      if (createdBy) {
        await this._logAudit('users', user.id, 'CREATE', null, user, createdBy);
      }

      logger.info('User created successfully', { userId: user.id, email });
      return user;
    } catch (err) {
      logger.error('User creation failed', { email, error: err.message });
      throw err;
    }
  }

  /**
   * Gets user by ID
   * 
   * @async
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   * @throws {Error} If database query fails
   */
  async getById(userId) {
    try {
      const result = await db.query(
        'SELECT id, email, first_name, last_name, role_id, phone, is_active, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (err) {
      logger.error('Error fetching user', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Gets user by email
   * 
   * @async
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getByEmail(email) {
    try {
      const result = await db.query(
        'SELECT id, email, first_name, last_name, role_id, phone, is_active, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );

      return result.rows[0] || null;
    } catch (err) {
      logger.error('Error fetching user by email', { email, error: err.message });
      throw err;
    }
  }

  /**
   * Lists all users with pagination
   * 
   * @async
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string} [options.role_id] - Filter by role
   * @param {boolean} [options.is_active=true] - Filter active users
   * 
   * @returns {Promise<Object>} { users: User[], total: number }
   */
  async list(options = {}) {
    const { page = 1, limit = 20, role_id, is_active = true } = options;
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT id, email, first_name, last_name, role_id, phone, is_active, created_at FROM users WHERE 1=1';
      const params = [];

      if (is_active !== null) {
        params.push(is_active);
        query += ` AND is_active = $${params.length}`;
      }

      if (role_id) {
        params.push(role_id);
        query += ` AND role_id = $${params.length}`;
      }

      // Get total count
      const countResult = await db.query(query.replace('SELECT id, email, first_name, last_name, role_id, phone, is_active, created_at FROM users', 'SELECT COUNT(*) FROM users'), params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      params.push(limit);
      params.push(offset);
      query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await db.query(query, params);

      return {
        users: result.rows,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (err) {
      logger.error('Error listing users', { error: err.message });
      throw err;
    }
  }

  /**
   * Updates user
   * 
   * @async
   * @param {string} userId - User ID
   * @param {Object} updateData - Fields to update
   * @param {string} [updateData.email] - New email
   * @param {string} [updateData.first_name] - First name
   * @param {string} [updateData.last_name] - Last name
   * @param {string} [updateData.role_id] - New role
   * @param {string} [updateData.phone] - Phone
   * @param {boolean} [updateData.is_active] - Active status
   * @param {string} [updatedBy] - User ID of updater (for audit)
   * 
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If user not found or update fails
   */
  async update(userId, updateData, updatedBy = null) {
    try {
      // Get current user for audit
      const oldUser = await this.getById(userId);
      if (!oldUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const { email, first_name, last_name, role_id, phone, is_active } = updateData;

      // Validate email if changing
      if (email && email !== oldUser.email) {
        if (!isValidEmail(email)) {
          const error = new Error('Invalid email format');
          error.statusCode = 400;
          throw error;
        }

        const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (existing.rows.length > 0) {
          const error = new Error('Email already exists');
          error.statusCode = 409;
          throw error;
        }
      }

      // Verify role if changing
      if (role_id && role_id !== oldUser.role_id) {
        const roleExists = await db.query('SELECT id FROM roles WHERE id = $1', [role_id]);
        if (roleExists.rows.length === 0) {
          const error = new Error(`Role '${role_id}' not found`);
          error.statusCode = 400;
          throw error;
        }
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (first_name !== undefined) {
        fields.push(`first_name = $${paramCount++}`);
        values.push(first_name);
      }
      if (last_name !== undefined) {
        fields.push(`last_name = $${paramCount++}`);
        values.push(last_name);
      }
      if (role_id !== undefined) {
        fields.push(`role_id = $${paramCount++}`);
        values.push(role_id);
      }
      if (phone !== undefined) {
        fields.push(`phone = $${paramCount++}`);
        values.push(phone);
      }
      if (is_active !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(is_active);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, role_id, phone, is_active, created_at, updated_at`;

      const result = await db.query(query, values);
      const updatedUser = result.rows[0];

      // Log audit entry
      if (updatedBy) {
        await this._logAudit('users', userId, 'UPDATE', oldUser, updatedUser, updatedBy);
      }

      logger.info('User updated successfully', { userId, updatedFields: Object.keys(updateData) });
      return updatedUser;
    } catch (err) {
      logger.error('User update failed', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Soft-deletes user (marks status as inactive)
   * 
   * @async
   * @param {string} userId - User ID
   * @param {string} [deletedBy] - User ID of deleter (for audit)
   * 
   * @returns {Promise<Object>} Deleted user object
   * @throws {Error} If user not found
   */
  async delete(userId, deletedBy = null) {
    try {
      const oldUser = await this.getById(userId);
      if (!oldUser) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const result = await db.query(
        'UPDATE users SET is_active = FALSE, status = \'inactive\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, first_name, last_name, is_active, status',
        [userId]
      );

      const deletedUser = result.rows[0];

      // Log audit entry
      if (deletedBy) {
        await this._logAudit('users', userId, 'DELETE', oldUser, null, deletedBy);
      }

      logger.info('User deleted successfully', { userId });
      return deletedUser;
    } catch (err) {
      logger.error('User deletion failed', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Changes user password
   * 
   * @async
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password
   * @param {string} [changedBy] - User ID of person making change
   * 
   * @returns {Promise<Object>} { success: boolean, message: string }
   * @throws {Error} If password invalid or user not found
   */
  async changePassword(userId, currentPassword, newPassword, changedBy = null) {
    try {
      // Get user with password hash
      const result = await db.query(
        'SELECT id, password_hash FROM users WHERE id = $1 AND is_active = TRUE',
        [userId]
      );

      if (result.rows.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const user = result.rows[0];

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 401;
        throw error;
      }

      // Validate new password
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        const error = new Error(validation.message);
        error.statusCode = 400;
        throw error;
      }

      // Hash and update
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, userId]);

      // Log audit
      if (changedBy) {
        await this._logAudit('users', userId, 'PASSWORD_CHANGE', null, { password_changed: true }, changedBy);
      }

      logger.info('Password changed successfully', { userId });
      return { success: true, message: 'Password changed' };
    } catch (err) {
      logger.error('Password change failed', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Lists all users with enriched data (employee, position, department joins).
   * Used by the legacy admin panel that expects a flat array.
   * 
   * @async
   * @returns {Promise<Array>} Array of enriched user objects
   */
  async listAll() {
    try {
      // Ensure block-related columns exist
      await db.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP,
          ADD COLUMN IF NOT EXISTS is_blocked     BOOLEAN NOT NULL DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS blocked_at     TIMESTAMP,
          ADD COLUMN IF NOT EXISTS blocked_by     VARCHAR(50),
          ADD COLUMN IF NOT EXISTS block_reason   TEXT;
      `);
    } catch { /* columns may already exist */ }

    const { rows } = await db.query(`
      SELECT DISTINCT ON (u.id)
        u.id, u.name, u.email, u.role, u.status,
        u.is_blocked, u.blocked_at, u.blocked_by, u.block_reason,
        u.last_active_at, u.created_at, u.avatar, u.initials, u.phone, u.department,
        e.id AS employee_id,
        p.name AS position_name,
        d.name AS department_name
      FROM users u
      LEFT JOIN employees   e ON e.user_id = u.id::text
      LEFT JOIN positions   p ON p.id = e.position_id
      LEFT JOIN departments d ON d.id = e.department_id
      ORDER BY u.id, u.last_active_at DESC NULLS LAST
    `);
    return rows;
  }

  /**
   * Blocks a user
   * 
   * @async
   * @param {string} userId - User ID to block
   * @param {string} adminId - Admin performing the action
   * @param {string} [reason=''] - Reason for blocking
   * @returns {Promise<Object|null>} Blocked user or null if not found
   */
  async blockUser(userId, adminId, reason = '') {
    const { rows } = await db.query(
      `UPDATE users SET is_blocked=TRUE, blocked_at=NOW(), blocked_by=$1, block_reason=$2, status='blocked'
       WHERE id=$3 RETURNING id, name, is_blocked`,
      [adminId || 'system', reason, userId]
    );
    if (!rows.length) return null;
    logger.info(`User ${userId} blocked by ${adminId}, reason: ${reason}`);
    return rows[0];
  }

  /**
   * Unblocks a user
   * 
   * @async
   * @param {string} userId - User ID to unblock
   * @param {string} adminId - Admin performing the action
   * @returns {Promise<Object|null>} Unblocked user or null if not found
   */
  async unblockUser(userId, adminId) {
    const { rows } = await db.query(
      `UPDATE users SET is_blocked=FALSE, blocked_at=NULL, blocked_by=NULL, block_reason=NULL, status='active'
       WHERE id=$1 RETURNING id, name, is_blocked`,
      [userId]
    );
    if (!rows.length) return null;
    logger.info(`User ${userId} unblocked by ${adminId}`);
    return rows[0];
  }

  /**
   * Logs audit entry for user changes
   * @private
   */
  async _logAudit(entityType, entityId, action, oldValues, newValues, changedBy) {
    try {
      await db.query(
        `INSERT INTO administration_audit_log (entity_type, entity_id, action, old_values, new_values, changed_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [entityType, entityId, action, JSON.stringify(oldValues), JSON.stringify(newValues), changedBy]
      );
    } catch (err) {
      // Don't fail the operation if audit logging fails, just log the error
      logger.error('Audit logging failed', { entityType, entityId, action, error: err.message });
    }
  }
}

module.exports = new UserService();
