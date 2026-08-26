/**
 * Контроллеры для управления настройками Finance
 */

const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');
const financeSettingsService = require('../services/financeSettingsService');
const {
  getTaxRegimes,
  getTaxRegime,
  createTaxRegime,
  updateTaxRegime,
  deleteTaxRegime,
  getAvailableTaxRegimes,
  updateTaxRegimeLegalForms,
} = require('./financeSettingsTaxRegimesController');
const {
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getTaxRatesHistory,
} = require('./financeSettingsTaxRatesController');
const {
  getAllocationMethods,
  createAllocationMethod,
  deleteAllocationMethod,
} = require('./financeSettingsAllocationMethodsController');
const {
  getOverheadArticles,
  createOverheadArticle,
  updateOverheadArticle,
  deleteOverheadArticle,
} = require('./financeSettingsOverheadArticlesController');

// ============================================================
// СТАВКИ НАЛОГОВ (TAX RATES)
// ============================================================

const { getDefaultsSettings, updateDefaultsSettings } = require('./financeSettingsDefaultsController');

module.exports = {
  getTaxRegimes,
  getTaxRegime,
  createTaxRegime,
  updateTaxRegime,
  deleteTaxRegime,
  getAvailableTaxRegimes,
  updateTaxRegimeLegalForms,
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getTaxRatesHistory,
  // Allocation Methods
  getAllocationMethods,
  createAllocationMethod,
  deleteAllocationMethod,
  // Overhead Articles
  getOverheadArticles,
  createOverheadArticle,
  updateOverheadArticle,
  deleteOverheadArticle,
  // Defaults Settings
  getDefaultsSettings,
  updateDefaultsSettings,
};
