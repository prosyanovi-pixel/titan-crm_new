const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../utils/errorHandler');
const referencesController = require('./controllers/referencesController');

router.get('/currencies', asyncHandler(referencesController.getCurrencies));
router.post('/currencies', asyncHandler(referencesController.createCurrency));
router.put('/currencies/:id', asyncHandler(referencesController.updateCurrency));
router.delete('/currencies/:id', asyncHandler(referencesController.deleteCurrency));

router.get('/', asyncHandler(referencesController.getAllReferences));
router.post('/sync-modules', asyncHandler(referencesController.syncModules));

router.get('/legal_form_groups', asyncHandler(referencesController.getLegalFormGroups));
router.post('/legal_form_groups', asyncHandler(referencesController.createLegalFormGroup));
router.put('/legal_form_groups/:id', asyncHandler(referencesController.updateLegalFormGroup));
router.delete('/legal_form_groups/:id', asyncHandler(referencesController.deleteLegalFormGroup));

router.get('/positions', asyncHandler(referencesController.getPositions));

router.get('/legal_forms', asyncHandler(referencesController.getLegalForms));
router.post('/legal_forms', asyncHandler(referencesController.createLegalForm));
router.put('/legal_forms/:id', asyncHandler(referencesController.updateLegalForm));
router.delete('/legal_forms/:id', asyncHandler(referencesController.deleteLegalForm));

router.post('/:table', asyncHandler(referencesController.createGenericReference));
router.put('/:table/:id', asyncHandler(referencesController.updateGenericReference));
router.delete('/:table/:id', asyncHandler(referencesController.deleteGenericReference));

module.exports = router;