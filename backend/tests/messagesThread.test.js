const test = require('node:test');
const assert = require('node:assert');

const messagesThread = require('../modules/mail/controllers/messagesThread');

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

test('messagesThread helper', async (t) => {
  await t.test('getMailThread returns related messages', async () => {
    const req = { get: () => 'user-1', params: { id: 'mail-1' } };
    const res = createRes();
    const queries = [];
    const db = {
      query: async (sql) => {
        queries.push(sql);
        if (sql.includes('SELECT subject, senderemail, message_id')) {
          return {
            rows: [{ subject: 'Re: Topic', senderemail: 'alice@example.com', message_id: '<msg-1>', in_reply_to: '<msg-0>', references_header: '<msg-0> <msg-1>' }],
          };
        }
        return { rows: [{ id: 'mail-2' }] };
      },
    };

    await messagesThread.getMailThread({ req, res, db });

    assert.deepStrictEqual(res.body, [{ id: 'mail-2' }]);
    assert.ok(queries.length >= 2);
  });

  await t.test('getMailThread requires a user id', async () => {
    const req = { get: () => null, params: { id: 'mail-1' } };
    const res = createRes();

    await messagesThread.getMailThread({ req, res, db: { query: async () => ({ rows: [] }) } });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: 'User ID required' });
  });
});