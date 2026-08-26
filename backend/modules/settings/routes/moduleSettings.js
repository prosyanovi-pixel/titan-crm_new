const express = require('express');
const router = express.Router();
const logger = require('../../../utils/logger');
const {
	getModuleSettings,
	getAllModulesWithSettings,
	saveModuleSetting,
	deleteModuleSetting,
} = require('../../../utils/moduleSettingsLoader');
const {
	getModuleBulkEditSettings,
	saveModuleBulkEditSettings,
	getAllBulkEditSettings,
	getEnabledBulkEditFields,
} = require('../../../utils/bulkEditSettings');

router.get('/', async (req, res) => {
	try {
		const modules = await getAllModulesWithSettings();
		res.json(modules);
	} catch (error) {
		logger.error('Error fetching all modules with settings', error);
		res.status(500).json({ error: 'Failed to fetch modules with settings' });
	}
});

router.get('/bulk-edit', async (req, res) => {
	try {
		const settings = await getAllBulkEditSettings();
		res.json(settings);
	} catch (error) {
		logger.error('Error fetching all bulk edit settings', error);
		res.status(500).json({ error: 'Failed to fetch bulk edit settings' });
	}
});

router.get('/:moduleId', async (req, res) => {
	try {
		const { moduleId } = req.params;
		const settings = await getModuleSettings(moduleId);

		if (Object.keys(settings).length === 0) {
			// Instead of 404, return the empty settings so the frontend doesn't throw errors
			return res.json({ moduleId, settings });
		}

		res.json({ moduleId, settings });
	} catch (error) {
		logger.error(`Error fetching settings for module ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to fetch module settings' });
	}
});

async function syncStatisticsVisibility(enableStatistics, skipModuleId) {
	try {
		const modules = await getAllModulesWithSettings();
		for (const mod of modules) {
			if (mod.id === skipModuleId) continue;
			const modFeatures = mod.settings?.features || {};
			if (modFeatures.enableStatistics !== enableStatistics) {
				modFeatures.enableStatistics = enableStatistics;
				await saveModuleSetting(mod.id, 'features', modFeatures);
			}
		}
	} catch (error) {
		logger.error('Error syncing statistics visibility across modules', error);
	}
}

router.post('/:moduleId', async (req, res) => {
	try {
		const { moduleId } = req.params;
		const { key, value } = req.body;

		if (!key) {
			return res.status(400).json({ error: 'Setting key is required' });
		}

		const result = await saveModuleSetting(moduleId, key, value);
		if (!result.success) {
			return res.status(400).json({ error: result.error });
		}

		if (key === 'features' && value && value.hasOwnProperty('enableStatistics')) {
			await syncStatisticsVisibility(value.enableStatistics, moduleId);
		}

		const settings = await getModuleSettings(moduleId);
		res.json({ success: true, moduleId, settings });
	} catch (error) {
		logger.error(`Error saving module settings for ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to save module settings' });
	}
});

router.put('/:moduleId', async (req, res) => {
	try {
		const { moduleId } = req.params;
		const { settings } = req.body;

		if (!settings || typeof settings !== 'object') {
			return res.status(400).json({ error: 'Settings object is required' });
		}

		for (const [key, value] of Object.entries(settings)) {
			const result = await saveModuleSetting(moduleId, key, value);
			if (!result.success) {
				return res.status(400).json({ error: `Failed to save setting ${key}: ${result.error}` });
			}

			if (key === 'features' && value && value.hasOwnProperty('enableStatistics')) {
				await syncStatisticsVisibility(value.enableStatistics, moduleId);
			}
		}

		const updatedSettings = await getModuleSettings(moduleId);
		res.json({ success: true, moduleId, settings: updatedSettings });
	} catch (error) {
		logger.error(`Error updating module settings for ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to update module settings' });
	}
});

router.delete('/:moduleId/:key', async (req, res) => {
	try {
		const { moduleId, key } = req.params;
		const result = await deleteModuleSetting(moduleId, key);

		if (!result.success) {
			return res.status(400).json({ error: result.error });
		}

		const settings = await getModuleSettings(moduleId);
		res.json({ success: true, moduleId, settings });
	} catch (error) {
		logger.error(`Error deleting module setting for ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to delete module setting' });
	}
});

router.get('/:moduleId/bulk-edit', async (req, res) => {
	try {
		const { moduleId } = req.params;
		const settings = await getModuleBulkEditSettings(moduleId);

		if (!settings) {
			return res.json({ fields: [] });
		}

		res.json(settings);
	} catch (error) {
		logger.error(`Error fetching bulk edit settings for module ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to fetch bulk edit settings' });
	}
});

router.get('/:moduleId/bulk-edit/enabled', async (req, res) => {
	try {
		const { moduleId } = req.params;
		const settings = await getEnabledBulkEditFields(moduleId);
		res.json(settings);
	} catch (error) {
		logger.error(`Error fetching enabled bulk edit fields for module ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to fetch enabled bulk edit fields' });
	}
});

router.post('/:moduleId/bulk-edit', async (req, res) => {
	try {
		const { moduleId } = req.params;
		const { fields, enabled = true } = req.body;

		if (!fields || !Array.isArray(fields)) {
			return res.status(400).json({ error: 'Fields array is required' });
		}

		const result = await saveModuleBulkEditSettings(moduleId, { fields, enabled });

		if (!result.success) {
			return res.status(400).json({ error: result.error });
		}

		res.json({ success: true, moduleId, fields, enabled });
	} catch (error) {
		logger.error(`Error saving bulk edit settings for module ${req.params.moduleId}`, error);
		res.status(500).json({ error: 'Failed to save bulk edit settings' });
	}
});

module.exports = router;