const test = require('node:test');
const assert = require('node:assert');

const messagesList = require('../modules/mail/controllers/messagesList');

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

test('messagesList helper', async (t) => {
  await t.test('returns 401 without user id', async () => {
    const req = { get: () => null, query: {} };
    const res = createRes();

    await messagesList.getAllMails({ req, res, db: { query: async () => ({ rows: [] }) }, helpers: { applyActualAttachmentFlags: async () => [] } });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: 'User ID required' });
  });

  await t.test('returns mails from regular query', async () => {
    const req = { get: () => 'user-1', query: { limit: 10, offset: 0 } };
    const res = createRes();
    const db = {
      query: async (sql) => {
        if (sql.includes('SELECT COUNT(*) as total FROM mail')) return { rows: [{ total: '1' }] };
        return { rows: [{ id: 'mail-1' }] };
      },
    };
    const helpers = { applyActualAttachmentFlags: async () => [{ id: 'mail-1' }] };

    await messagesList.getAllMails({ req, res, db, helpers });

    assert.strictEqual(res.body.total, 1);
    assert.deepStrictEqual(res.body.mails, [{ id: 'mail-1' }]);
  });
});
