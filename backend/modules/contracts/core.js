const express = require('express');

const { asyncHandler, AppError } = require('../../utils/errorHandler');
const contractService = require('./services/contractService');
const checkPermission = require('../../middleware/checkPermission');
const ContractValidator = require('./validators/ContractValidator');

const router = express.Router();

router.get('/', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];

  const {
    page = 1,
    limit = 20,
    status,
    assignedTo,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    projectId
  } = req.query;

  const result = await contractService.getAll(userId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    status,
    assignedTo,
    search,
    sortBy,
    sortOrder,
    projectId
  });

  res.json(result);
}));

router.get('/metrics', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const metrics = await contractService.getContractMetrics();
  res.json(metrics);
}));

router.post('/', checkPermission('contracts.create'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  
  // Валидация
  ContractValidator.validate(req.body);

  const { 
    name, contractNumber, description, assignedTo, templateId, 
    contractorId, type, amount, currency, paymentStatus,
    projectId, startDate, endDate, tags 
  } = req.body;

  const contract = await contractService.create(userId, {
    name,
    contractNumber,
    description,
    assignedTo,
    templateId,
    contractorId,
    type,
    amount,
    currency,
    paymentStatus,
    projectId,
    startDate,
    endDate,
    tags
  });

  res.status(201).json(contract);
}));

router.get('/templates/list', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, isActive = true, search } = req.query;

  const result = await contractService.getTemplates({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    category,
    isActive: isActive === 'false' ? false : true,
    search
  });

  res.json(result);
}));

router.post('/templates', checkPermission('contracts.templates.manage'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, description, content, category } = req.body;

  const template = await contractService.createTemplate(userId, {
    name,
    description,
    content,
    category
  });

  res.status(201).json(template);
}));

router.put('/templates/:id', checkPermission('contracts.templates.manage'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, description, content, category, isActive } = req.body;

  const template = await contractService.updateTemplate(req.params.id, userId, {
    name,
    description,
    content,
    category,
    isActive
  });

  res.json(template);
}));

router.delete('/templates/:id', checkPermission('contracts.templates.manage'), asyncHandler(async (req, res) => {
  const result = await contractService.deleteTemplate(req.params.id);
  res.json(result);
}));

router.post('/case/:caseId', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await contractService.getContractsForCase(req.params.caseId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });

  res.json(result);
}));

router.get('/:id', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const contract = await contractService.getById(req.params.id);
  res.json(contract);
}));

router.put('/:id', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  
  // Валидация
  ContractValidator.validate(req.body);

  const { 
    name, contractNumber, description, assignedTo, status, 
    contractorId, type, amount, currency, paymentStatus,
    projectId, startDate, endDate, tags 
  } = req.body;

  const contract = await contractService.update(req.params.id, userId, {
    name,
    contractNumber,
    description,
    assignedTo,
    status,
    contractorId,
    type,
    amount,
    currency,
    paymentStatus,
    projectId,
    startDate,
    endDate,
    tags
  });

  res.json(contract);
}));

router.delete('/:id', checkPermission('contracts.delete'), asyncHandler(async (req, res) => {
  const result = await contractService.delete(req.params.id);
  res.json(result);
}));

router.post('/bulk-delete', checkPermission('contracts.delete'), asyncHandler(async (req, res) => {
  const { contractIds } = req.body;
  const result = await contractService.bulkDelete(contractIds);
  res.json(result);
}));

router.post('/bulk-update-status', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { contractIds, newStatus } = req.body;
  const result = await contractService.bulkUpdateStatus(userId, contractIds, newStatus);
  res.json(result);
}));

module.exports = router;
