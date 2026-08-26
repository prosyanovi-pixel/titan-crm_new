const test = require('node:test');
const assert = require('node:assert');

const contractPersistence = require('../modules/contracts/services/contractPersistence');

test('contractPersistence helper', async (t) => {
  await t.test('create inserts contract and initial version', async () => {
    const queries = [];
    const db = {
      query: async (sql) => {
        queries.push(sql);

        if (sql.includes('FROM contract_templates WHERE id = $1')) {
          return { rows: [{ description: 'template description', content: 'template content' }] };
        }

        if (sql.includes('INSERT INTO contracts')) {
          return { rows: [{ id: 'contract-1', name: 'New contract' }] };
        }

        return { rows: [] };
      },
    };

    let auditCount = 0;
    const result = await contractPersistence.create({
      db,
      logger: { info: () => {} },
      AppError: class extends Error {},
      generateNextNumber: async () => 'CN-1',
      userId: 'u1',
      data: { name: 'New contract', templateId: 'tpl-1', tags: ['t1'] },
      logAudit: async () => { auditCount += 1; },
    });

    assert.strictEqual(result.id, 'contract-1');
    assert.ok(queries.some((sql) => sql.includes('INSERT INTO contract_versions')));
    assert.strictEqual(auditCount, 1);
  });

  await t.test('update changes contract and logs audit', async () => {
    const queries = [];
    const db = {
      query: async (sql) => {
        queries.push(sql);

        if (sql.startsWith('SELECT * FROM contracts WHERE id = $1')) {
          return { rows: [{ id: 'contract-1', name: 'Old', contract_number: 'CN-1', status: 'draft' }] };
        }

        if (sql.startsWith('UPDATE contracts')) {
          return { rows: [{ id: 'contract-1', name: 'New', contract_number: 'CN-1', status: 'active' }] };
        }

        if (sql.startsWith('SELECT tag_id FROM contract_tags')) {
          return { rows: [{ tag_id: 't1' }] };
        }

        return { rows: [] };
      },
    };

    let auditCount = 0;
    const result = await contractPersistence.update({
      db,
      AppError: class extends Error {},
      contractId: 'contract-1',
      userId: 'u1',
      data: { name: 'New', status: 'active', tags: ['t1', 't2'] },
      logAudit: async () => { auditCount += 1; },
    });

    assert.strictEqual(result.id, 'contract-1');
    assert.ok(queries.some((sql) => sql.startsWith('UPDATE contracts')));
    assert.strictEqual(auditCount, 1);
  });
});