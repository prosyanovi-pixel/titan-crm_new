/**
 * Contract Service Layer
 * Business logic for contracts operations
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const { AppError } = require('../../../utils/errorHandler');
const { generateNextNumber } = require('../../../utils/numbering');
const websocketServer = require('../../../modules/notifications/services/websocketServer');
const notificationService = require('../../../utils/notificationService');
const contractWorkflow = require('./contractWorkflow');
const contractTemplates = require('./contractTemplates');
const contractCases = require('./contractCases');
const contractVersions = require('./contractVersions');
const contractFiles = require('./contractFiles');
const contractReadModel = require('./contractReadModel');
const contractPersistence = require('./contractPersistence');
const contractMutations = require('./contractMutations');

class ContractService {
  /**
   * Get all contracts with pagination and filtering
   */
  async getAll(userId, options = {}) {
    return contractReadModel.getAll({ db, options });
  }

  /**
   * Get single contract with all related data
   */
  async getById(contractId) {
    return contractReadModel.getById({ db, AppError, contractId });
  }

  /**
   * Create new contract
   */
  async create(userId, data) {
    return contractPersistence.create({
      db,
      logger,
      AppError,
      generateNextNumber,
      userId,
      data,
      logAudit: this._logAudit.bind(this),
    });
  }

  /**
   * Update contract
   */
  async update(contractId, userId, data) {
    return contractPersistence.update({
      db,
      AppError,
      contractId,
      userId,
      data,
      logAudit: this._logAudit.bind(this),
    });
  }
  /**
   * Delete contract
   */
  async delete(contractId, userId) {
    return contractMutations.deleteContract({
      db,
      logger,
      AppError,
      contractId,
      userId,
      logAudit: this._logAudit.bind(this),
    });
  }

  /**
   * Bulk delete contracts
   */
  async bulkDelete(contractIds, userId) {
    return contractMutations.bulkDelete({
      db,
      logger,
      AppError,
      contractIds,
      userId,
      logAudit: this._logAudit.bind(this),
    });
  }

  /**
   * Bulk update contract status
   */
  async bulkUpdateStatus(userId, contractIds, newStatus) {
    return contractMutations.bulkUpdateStatus({
      db,
      logger,
      AppError,
      userId,
      contractIds,
      newStatus,
      logAudit: this._logAudit.bind(this),
    });
  }

  /**
   * Get contract metrics for dashboard
   */
  async getContractMetrics() {
    return contractMutations.getContractMetrics({ db });
  }


  /**
   * Get all templates
   */
  async getTemplates(options = {}) {
    return contractTemplates.getTemplates({ db, options });
  }

  /**
   * Create template
   */
  async createTemplate(userId, data) {
    return contractTemplates.createTemplate({ db, logger, AppError, userId, data });
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, userId, data) {
    return contractTemplates.updateTemplate({ db, logger, AppError, templateId, userId, data });
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    return contractTemplates.deleteTemplate({ db, logger, AppError, templateId });
  }

  /**
   * Send contract for approval
   */
  async sendForApproval(contractId, userId, approvers, deadlineDate, versionId) {
    return contractWorkflow.sendForApproval({
      contractId,
      userId,
      approvers,
      deadlineDate,
      versionId,
      db,
      logger,
      websocketServer,
      logAudit: this._logAudit.bind(this),
      AppError,
    });
  }

  /**
   * Approve contract at step
   */
  async approve(contractId, stepNumber, userId) {
    return contractWorkflow.approve({
      contractId,
      stepNumber,
      userId,
      db,
      logger,
      websocketServer,
      AppError,
    });
  }

  /**
   * Reject contract at step
   */
  async reject(contractId, stepNumber, userId, reason) {
    return contractWorkflow.reject({
      contractId,
      stepNumber,
      userId,
      reason,
      db,
      logger,
      websocketServer,
      AppError,
    });
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(contractId) {
    return contractWorkflow.getApprovalHistory({ contractId, db });
  }

  /**
   * Cancel approval process
   */
  async cancelApproval(contractId, userId) {
    return contractWorkflow.cancelApproval({
      contractId,
      userId,
      db,
      logger,
      websocketServer,
      logAudit: this._logAudit.bind(this),
      AppError,
    });
  }

  /**
   * Create new version
   */
  async createVersion(contractId, userId, data) {
    return contractVersions.createVersion({ db, logger, contractId, userId, data });
  }

  /**
   * Get version history
   */
  async getVersions(contractId) {
    return contractVersions.getVersions({ db, contractId });
  }

  /**
   * Revert to specific version
   */
  async revertToVersion(contractId, versionId, userId) {
    return contractVersions.revertToVersion({ db, logger, AppError, contractId, versionId, userId });
  }

  /**
   * Delete specific version
   */
  async deleteVersion(contractId, versionId, userId) {
    return contractVersions.deleteVersion({ db, logger, AppError, contractId, versionId, userId });
  }

  /**
   * Upload files to contract
   */
  async uploadFiles(contractId, files, userId) {
    return contractFiles.uploadFiles({ db, logger, AppError, contractId, files, userId });
  }

  /**
   * Get contract files
   */
  async getFiles(contractId) {
    return contractFiles.getFiles({ db, contractId });
  }

  /**
   * Delete contract file
   */
  async deleteFile(contractId, fileId) {
    return contractFiles.deleteFile({ db, logger, AppError, contractId, fileId });
  }

  /**
   * Link contract to legal case
   */
  async linkCase(contractId, caseId, userId) {
    return contractCases.linkCase({ db, logger, AppError, contractId, caseId, userId });
  }

  /**
   * Unlink contract from legal case
   */
  async unlinkCase(contractId, caseId) {
    return contractCases.unlinkCase({ db, logger, AppError, contractId, caseId });
  }

  /**
   * Get contracts for a legal case
   */
  async getContractsForCase(caseId, options = {}) {
    return contractCases.getContractsForCase({ db, caseId, options });
  }

  /**
   * Private helper to log audit events
   */
  async _logAudit(contractId, userId, action, details = {}) {
    try {
      await db.query(
        `INSERT INTO contract_audit_log (contract_id, user_id, action, details)
         VALUES ($1, $2, $3, $4)`,
        [contractId, userId, action, details]
      );
    } catch (error) {
      logger.error(`Failed to log audit for contract ${contractId}: ${error.message}`);
    }
  }
}

module.exports = new ContractService();
