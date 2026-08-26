const referencesService = require('../services/referencesService');
const { sendSuccess } = require('../../../utils/responseHelpers');
const logger = require('../../../utils/logger');

class ReferencesController {
  async getCurrencies(req, res) {
    const data = await referencesService.getCurrencies();
    sendSuccess(res, data);
  }

  async createCurrency(req, res) {
    const { id, name } = req.body;
    if (!id?.trim() || !name?.trim()) return res.status(400).json({ error: 'id и name обязательны' });
    const data = await referencesService.createCurrency(req.body);
    sendSuccess(res, data);
  }

  async updateCurrency(req, res) {
    const data = await referencesService.updateCurrency(req.params.id, req.body);
    if (!data) return res.status(404).json({ error: 'Валюта не найдена' });
    sendSuccess(res, data);
  }

  async deleteCurrency(req, res) {
    try {
      await referencesService.deleteCurrency(req.params.id);
      sendSuccess(res, { success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAllReferences(req, res) {
    const data = await referencesService.getAllReferences();
    sendSuccess(res, data);
  }

  async syncModules(req, res) {
    const modules = Array.isArray(req.body?.modules) ? req.body.modules : [];
    const dryRun = req.query?.dryRun === 'true' || req.query?.dryRun === '1' || req.body?.dryRun === true;

    if (modules.length === 0) {
      return res.json({
        dryRun,
        syncedModules: 0,
        insertedQuickActions: 0,
        skipped: true,
        report: {
          modules: { inserted: [], updated: [], unchanged: [], invalid: [] },
          quickActions: { inserted: [], existing: [], invalid: [] },
        },
      });
    }

    try {
      const result = await referencesService.syncModules(modules, dryRun);
      return res.json({ dryRun, ...result, skipped: false });
    } catch (err) {
      return res.status(500).json({ error: `Failed to sync modules: ${err.message}` });
    }
  }

  async getLegalFormGroups(req, res) {
    const data = await referencesService.getLegalFormGroups();
    sendSuccess(res, data);
  }

  async createLegalFormGroup(req, res) {
    const { id, name } = req.body;
    if (!id?.trim() || !name?.trim()) return res.status(400).json({ error: 'id и name обязательны' });
    const data = await referencesService.createLegalFormGroup(req.body);
    sendSuccess(res, data);
  }

  async updateLegalFormGroup(req, res) {
    const data = await referencesService.updateLegalFormGroup(req.params.id, req.body);
    if (!data) return res.status(404).json({ error: 'Группа не найдена' });
    sendSuccess(res, data);
  }

  async deleteLegalFormGroup(req, res) {
    await referencesService.deleteLegalFormGroup(req.params.id);
    sendSuccess(res, { success: true });
  }

  async getPositions(req, res) {
    const data = await referencesService.getPositions();
    sendSuccess(res, data);
  }

  async getLegalForms(req, res) {
    const data = await referencesService.getLegalForms();
    sendSuccess(res, data);
  }

  async createLegalForm(req, res) {
    const { id, name } = req.body;
    if (!id?.trim() || !name?.trim()) return res.status(400).json({ error: 'id и name обязательны' });
    const data = await referencesService.createLegalForm(req.body);
    sendSuccess(res, data);
  }

  async updateLegalForm(req, res) {
    const data = await referencesService.updateLegalForm(req.params.id, req.body);
    if (!data) return res.status(404).json({ error: 'Форма не найдена' });
    sendSuccess(res, data);
  }

  async deleteLegalForm(req, res) {
    await referencesService.deleteLegalForm(req.params.id);
    sendSuccess(res, { success: true });
  }

  async createGenericReference(req, res) {
    try {
      const data = await referencesService.createGenericReference(req.params.table, req.body);
      res.json(data);
    } catch (err) {
      if (err.message === 'Invalid table name') return res.status(400).json({ error: err.message });
      logger.error(`POST /api/references/${req.params.table} failed`, err);
      res.status(500).json({ error: `Failed to create ${req.params.table} item: ${err.message}` });
    }
  }

  async updateGenericReference(req, res) {
    try {
      const data = await referencesService.updateGenericReference(req.params.table, req.params.id, req.body);
      if (data === null) return res.json({ message: 'No changes' });
      if (data === false) return res.status(404).json({ error: 'Item not found' });
      res.json(data);
    } catch (err) {
      if (err.message === 'Invalid table name') return res.status(400).json({ error: err.message });
      logger.error(`PUT /api/references/${req.params.table}/${req.params.id} failed`, err);
      res.status(500).json({ error: `Internal server error: ${err.message}` });
    }
  }

  async deleteGenericReference(req, res) {
    try {
      const success = await referencesService.deleteGenericReference(req.params.table, req.params.id);
      if (!success) return res.status(404).json({ error: 'Item not found' });
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      if (err.message === 'Invalid table name') return res.status(400).json({ error: err.message });
      logger.error(`DELETE /api/references/${req.params.table}/${req.params.id} failed`, err);
      res.status(500).json({ error: `Failed to delete ${req.params.table} item` });
    }
  }
}

module.exports = new ReferencesController();