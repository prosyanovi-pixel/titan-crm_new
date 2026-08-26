const test = require('node:test');
const assert = require('node:assert');

const messagesBulk = require('../modules/mail/controllers/messagesBulk');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('messagesBulk helper', async (t) => {
  await t.test('bulkRead updates read state and counters', async () => {
    const calls = [];
    const req = {
      get: () => 'user-1',
      body: { mailIds: ['m1', 'm2'], isRead: true },
    };
    const res = createRes();
    const db = {
      query: async (sql) => {
        calls.push(sql);
        if (sql.includes('FROM mail m')) {
          return { rows: [{ id: 'm1', account_id: 'a1', folder_id: 'f1', imap_uid: '1', imap_folder_path: 'INBOX', folder_name: 'INBOX', folder_type: 'inbox' }] };
        }
        return { rows: [] };
      },
    };
    const helpers = {
      resolveImapBoxPath: () => 'INBOX',
      setFlagImap: async () => {},
      updateFolderCounters: async () => {},
    };

    await messagesBulk.bulkRead({ req, res, db, helpers });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { message: 'Mails updated' });
    assert.ok(calls.some((sql) => sql.startsWith('UPDATE mail SET read =')));
  });

  await t.test('bulkDelete validates input', async () => {
    const req = { get: () => 'user-1', body: { mailIds: [] } };
    const res = createRes();

    await messagesBulk.bulkDelete({ req, res, db: { query: async () => ({ rows: [] }) }, helpers: {}, logger: { error: () => {} } });

    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.body, { error: 'Mail IDs required' });
  });
});