const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const logger = require('../../utils/logger');
const { asyncHandler, AppError } = require('../../utils/errorHandler');
const contractService = require('./services/contractService');
const checkPermission = require('../../middleware/checkPermission');

const uploadsDir = path.join(__dirname, '../../uploads/contracts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uuid}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('File type not allowed', 400));
    }
  }
});

router.use('/', require('./core'));

router.post('/:id/send-for-approval', checkPermission('contracts.approve'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { approvers, deadlineDate, versionId } = req.body;

  if (!Array.isArray(approvers) || approvers.length === 0) {
    throw new AppError('At least one approver is required', 400);
  }

  const result = await contractService.sendForApproval(req.params.id, userId, approvers, deadlineDate, versionId);
  res.json(result);
}));

router.post('/:id/approvals/cancel', checkPermission('contracts.approve'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const result = await contractService.cancelApproval(req.params.id, userId);
  res.json(result);
}));

router.post('/:id/approve/:step', checkPermission('contracts.approve'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const approval = await contractService.approve(
    req.params.id,
    parseInt(req.params.step, 10),
    userId
  );

  res.json(approval);
}));

router.post('/:id/reject/:step', checkPermission('contracts.approve'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { reason } = req.body;

  const approval = await contractService.reject(
    req.params.id,
    parseInt(req.params.step, 10),
    userId,
    reason || null
  );

  res.json(approval);
}));

router.get('/:id/approval-history', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const history = await contractService.getApprovalHistory(req.params.id);
  res.json(history);
}));

router.post('/:id/create-version', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, content, changes, fileId } = req.body;

  const version = await contractService.createVersion(req.params.id, userId, {
    name,
    content,
    changes,
    fileId
  });

  res.status(201).json(version);
}));

router.get('/:id/versions', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const versions = await contractService.getVersions(req.params.id);
  res.json(versions);
}));

router.post('/:id/revert-to-version/:versionId', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const result = await contractService.revertToVersion(req.params.id, req.params.versionId, userId);
  res.json(result);
}));

router.delete('/:id/versions/:versionId', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const result = await contractService.deleteVersion(req.params.id, req.params.versionId, userId);
  res.json(result);
}));

router.post('/:id/upload', checkPermission('contracts.edit'), upload.array('files', 10), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const files = await contractService.uploadFiles(req.params.id, req.files, userId);
  res.status(201).json(files);
}));

router.get('/:id/files', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const files = await contractService.getFiles(req.params.id);
  res.json(files);
}));

router.delete('/:id/files/:fileId', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const result = await contractService.deleteFile(req.params.id, req.params.fileId);
  res.json(result);
}));

router.post('/:id/link-case/:caseId', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'];
  const link = await contractService.linkCase(req.params.id, req.params.caseId, userId);
  res.status(201).json(link);
}));

router.delete('/:id/unlink-case/:caseId', checkPermission('contracts.edit'), asyncHandler(async (req, res) => {
  const result = await contractService.unlinkCase(req.params.id, req.params.caseId);
  res.json(result);
}));


router.get('/:id/actual-file', checkPermission('contracts.view'), asyncHandler(async (req, res) => {
  const db = require('../../db');
  const contractId = req.params.id;
  
  // Find the latest version with a file
  const result = await db.query(
    `SELECT cv.file_id, cf.file_path, cf.original_name, cf.mime_type
     FROM contract_versions cv
     JOIN contract_files cf ON cv.file_id = cf.id
     WHERE cv.contract_id = $1
     ORDER BY cv.version_number DESC
     LIMIT 1`,
    [contractId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Актуальный файл не найден' });
  }
  
  const file = result.rows[0];
  // Since we already have a generic download endpoint somewhere else (or files are served statically), 
  // we just return the file_id so frontend can use the existing download endpoint.
  res.json({ 
    fileId: file.file_id,
    originalName: file.original_name,
    mimeType: file.mime_type,
    filePath: file.file_path
  });
}));

module.exports = router;
