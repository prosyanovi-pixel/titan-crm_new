const test = require('node:test');
const assert = require('node:assert');

const messagesRead = require('../modules/mail/controllers/messagesRead');

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

test('messagesRead helper', async (t) => {
  await t.test('getMailById loads attachments and marks mail read', async () => {
    const req = { get: () => 'user-1', params: { id: 'mail-1' } };
    const res = createRes();
    const queries = [];
    const db = {
      query: async (sql) => {
        queries.push(sql);
        if (sql.includes('FROM mail WHERE id = $1 AND user_id = $2')) {
          return {
            rows: [{ id: 'mail-1', messageId: 'msg-1', accountId: 'acc-1', folderId: 'folder-1', imapUid: 'uid-1' }],
          };
        }
        if (sql.includes('FROM mail_attachments WHERE mail_id = $1')) {
          return { rows: [{ id: 'att-1', filename: 'file.pdf' }] };
        }
        if (sql.includes('SELECT folder_name, folder_type, imap_folder_path FROM mail_folders')) {
          return { rows: [{ folder_name: 'Inbox', folder_type: 'inbox', imap_folder_path: 'INBOX' }] };
        }
        return { rows: [] };
      },
    };
    const helpers = {
      resolveImapBoxPath: () => 'INBOX',
      setFlagImap: async () => {},
    };

    await messagesRead.getMailById({ req, res, db, helpers });

    assert.strictEqual(res.body.id, 'mail-1');
    assert.deepStrictEqual(res.body.attachments, [{ id: 'att-1', filename: 'file.pdf' }]);
    assert.ok(queries.some((sql) => sql.includes('UPDATE mail SET read = TRUE')));
  });

  await t.test('getMailById requires a user id', async () => {
    const req = { get: () => null, params: { id: 'mail-1' } };
    const res = createRes();

    await messagesRead.getMailById({ req, res, db: { query: async () => ({ rows: [] }) }, helpers: { resolveImapBoxPath: () => 'INBOX', setFlagImap: async () => {} } });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: 'User ID required' });
  });
});