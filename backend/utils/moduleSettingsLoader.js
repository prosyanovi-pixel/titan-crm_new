/**
 * Загрузчик настроек модулей
 * Динамически загружает специфичные для модулей настройки и роутеры из папок модулей
 */

const path = require('path');
const fs = require('fs');
const db = require('../db');
const logger = require('./logger');

// Кэш для загруженных настроек модулей
const settingsCache = new Map();

// Кэш для загруженных роутеров модулей
const routersCache = new Map();

/**
 * Получить настройки модуля из файла (статическая конфигурация)
 * @param {string} moduleId - Идентификатор модуля
 * @param {string} moduleFolder - Имя папки модуля
 * @returns {Object} Настройки модуля или пустой объект, если не найдены
 */
function getModuleSettingsFromFile(moduleId, moduleFolder) {
  if (!moduleFolder) {
    logger.warn(`Folder not specified for module ${moduleId}. Skipping settings load.`);
    return {};
  }
  
  const modulePath = path.join(__dirname, '../modules', moduleFolder);
  const settingsPath = path.join(modulePath, 'settings.js');
  const indexPath = path.join(modulePath, 'index.js');
  
  try {
    // 1. Try loading from settings.js (priority)
    if (fs.existsSync(settingsPath)) {
      delete require.cache[require.resolve(settingsPath)];
      return require(settingsPath) || {};
    }
    
    // 2. Try loading from index.js (settings property)
    if (fs.existsSync(indexPath)) {
      delete require.cache[require.resolve(indexPath)];
      const moduleInfo = require(indexPath);
      if (moduleInfo && moduleInfo.settings) {
        return moduleInfo.settings;
      }
    }

    logger.debug(`Settings not found for module ${moduleId} (checked ${settingsPath} and ${indexPath})`);
    return {};
  } catch (error) {
    logger.error(`Error loading module settings for ${moduleId}:`, error);
    return {};
  }
}

/**
 * Получить настройки модуля из базы данных (динамическая конфигурация)
 * @param {string} moduleId - Идентификатор модуля
 * @returns {Promise<Object>} Настройки из БД или пустой объект
 */
async function getModuleSettingsFromDatabase(moduleId) {
  try {
    const { rows } = await db.query(
      'SELECT setting_key, value FROM module_settings WHERE module_id = $1',
      [moduleId]
    );
    
    const settings = {};
    rows.forEach(row => {
      // pg can return camelCase (settingKey) or snake_case (setting_key)
      const key = row.settingKey || row.setting_key;
      settings[key] = row.value;
    });
    
    return settings;
  } catch (error) {
    logger.error(`Error getting module settings from DB for ${moduleId}:`, error);
    return {};
  }
}

/**
 * Получить комбинированные настройки модуля (файл + переопределения из БД)
 * Настройки из БД имеют приоритет перед файловыми
 * @param {string} moduleId - Идентификатор модуля
 * @returns {Promise<Object>} Комбинированные настройки модуля
 */
async function getModuleSettings(moduleId) {
  try {
    let actualModuleId = moduleId;
    if (actualModuleId === 'legal-cases') actualModuleId = 'cases';
    if (actualModuleId === 'system') actualModuleId = 'settings';

    // Check cache
    if (settingsCache.has(actualModuleId)) {
      return settingsCache.get(actualModuleId);
    }
    
    // Get module info from DB
    const { rows } = await db.query(
      'SELECT id, folder FROM modules WHERE id = $1',
      [actualModuleId]
    );
    
    if (rows.length === 0) {
      logger.warn(`Module ${actualModuleId} (requested as ${moduleId}) not found`);
      return {};
    }
    
    const module = rows[0];
    
    // Load settings from file (static)
    const fileSettings = getModuleSettingsFromFile(actualModuleId, module.folder);
    
    // Load settings from DB (dynamic)
    const dbSettings = await getModuleSettingsFromDatabase(actualModuleId);
    
    // Merge settings: DB settings override file settings
    const mergedSettings = { ...fileSettings };
    for (const [key, value] of Object.entries(dbSettings)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Deep merge group
        mergedSettings[key] = { ...(fileSettings[key] || {}), ...value };
      } else if (typeof fileSettings[key] === 'object' && fileSettings[key] !== null) {
        // If file has a group - deep merge only
      } else {
        // Scalar override
        mergedSettings[key] = value;
      }
    }
    
    // Cache the result
    settingsCache.set(actualModuleId, mergedSettings);
    
    return mergedSettings;
  } catch (error) {
    logger.error(`Error in getModuleSettings for ${moduleId}:`, error);
    return {};
  }
}

/**
 * Get all active modules with their settings
 * @returns {Promise<Array>} Array of modules with settings
 */
async function getAllModulesWithSettings() {
  try {
    const { rows: modules } = await db.query(
      `SELECT id, name, folder, icon
       FROM modules 
       ORDER BY id`
    );
    
    const modulesWithSettings = [];
    
    for (const module of modules) {
      const settings = await getModuleSettings(module.id);
      modulesWithSettings.push({
        ...module,
        settings,
      });
    }
    
    return modulesWithSettings;
  } catch (error) {
    logger.error('Error getting all modules with settings:', error);
    return [];
  }
}

