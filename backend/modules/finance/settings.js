/**
 * Finance Settings Router
 * API для настроек финансового модуля
 */

const express = require('express');
const router = express.Router();
const controller = require('./controllers/financeSettingsController');

// ============================================================
// РЕЖИМЫ НАЛОГООБЛОЖЕНИЯ
// ============================================================
router.get('/tax-regimes', controller.getTaxRegimes);
// Дополнительные эндпоинты для 2026
router.get('/tax-regimes/available', controller.getAvailableTaxRegimes);
router.put('/tax-regimes/:id/legal-forms', controller.updateTaxRegimeLegalForms);
router.get('/tax-regimes/:id', controller.getTaxRegime);
router.post('/tax-regimes', controller.createTaxRegime);
router.put('/tax-regimes/:id', controller.updateTaxRegime);
router.delete('/tax-regimes/:id', controller.deleteTaxRegime);

// ============================================================
// СТАВКИ НАЛОГОВ
// ============================================================
router.get('/tax-rates', controller.getTaxRates);
router.get('/tax-rates/:id', controller.getTaxRate);
router.post('/tax-rates', controller.createTaxRate);
router.put('/tax-rates/:id', controller.updateTaxRate);
router.delete('/tax-rates/:id', controller.deleteTaxRate);
// История ставок
router.get('/tax-rates/history', controller.getTaxRatesHistory);

// ============================================================
// МЕТОДЫ РАСПРЕДЕЛЕНИЯ
// ============================================================
router.get('/allocation-methods', controller.getAllocationMethods);
router.post('/allocation-methods', controller.createAllocationMethod);
router.delete('/allocation-methods/:id', controller.deleteAllocationMethod);

// ============================================================
// СТАТЬИ НАКЛАДНЫХ РАСХОДОВ
// ============================================================
router.get('/overhead-articles', controller.getOverheadArticles);
router.post('/overhead-articles', controller.createOverheadArticle);
router.put('/overhead-articles/:id', controller.updateOverheadArticle);
router.delete('/overhead-articles/:id', controller.deleteOverheadArticle);

// ============================================================
// НАСТРОЙКИ ПО УМОЛЧАНИЮ
// ============================================================
router.get('/defaults', controller.getDefaultsSettings);
router.put('/defaults', controller.updateDefaultsSettings);

module.exports = router;
