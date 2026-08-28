const test = require('node:test');
const assert = require('node:assert/strict');

const { compareMigrationFilenames } = require('../scripts/migrationOrdering');

test('sorts migration files by numeric prefix instead of lexicographic order', () => {
  const files = [
    '100_add_project_stage_id_to_tasks.sql',
    '69_projects_finance_phase1.sql',
    '09_create_reference_tables.md',
    '2026-05-29-01-create-report-configs.sql',
    '67b_insert_legal_forms.sql',
  ];

  const sorted = [...files].sort(compareMigrationFilenames);

  assert.deepEqual(sorted, [
    '09_create_reference_tables.md',
    '67b_insert_legal_forms.sql',
    '69_projects_finance_phase1.sql',
    '100_add_project_stage_id_to_tasks.sql',
    '2026-05-29-01-create-report-configs.sql',
  ]);
});

test('uses filename comparison to stabilize ordering with identical numeric prefixes', () => {
  const files = [
    '100_mdm_contractors_refactoring.sql',
    '100_add_project_stage_id_to_tasks.sql',
  ];

  const sorted = [...files].sort(compareMigrationFilenames);

  assert.deepEqual(sorted, [
    '100_add_project_stage_id_to_tasks.sql',
    '100_mdm_contractors_refactoring.sql',
  ]);
});
