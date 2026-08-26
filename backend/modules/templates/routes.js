const express = require('express');
const router = express.Router();
const templateController = require('./controllers/templateController');
const variablesController = require('./controllers/variablesController');
const numeratorsController = require('./controllers/numeratorsController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const checkPermission = require('../../middleware/checkPermission');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = require('../../config/paths').directories.templates;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Variables CRUD
/**
 * @swagger
 * /api/templates/variables:
 *   get:
 *     summary: Выполнение GET /variables
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get('/variables', variablesController.list);
/**
 * @swagger
 * /api/templates/variables:
 *   post:
 *     summary: Выполнение POST /variables
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/variables', variablesController.create);
/**
 * @swagger
 * /api/templates/variables/:id:
 *   put:
 *     summary: Выполнение PUT /variables/:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.put('/variables/:id', variablesController.update);
/**
 * @swagger
 * /api/templates/variables/:id:
 *   delete:
 *     summary: Выполнение DELETE /variables/:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.delete('/variables/:id', variablesController.remove);

// Numerators CRUD
/**
 * @swagger
 * /api/templates/numerators:
 *   get:
 *     summary: Выполнение GET /numerators
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get('/numerators', numeratorsController.list);
/**
 * @swagger
 * /api/templates/numerators:
 *   post:
 *     summary: Выполнение POST /numerators
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/numerators', numeratorsController.create);
/**
 * @swagger
 * /api/templates/numerators/:id:
 *   put:
 *     summary: Выполнение PUT /numerators/:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.put('/numerators/:id', numeratorsController.update);
/**
 * @swagger
 * /api/templates/numerators/:id:
 *   delete:
 *     summary: Выполнение DELETE /numerators/:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.delete('/numerators/:id', numeratorsController.remove);

// Data Provider helpers
/**
 * @swagger
 * /api/templates/fields/:moduleId:
 *   get:
 *     summary: Выполнение GET /fields/:moduleId
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get('/fields/:moduleId', templateController.getFields);

// Template CRUD
/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Выполнение GET /
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get('/', checkPermission('templates.read'), templateController.list);
/**
 * @swagger
 * /api/templates/:id:
 *   get:
 *     summary: Выполнение GET /:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get('/:id', checkPermission('templates.read'), templateController.get);
/**
 * @swagger
 * /api/templates/:id/download:
 *   get:
 *     summary: Выполнение GET /:id/download
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.get('/:id/download', checkPermission('templates.read'), templateController.download);
/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Выполнение POST /
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/', checkPermission('templates.write'), upload.single('file'), templateController.create);
/**
 * @swagger
 * /api/templates/:id:
 *   put:
 *     summary: Выполнение PUT /:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.put('/:id', checkPermission('templates.write'), upload.single('file'), templateController.update);
/**
 * @swagger
 * /api/templates/:id:
 *   delete:
 *     summary: Выполнение DELETE /:id
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.delete('/:id', checkPermission('templates.delete'), templateController.remove);
/**
 * @swagger
 * /api/templates/:id/copy:
 *   post:
 *     summary: Выполнение POST /:id/copy
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/:id/copy', checkPermission('templates.write'), templateController.copy);


const documentController = require('./controllers/documentController');

// Generators
/**
 * @swagger
 * /api/templates/:id/generate:
 *   post:
 *     summary: Выполнение POST /:id/generate
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/:id/generate', checkPermission('templates.read'), documentController.generate);
/**
 * @swagger
 * /api/templates/:id/generate-action:
 *   post:
 *     summary: Выполнение POST /:id/generate-action
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/:id/generate-action', checkPermission('templates.read'), documentController.generateAction);
/**
 * @swagger
 * /api/templates/:id/generate-bulk:
 *   post:
 *     summary: Выполнение POST /:id/generate-bulk
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Успешно
 */
router.post('/:id/generate-bulk', checkPermission('templates.read'), documentController.generateBulk);
/**
 * @swagger
 * /api/templates/:id/generate-bulk-async:
 *   post:
 *     summary: Выполнение POST /:id/generate-bulk-async
 *     tags: [Templates]
 *     responses:
 *       202:
 *         description: Процесс запущен в фоне
 */
router.post('/:id/generate-bulk-async', checkPermission('templates.read'), documentController.generateBulkAsync);

module.exports = router;
