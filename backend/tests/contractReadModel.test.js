const test = require('node:test');
const assert = require('node:assert');

const contractReadModel = require('../modules/contracts/services/contractReadModel');

test('contractReadModel helper', async (t) => {
  await t.test('getAll builds filters and pagination', async () => {
    const queries = [];
    const db = {
      query: async (sql, params) => {
        queries.push({ sql, params });

        if (sql.includes('COUNT(*)')) {
          return { rows: [{ count: '2' }] };
        }

        return { rows: [{ id: 'c1' }, { id: 'c2' }] };
      },
    };

    const result = await contractReadModel.getAll({
      db,
      options: {
        page: 2,
        limit: 10,
        status: 'draft',
        search: 'alpha',
        projectId: '5',
      },
    });

    assert.strictEqual(result.pagination.page, 2);
    assert.strictEqual(result.pagination.total, 2);
    assert.strictEqual(queries.length, 2);
    assert.ok(queries[0].sql.includes('count(*)') || queries[0].sql.includes('COUNT(*)'));
    assert.ok(queries[1].sql.includes('ORDER BY'));
  });

  await t.test('getById composes full contract payload', async () => {
    const db = {
      query: async (sql) => {
        if (sql.includes('totalInvoiced')) return { rows: [{ totalInvoiced: '10', totalPaid: '4' }] };
        if (sql.includes('finance_invoices')) return { rows: [{ id: 'i1' }] };
        if (sql.includes('finance_payments')) return { rows: [{ id: 'p1' }] };
        if (sql.includes('contract_versions')) return { rows: [{ version_number: 2 }] };
        if (sql.includes('contract_approvals')) return { rows: [{ id: 'a1' }] };
        if (sql.includes('contract_files')) return { rows: [{ id: 'f1' }] };
        if (sql.includes('contract_cases')) return { rows: [{ id: 'cc1' }] };
        if (sql.includes('contract_tags')) return { rows: [{ tag_id: 'tag-1' }] };
        if (sql.includes('FROM contracts c')) return { rows: [{ id: 'c1', name: 'Test' }] };
        return { rows: [] };
      },
    };

    class AppError extends Error {}

    const result = await contractReadModel.getById({ db, AppError, contractId: 'c1' });

    assert.strictEqual(result.id, 'c1');
    assert.deepStrictEqual(result.tags, ['tag-1']);
    assert.strictEqual(result.financeSummary.totalInvoiced, '10');
  });
});