const test = require('node:test');
const assert = require('node:assert');

const contractVersions = require('../modules/contracts/services/contractVersions');

test('contractVersions helper', async (t) => {
  await t.test('createVersion increments the current version and stores JSON changes', async () => {
    const calls = [];
    const db = {
      query: async (sql, params) => {
        calls.push({ sql, params });

        if (sql.includes('MAX(version_number)')) {
          return { rows: [{ max_version: 2 }] };
        }

        if (sql.includes('INSERT INTO contract_versions')) {
          return { rows: [{ id: 'v-3', version_number: 3, name: params[2], content: params[3], changes: params[4], created_by: params[5] }] };
        }

        throw new Error(`Unexpected query: ${sql}`);
      },
    };
    const logger = { info: () => {} };

    const version = await contractVersions.createVersion({
      db,
      logger,
      contractId: 'c-1',
      userId: 'u-1',
      data: { name: 'Draft 2', content: '<p>hi</p>', changes: { title: ['a', 'b'] } },
    });

    assert.strictEqual(version.version_number, 3);
    assert.strictEqual(version.changes, JSON.stringify({ title: ['a', 'b'] }));
    assert.deepStrictEqual(calls[0].params, ['c-1']);
  });

  await t.test('getVersions returns rows in descending order', async () => {
    const db = {
      query: async () => ({ rows: [{ version_number: 2 }, { version_number: 1 }] }),
    };

    const versions = await contractVersions.getVersions({ db, contractId: 'c-1' });

    assert.deepStrictEqual(versions.map((item) => item.version_number), [2, 1]);
  });

  await t.test('revertToVersion creates a new version inside a transaction', async () => {
    const queries = [];
    const client = {
      query: async (sql, params) => {
        queries.push({ sql, params });

        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return;
        }

        if (sql.includes('WHERE id = $1 AND contract_id = $2')) {
          return { rows: [{ version_number: 4, content: '<p>old</p>' }] };
        }

        if (sql.includes('MAX(version_number)')) {
          return { rows: [{ max_version: 4 }] };
        }

        if (sql.includes('INSERT INTO contract_versions')) {
          return { rows: [] };
        }

        throw new Error(`Unexpected query: ${sql}`);
      },
      release: () => {},
    };
    const db = {
      getClient: async () => client,
    };
    const logger = { info: () => {} };
    class AppError extends Error {}

    const result = await contractVersions.revertToVersion({
      db,
      logger,
      AppError,
      contractId: 'c-1',
      versionId: 'v-4',
      userId: 'u-1',
    });

    assert.deepStrictEqual(result, { success: true, newVersion: 5 });
    assert.strictEqual(queries[0].sql, 'BEGIN');
    assert.strictEqual(queries.at(-1).sql, 'COMMIT');
  });
});