const userService = require('../services/userService');
const { asyncHandler } = require('../../../utils/errorHandler');
const responseHelpers = require('../../../utils/responseHelpers');

/**
 * Creates a new user
 * POST /api/admin/users
 */
const createUser = asyncHandler(async (req, res) => {
  const createdBy = req.user ? req.user.id : null;
  const user = await userService.create(req.body, createdBy);
  return responseHelpers.sendCreated(res, { success: true, data: user });
});

/**
 * Gets user by ID
 * GET /api/admin/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) {
    return responseHelpers.sendNotFound(res, 'User not found');
  }
  return responseHelpers.sendSuccess(res, { success: true, data: user });
});

/**
 * Lists users with pagination and filters
 * GET /api/admin/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    role_id: req.query.role_id,
  };

  if (req.query.is_active !== undefined) {
    options.is_active = req.query.is_active === 'true';
  } else {
    options.is_active = null;
  }

  const result = await userService.list(options);
  
  return responseHelpers.sendPaginated(res, result.users, {
    page: result.page,
    limit: result.limit,
    total: result.total
  });
});

/**
 * Updates a user
 * PATCH /api/admin/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const updatedBy = req.user ? req.user.id : null;
  const user = await userService.update(req.params.id, req.body, updatedBy);
  return responseHelpers.sendSuccess(res, { success: true, data: user });
});

/**
 * Soft-deletes a user
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const deletedBy = req.user ? req.user.id : null;
  await userService.delete(req.params.id, deletedBy);
  return responseHelpers.sendDeleted(res, 'User deleted successfully');
});

/**
 * Changes user password
 * POST /api/admin/users/:id/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const changedBy = req.user ? req.user.id : null;
  const { current_password, new_password } = req.body;
  
  if (!current_password || !new_password) {
    return responseHelpers.sendValidationError(res, 'Current and new passwords are required');
  }
  
  const result = await userService.changePassword(req.params.id, current_password, new_password, changedBy);
  return responseHelpers.sendSuccess(res, { success: true, message: result.message });
});

/**
 * Lists all users with enriched data (no pagination, legacy-compatible).
 * Returns a flat array directly for frontend UsersTab/UserEditor.
 * GET /api/admin/users
 */
const listAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAll();
  return res.json(users);
});

/**
 * Blocks a user
 * POST /api/admin/users/:id/block
 */
const blockUser = asyncHandler(async (req, res) => {
  const adminId = req.user ? req.user.id : (req.headers['x-user-id'] || 'system');
  const user = await userService.blockUser(req.params.id, adminId, req.body.reason);
  if (!user) return responseHelpers.sendNotFound(res, 'Пользователь не найден');
  return res.json({ success: true, user });
});

/**
 * Unblocks a user
 * POST /api/admin/users/:id/unblock
 */
const unblockUser = asyncHandler(async (req, res) => {
  const adminId = req.user ? req.user.id : (req.headers['x-user-id'] || 'system');
  const user = await userService.unblockUser(req.params.id, adminId);
  if (!user) return responseHelpers.sendNotFound(res, 'Пользователь не найден');
  return res.json({ success: true, user });
});

module.exports = {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
  changePassword,
  listAllUsers,
  blockUser,
  unblockUser
};
