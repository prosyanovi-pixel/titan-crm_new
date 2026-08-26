const test = require('node:test');
const assert = require('node:assert');

const contractMutations = require('../modules/contracts/services/contractMutations');

test('contractMutations helper', async (t) => {
  await t.test('deleteContract deletes and audits when user is present', async () => {
    let auditCount = 0;
    const db = {
      query: async (sql) => {
        if (sql.startsWith('SELECT * FROM contracts')) return { rows: [{ id: 'c1' }] };
        return { rows: [] };
      },
    };

    const result = await contractMutations.deleteContract({
      db,
      logger: { info: () => {} },
      AppError: class extends Error {},
      contractId: 'c1',
      userId: 'u1',
      logAudit: async () => { auditCount += 1; },
    });

    assert.deepStrictEqual(result, { success: true });
    assert.strictEqual(auditCount, 1);
  });

  await t.test('bulkUpdateStatus updates and returns success', async () => {
    let auditCount = 0;
    const db = {
      query: async (sql) => {
        if (sql.startsWith('UPDATE contracts')) return { rows: [{ id: 'c1' }, { id: 'c2' }] };
        return { rows: [] };
      },
    };

    const result = await contractMutations.bulkUpdateStatus({
      db,
      logger: { info: () => {} },
      AppError: class extends Error {},
      userId: 'u1',
      contractIds: ['c1', 'c2'],
      newStatus: 'active',
      logAudit: async () => { auditCount += 1; },
    });

    assert.deepStrictEqual(result, { success: true });
    assert.strictEqual(auditCount, 2);
  });

  await t.test('getContractMetrics returns parsed counts', async () => {
    const db = {
      query: async (sql) => {
        if (sql.includes("pending_approval")) return { rows: [{ count: '7' }] };
        return { rows: [{ count: '3' }] };
      },
    };

    const result = await contractMutations.getContractMetrics({ db });

    assert.deepStrictEqual(result, { pendingApprovalsCount: 7, expiringSoonCount: 3 });
  });
});