/**
 * Save module setting to DB
 * @param {string} moduleId - Module ID
 * @param {string} settingKey - Setting key
 * @param {*} value - Setting value
 * @returns {Promise<Object>} Result with success status
 */
async function saveModuleSetting(moduleId, settingKey, value) {
  try {
    // Check module existence
    const { rows } = await db.query(
      'SELECT id FROM modules WHERE id = $1',
      [moduleId]
    );
    
    if (rows.length === 0) {
      return { success: false, error: `Module ${moduleId} not found` };
    }
    
    // Save to DB - value column has JSONB type
    const jsonValue = JSON.stringify(value);
    
    await db.query(
      `INSERT INTO module_settings (module_id, setting_key, value, updated_at)
       VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (module_id, setting_key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [moduleId, settingKey, jsonValue]
    );
    
    // Clear cache
    settingsCache.delete(moduleId);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error saving setting for module ${moduleId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete module setting from DB
 * @param {string} moduleId - Module ID
 * @param {string} settingKey - Setting key
 * @returns {Promise<Object>} Result with success status
 */
async function deleteModuleSetting(moduleId, settingKey) {
  try {
    await db.query(
      'DELETE FROM module_settings WHERE module_id = $1 AND setting_key = $2',
      [moduleId, settingKey]
    );
    
    // Clear cache
    settingsCache.delete(moduleId);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting setting for module ${moduleId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear settings cache
 * @param {string} moduleId - Module ID (or 'all' for full clear)
 */
function clearCache(moduleId = null) {
  if (moduleId === 'all') {
    settingsCache.clear();
    logger.info('Settings cache cleared for all modules');
  } else if (moduleId) {
    settingsCache.delete(moduleId);
    logger.info(`Settings cache cleared for module ${moduleId}`);
  }
}

/**
 * Initialize module settings from DB
 * Called on startup to preload metadata
 * @returns {Promise<void>}
 */
async function initializeModules() {
  try {
    logger.info('Initializing module settings...');
    const modulesWithSettings = await getAllModulesWithSettings();
    logger.info(`Initialized ${modulesWithSettings.length} modules`);
  } catch (error) {
    logger.error('Error initializing module settings:', error);
  }
}

/**
 * Get module router from file
 * @param {string} moduleId - Module ID
 * @param {string} moduleFolder - Module folder name
 * @returns {Object|null} Express router or null if not found
 */
function getModuleRouter(moduleId, moduleFolder) {
  if (!moduleFolder) {
    logger.warn(`Folder not specified for module ${moduleId}. Skipping router load.`);
    return null;
  }
  const routerPath = path.join(__dirname, '../modules', moduleFolder, 'index.js');

  try {
    if (!fs.existsSync(routerPath)) {
      logger.debug(`Router file not found for module ${moduleId} at ${routerPath}`);
      return null;
    }

    // Clear require cache for fresh load
    delete require.cache[require.resolve(routerPath)];
    const moduleExports = require(routerPath);

    // If module exports router directly
    if (moduleExports.router) {
      return moduleExports.router;
    }

    // If module exports router as default or directly
    return moduleExports.default || moduleExports;
  } catch (error) {
    logger.error(`Error loading router for module ${moduleId}:`, error);
    return null;
  }
}

/**
 * Get all active modules with their settings and routers
 * @returns {Promise<Array>} Array of modules with info
 */
async function getAllModulesWithRouters() {
  try {
    const { rows: modules } = await db.query(
      `SELECT id, name, folder, icon
       FROM modules
       ORDER BY id`
    );

    const modulesWithInfo = [];

    for (const module of modules) {
      const settings = await getModuleSettings(module.id);
      const router = getModuleRouter(module.id, module.folder);

      modulesWithInfo.push({
        ...module,
        settings,
        router,
      });
    }

    return modulesWithInfo;
  } catch (error) {
    logger.error('Error getting all modules with routers:', error);
    return [];
  }
}

/**
 * Register all module routers in the main application
 * @param {Object} app - Express app instance
 * @returns {Promise<void>}
 */
async function registerModuleRouters(app) {
  try {
    const modulesWithInfo = await getAllModulesWithRouters();

    for (const module of modulesWithInfo) {
      if (module.router) {
        const prefix = module.settings.prefix || `/api/${module.id}`;
        app.use(prefix, module.router);
        logger.info(`Registered module router: ${module.id} -> ${prefix}`);
      }
    }

    logger.info(`Registered ${modulesWithInfo.length} module routers`);
  } catch (error) {
    logger.error('Error registering module routers:', error);
  }
}

module.exports = {
  getModuleSettings,
  getModuleSettingsFromFile,
  getModuleSettingsFromDatabase,
  getAllModulesWithSettings,
  getAllModulesWithRouters,
  saveModuleSetting,
  deleteModuleSetting,
  clearCache,
  initializeModules,
  getModuleRouter,
  registerModuleRouters,
};
