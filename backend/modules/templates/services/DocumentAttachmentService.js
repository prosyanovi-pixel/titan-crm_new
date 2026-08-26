const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const logger = require('../../../utils/logger');
const db = require('../../../db');

/**
 * Service to attach generated documents directly to their corresponding entities.
 */
class DocumentAttachmentService {
  /**
   * Generates a unique filename for the document.
   */
  static generateFilename(originalName) {
    const ext = path.extname(originalName) || '.docx';
    const name = path.basename(originalName, ext);
    return `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  }

  /**
   * Attaches a document buffer to an entity based on the module type.
   * 
   * @param {string} moduleId - e.g. 'legal_cases', 'contracts', 'projects'
   * @param {string} entityId - The ID of the specific entity
   * @param {Buffer} buffer - The generated document buffer
   * @param {string} originalName - The name of the file
   * @param {Object} user - The user who generated the document
   * @returns {Promise<Object>} The document metadata object
   */
  static async attachDocument(moduleId, entityId, buffer, originalName, user) {
    const userName = user?.name || 'Система';
    const userId = user?.id || null;
    const storedFilename = this.generateFilename(originalName);

    switch (moduleId) {
      case 'cases':
        return await this._attachToLegalCase(entityId, buffer, originalName, storedFilename, userName);
      case 'contracts':
        return await this._attachToContract(entityId, buffer, originalName, storedFilename, userId);
      case 'projects':
      case 'tasks':
      default:
        return await this._attachToGenericDocuments(moduleId, entityId, buffer, originalName, storedFilename, userId);
    }
  }

  static async _attachToLegalCase(caseId, buffer, originalName, storedFilename, userName) {
    const uploadDir = require('../../../config/paths').directories.legalCases;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, storedFilename);
    await fs.promises.writeFile(filePath, buffer);

    const docId = `doc-${randomUUID()}`;
    const date = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const size = this._formatSize(buffer.length);
    const url = `/api/legal-cases/documents/files/${storedFilename}`;

    const { rows } = await db.query(
      `INSERT INTO case_documents (id, case_id, name, type, date, size, author, url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [docId, caseId, originalName, 'document', date, size, userName, url]
    );

    // Timeline event
    try {
      const { addCaseEvent } = require('../../legal_cases/services/cases');
      await addCaseEvent(caseId, {
        title: 'Добавлен документ по шаблону',
        description: `Сгенерирован файл: ${originalName}`,
        type: 'document',
        author: userName
      });
    } catch (err) {
      logger.warn('Failed to create timeline event for template attachment', err);
    }

    return rows[0];
  }

  static async _attachToContract(contractId, buffer, originalName, storedFilename, userId) {
    const uploadDir = require('../../../config/paths').directories.contracts;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, storedFilename);
    await fs.promises.writeFile(filePath, buffer);

    try {
      const contractFiles = require('../../contracts/services/contractFiles');
      const AppError = require('../../../utils/appError');
      
      const filesUploaded = await contractFiles.uploadFiles({
        db,
        logger,
        AppError,
        contractId,
        userId,
        files: [{
          originalname: originalName,
          filename: storedFilename,
          path: filePath,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: buffer.length
        }]
      });

      // Log to timeline / audit log
      await db.query(
        `INSERT INTO contract_audit_log (contract_id, user_id, action, details)
         VALUES ($1, $2, $3, $4)`,
        [contractId, userId, 'document_generated', { name: originalName }]
      );

      return filesUploaded[0];
    } catch (err) {
      logger.warn('Failed to attach document to contract files', err);
      return { success: true, filePath };
    }
  }

  static async _attachToGenericDocuments(moduleId, entityId, buffer, originalName, storedFilename, userId, folderId = null) {
    const uploadDir = require('../../../config/paths').directories.documents;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, storedFilename);
    await fs.promises.writeFile(filePath, buffer);

    const documentId = `doc-${Date.now()}`;
    const versionId = `ver-${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];

    // Generic document creation
    await db.query(
      `INSERT INTO documents (id, name, type, size, date, stored_filename, uploaded_by, parent_id)
       VALUES ($1, $2, 'file', $3, $4, $5, $6, $7)`,
      [documentId, originalName, buffer.length, now, storedFilename, userId, folderId || null]
    );

    await db.query(
      `INSERT INTO document_versions (id, document_id, version_number, stored_filename, size, created_by)
       VALUES ($1, $2, 1, $3, $4, $5)`,
      [versionId, documentId, storedFilename, buffer.length, userId]
    );

    await db.query(
      "UPDATE documents SET current_version_id = $1 WHERE id = $2",
      [versionId, documentId]
    );

    return { documentId, storedFilename };
  }

  static _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = DocumentAttachmentService;
