const express = require('express');
const router = express.Router();
const controller = require('./workflowController');
const { authMiddleware } = require('../../middleware/auth');
const checkPermission = require('../../middleware/checkPermission');

// Webhook endpoint (Public — no auth, placed before authMiddleware)
router.post('/:id/webhook', controller.webhookTrigger.bind(controller));

// Only allow authenticated users for all routes below
router.use(authMiddleware);

// Registry endpoints (for frontend builder)
router.get('/registry/actions', controller.getRegistryActions.bind(controller));

// CRUD endpoints
router.get('/', controller.getWorkflows.bind(controller));
router.post('/', checkPermission('workflows.create'), controller.createWorkflow.bind(controller));
router.get('/:id', controller.getWorkflowById.bind(controller));
router.put('/:id', checkPermission('workflows.edit'), controller.updateWorkflow.bind(controller));
router.delete('/:id', checkPermission('workflows.delete'), controller.deleteWorkflow.bind(controller));
router.post('/:id/run', checkPermission('workflows.edit'), controller.runWorkflow.bind(controller));
router.post('/:id/validate', checkPermission('workflows.edit'), controller.validateWorkflow.bind(controller));
router.get('/:id/history', checkPermission('workflows.view'), controller.getExecutionHistory.bind(controller));
router.get('/:id/history/:execId', checkPermission('workflows.view'), controller.getExecutionDetails.bind(controller));
router.post('/:id/history/:execId/retry', checkPermission('workflows.edit'), controller.retryExecution.bind(controller));
router.post('/:id/history/:execId/approve', checkPermission('workflows.edit'), controller.approveExecution.bind(controller));
router.delete('/:id/history', checkPermission('workflows.edit'), controller.clearExecutionHistory.bind(controller));
router.delete('/:id/history/:execId', checkPermission('workflows.edit'), controller.deleteExecution.bind(controller));

module.exports = router;
