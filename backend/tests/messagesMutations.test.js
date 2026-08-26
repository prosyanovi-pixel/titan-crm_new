const test = require('node:test');
const assert = require('node:assert');

const messagesMutations = require('../modules/mail/controllers/messagesMutations');

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

test('messagesMutations helper', async (t) => {
  await t.test('markRead updates local state and returns the row', async () => {
    const req = { get: () => 'user-1', params: { id: 'mail-1' }, body: { isRead: true } };
    const res = createRes();
    const db = {
      query: async (sql) => {
        if (sql.includes('SELECT id, account_id, folder_id, imap_uid FROM mail')) {
          return { rows: [{ id: 'mail-1', account_id: 'acc-1', folder_id: 'folder-1', imap_uid: null }] };
        }
        if (sql.includes('UPDATE mail SET read =')) {
          return { rows: [{ id: 'mail-1', read: true }] };
        }
        return { rows: [{ folder_name: 'Inbox', folder_type: 'inbox', imap_folder_path: 'INBOX' }] };
      },
    };
    const helpers = {
      resolveImapBoxPath: () => 'INBOX',
      setFlagImap: async () => {},
      updateFolderCounters: async () => {},
    };

    await messagesMutations.markRead({ req, res, db, helpers });

    assert.deepStrictEqual(res.body, { id: 'mail-1', read: true });
  });

  await t.test('deleteMail rejects missing user id', async () => {
    const req = { get: () => null, params: { id: 'mail-1' } };
    const res = createRes();

    await messagesMutations.deleteMail({ req, res, db: { query: async () => ({ rows: [] }) }, helpers: { resolveImapBoxPath: () => 'INBOX', deleteFromImap: async () => {}, updateFolderCounters: async () => {} } });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: 'User ID required' });
  });
});