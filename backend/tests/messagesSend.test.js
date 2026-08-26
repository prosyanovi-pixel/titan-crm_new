const test = require('node:test');
const assert = require('node:assert');

const messagesSend = require('../modules/mail/controllers/messagesSend');

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

test('messagesSend helper', async (t) => {
  await t.test('rejects missing accountId', async () => {
    const req = { get: () => 'user-1', body: {} };
    const res = createRes();

    await messagesSend.sendMail({
      req,
      res,
      db: { query: async () => ({ rows: [] }) },
      helpers: { getSentFolderId: async () => 'folder-1', getDraftsFolderId: async () => 'folder-2' },
      uuidv4: () => 'uuid-1',
      mailSendService: { queueMail: async () => ({ queueId: 'queue-1' }) },
    });

    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.body, { error: 'Missing required field: accountId' });
  });

  await t.test('creates draft without queueing', async () => {
    const req = { get: () => 'user-1', body: { accountId: 'acc-1', subject: 'Draft', saveToSent: false } };
    const res = createRes();
    let queueCalled = false;
    const db = {
      query: async (sql) => {
        if (sql.includes('SELECT * FROM mail_accounts')) {
          return { rows: [{ display_name: 'Sender', email: 'sender@example.com' }] };
        }
        return { rows: [] };
      },
    };

    await messagesSend.sendMail({
      req,
      res,
      db,
      helpers: { getSentFolderId: async () => 'folder-sent', getDraftsFolderId: async () => 'folder-draft' },
      uuidv4: () => 'uuid-1',
      mailSendService: { queueMail: async () => { queueCalled = true; return { queueId: 'queue-1' }; } },
    });

    assert.strictEqual(queueCalled, false);
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, { success: true, message: 'Черновик создан', mailId: 'mail_uuid-1' });
  });

  await t.test('queues sent mail', async () => {
    const req = { get: () => 'user-1', body: { accountId: 'acc-1', to: 'to@example.com', subject: 'Hello' } };
    const res = createRes();
    let queuePayload = null;
    const db = {
      query: async (sql) => {
        if (sql.includes('SELECT * FROM mail_accounts')) {
          return { rows: [{ display_name: 'Sender', email: 'sender@example.com' }] };
        }
        return { rows: [] };
      },
    };

    await messagesSend.sendMail({
      req,
      res,
      db,
      helpers: { getSentFolderId: async () => 'folder-sent', getDraftsFolderId: async () => 'folder-draft' },
      uuidv4: () => 'uuid-2',
      mailSendService: { queueMail: async (payload) => { queuePayload = payload; return { queueId: 'queue-1' }; } },
    });

    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, { success: true, message: 'Письмо поставлено в очередь на отправку', queueId: 'queue-1', mailId: 'mail_uuid-2' });
    assert.strictEqual(queuePayload.mailId, 'mail_uuid-2');
    assert.strictEqual(queuePayload.accountId, 'acc-1');
  });
});