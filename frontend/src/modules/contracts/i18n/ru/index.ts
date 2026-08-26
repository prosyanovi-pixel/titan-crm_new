/**
 * Russian translations for Contracts module
 * Refactored to avoid double nesting and ensure t("contracts.*") works correctly.
 */
import { contracts, contract_sheet, contract } from './contracts';
import { contract_templates, contract_template_sheet } from './templates';
import { contract_approvals } from './approvals';
import { contract_versions } from './versions';
import { contract_files } from './files';
import { contract_cases } from './cases';

export const ru = {
  // Use properties from contracts.ts as the base (provides list, templates, toolbar, table, etc.)
  ...contracts,
  
  // Nested sub-objects
  sheet: contract_sheet,
  detail: contract,
  template_items: contract_templates, // rename to avoid collision if necessary, but contracts.templates is in contracts.ts
  template_sheet: contract_template_sheet,
  approvals: contract_approvals,
  versions: contract_versions,
  files: contract_files,
  cases: contract_cases,
};

// Export individual objects for direct use if needed
export {
  contracts,
  contract_sheet,
  contract,
  contract_templates,
  contract_template_sheet,
  contract_approvals,
  contract_versions,
  contract_files,
  contract_cases,
};
