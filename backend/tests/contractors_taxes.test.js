const test = require('node:test');
const assert = require('node:assert');
const db = require('../db');
const legalFormService = require('../modules/contractors/services/legalFormService');
const contractorTaxService = require('../modules/contractors/services/contractorTaxService');
const ContractorTaxValidator = require('../modules/contractors/validators/ContractorTaxValidator');

test('Contractors & Taxes Logic', async (t) => {
  let testContractorId;

  // Setup: Create a test contractor
  const contractorRes = await db.query(
    "INSERT INTO contractors (name, legal_form, inn) VALUES ($1, $2, $3) RETURNING id",
    ['Test Contractor NANO', 'nano', '9999999999']
  );
  testContractorId = contractorRes.rows[0].id;

  await t.test('legalFormService.getTaxRegimesMapping should return available regimes for nano', async () => {
    // 1. Check if mapping for nano works (handles case insensitivity and groups)
    const mapping = await legalFormService.getTaxRegimesMapping('nano');
    
    assert.ok(mapping, 'Mapping should be returned');
    assert.ok(mapping.form, 'Form should be defined');
    assert.strictEqual(mapping.form.code, 'nano', 'Form code should be nano');
    assert.strictEqual(mapping.form.groupId, 'legal', 'Form group should be legal');
    
    // NANO should have access to the same regimes as OOO/AO (e.g., OSN, USN)
    assert.ok(Array.isArray(mapping.availableRegimes), 'availableRegimes should be an array');
    assert.ok(mapping.availableRegimes.length > 0, 'Should have available regimes for nano');
    
    const hasOSN = mapping.availableRegimes.some(r => r.code === 'OSN');
    assert.ok(hasOSN, 'OSN should be available for nano');
  });

  await t.test('contractorTaxService.setTaxRegime should update tax regime and write to history', async () => {
    // We need to find the ID of OSN tax regime
    const osnRes = await db.query("SELECT id FROM finance_tax_regimes WHERE code = 'OSN' LIMIT 1");
    assert.ok(osnRes.rows.length > 0, 'OSN regime should exist in database');
    const osnId = osnRes.rows[0].id;

    // Call setTaxRegime
    const reason = 'Moved to OSN manually';
    await contractorTaxService.setTaxRegime(testContractorId, osnId, { reason, changedBy: 2 });

    // Verify it updated the contractor
    const updatedContractorRes = await db.query("SELECT tax_regime_id FROM contractors WHERE id = $1", [testContractorId]);
    assert.strictEqual(updatedContractorRes.rows[0].taxRegimeId, osnId, 'Contractor should be updated with new tax regime');

    // Verify it wrote to contractor_tax_history
    const historyRes = await db.query("SELECT * FROM contractor_tax_history WHERE contractor_id = $1 ORDER BY created_at DESC LIMIT 1", [testContractorId]);
    assert.strictEqual(historyRes.rows.length, 1, 'History record should be created');
    
    const historyEntry = historyRes.rows[0];
    assert.strictEqual(historyEntry.taxRegimeId, osnId, 'History should record the new tax regime');
    assert.strictEqual(historyEntry.changeReason, reason, 'History should record the change reason');
    assert.strictEqual(historyEntry.changedByUserId, 2, 'History should record the user ID');
  });

  await t.test('ContractorTaxValidator.validateRegimeChange should work without db.getContractor error', async () => {
    const osnRes = await db.query("SELECT id FROM finance_tax_regimes WHERE code = 'OSN' LIMIT 1");
    const osnId = osnRes.rows[0].id;
    
    // Call validateRegimeChange (this used to crash due to db.getContractor missing)
    const validationResult = await ContractorTaxValidator.validateRegimeChange(testContractorId, osnId);
    
    // Should be valid or at least return an object without throwing an exception
    assert.ok(validationResult !== undefined, 'Validation result should not be undefined');
    assert.ok(typeof validationResult.valid === 'boolean', 'Validation result should contain boolean valid property');
  });

  // Cleanup
  await db.query("DELETE FROM contractor_tax_history WHERE contractor_id = $1", [testContractorId]);
  await db.query("DELETE FROM contractors WHERE id = $1", [testContractorId]);
});
