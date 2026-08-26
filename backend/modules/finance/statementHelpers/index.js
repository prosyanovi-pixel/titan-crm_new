/**
 * Главный файл модуля statementHelpers
 * Объединяет все подмодули
 * Файл: routes/finance/statementHelpers/index.js
 */

const { extractLegalForm, shortName, detectType } = require('./legalFormParser');
const { detectCategory } = require('./categoryDetector');
const { ContractorResult, upsertContractor } = require('./contractorProcessor');
const { generateImportReport, isOurAccount } = require('./reportGenerator');

module.exports = {
  // Legal form parsing
  extractLegalForm,
  shortName,
  detectType,
  
  // Category detection
  detectCategory,
  
  // Contractor processing
  ContractorResult,
  upsertContractor,
  
  // Report generation
  generateImportReport,
  isOurAccount,
};
