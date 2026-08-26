/**
 * Главный файл экспорта утилит модуля Legal Cases
 * Объединяет все вспомогательные функции
 */

const {
  pickFirstDefined,
  toNumber,
  cleanTextValue,
  cleanNumberValue,
  randSuffix,
} = require('./utils');

const { extractCasePayload } = require('./extractors');

const {
  ensureLegalCaseSupportTables,
} = require('./tableManager');

const {
  normalizeCaseCoreFields,
  normalizeNote,
} = require('./normalizers');

const {
  getCaseNotesInternalColumn,
  clearCaseNotesInternalColumnCache,
  hydrateFinancials,
  hydrateCaseRelations,
} = require('./relations');

module.exports = {
  // Utils
  pickFirstDefined,
  toNumber,
  cleanTextValue,
  cleanNumberValue,
  randSuffix,

  // Extractors
  extractCasePayload,

  // Table Manager
  ensureLegalCaseSupportTables,

  // Normalizers
  normalizeCaseCoreFields,
  normalizeNote,

  // Relations
  getCaseNotesInternalColumn,
  clearCaseNotesInternalColumnCache,
  hydrateFinancials,
  hydrateCaseRelations,
};
