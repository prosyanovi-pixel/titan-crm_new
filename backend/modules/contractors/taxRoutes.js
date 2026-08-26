/**
 * Маршруты для налоговых операций контрагентов
 * Подключаются как подмаршруты к /api/contractors
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams чтобы получить :id из родительского роутера
const controller = require('./controllers/contractorTaxController');

// Эндпоинты для конкретного контрагента
router.get('/:id/taxes', controller.getContractorTaxes);
router.patch('/:id/tax-system', controller.updateContractorTaxSystem);
router.get('/:id/taxes/calculate', controller.calculateContractorTaxes);
router.get('/:id/taxes/history', controller.getContractorTaxHistory);
router.get('/:id/taxes/limits-check', controller.checkContractorTaxLimits);
router.get('/:id/taxes/optimization-suggestions', controller.getTaxOptimizationSuggestions);

// Общие эндпоинты для юридических форм
router.get('/legal-forms', controller.getLegalForms);
router.get('/legal-forms/:code/tax-regimes', controller.getLegalFormTaxRegimes);

module.exports = router;