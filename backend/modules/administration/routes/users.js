const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { authMiddleware } = require('../../../middleware/auth');
const checkPermission = require('../../../middleware/checkPermission');

// Require authentication for all user routes
router.use(authMiddleware);

// ── Standard CRUD (new module format) ────────────────────────────────────────

// GET /api/administration/users - List all users without pagination (canonical module API / legacy compatibility)
router.get('/', checkPermission('users.read'), usersController.listAllUsers);

// GET /api/administration/users/paginated - List users (paginated for future use)
router.get('/paginated', checkPermission('users.read'), usersController.listUsers);

// GET /api/administration/users/legacy - List users with pagination (deprecated alias)
router.get('/legacy', checkPermission('users.read'), usersController.listUsers);

// POST /api/administration/users - Create new user
router.post('/', checkPermission('users.write'), usersController.createUser);

// GET /api/administration/users/:id - Get user by ID
router.get('/:id', checkPermission('users.read'), usersController.getUserById);

// PATCH /api/administration/users/:id - Update user
router.patch('/:id', checkPermission('users.write'), usersController.updateUser);

// PUT /api/administration/users/:id - Update user (legacy alias for PATCH)
router.put('/:id', checkPermission('users.write'), usersController.updateUser);

// DELETE /api/administration/users/:id - Soft-delete user
router.delete('/:id', checkPermission('users.delete'), usersController.deleteUser);

// POST /api/administration/users/:id/change-password - Change password
router.post('/:id/change-password', checkPermission(['users.write', 'users.read:self'], { mode: 'any' }), usersController.changePassword);

// ── Legacy-compatible routes (used by admin.js delegation) ───────────────────

// POST /api/admin/users/:id/block - Block user
router.post('/:id/block', checkPermission('users.write'), usersController.blockUser);

// POST /api/admin/users/:id/unblock - Unblock user
router.post('/:id/unblock', checkPermission('users.write'), usersController.unblockUser);

module.exports = router;
