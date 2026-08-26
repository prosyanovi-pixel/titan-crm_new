const logger = require('../../../../utils/logger');

async function fetchAttributes(imap, uids) {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch(uids, { struct: true });
    const attrs = new Map();
    fetch.on('message', (msg) => {
      msg.once('attributes', (a) => attrs.set(String(a.uid), a));
    });
    fetch.once('end', () => resolve(attrs));
    fetch.once('error', (err) => {
      logger.error('[IMAPHelpers] Error fetching attributes:', err.message);
      reject(err);
    });
  });
}

async function fetchMessageBuffers(imap, uids, fetchOptions) {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch(uids, fetchOptions || { bodies: [''], struct: true, markSeen: false });
    const messages = [];

    fetch.on('message', (msg) => {
      let msgUid = null;
      let msgFlags = [];
      const parts = new Map();

      msg.once('attributes', (attrs) => {
        msgUid = attrs.uid;
        msgFlags = attrs.flags || [];
      });

      msg.on('body', (stream, info) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.once('end', () => {
          parts.set(info.which, Buffer.concat(chunks));
        });
      });

      msg.once('end', () => {
        messages.push({ uid: msgUid, flags: msgFlags, parts });
      });
    });

    fetch.once('error', (err) => {
      logger.error('[IMAPHelpers] Fetch error:', err.message);
      reject(err);
    });

    fetch.once('end', () => resolve(messages));
  });
}

module.exports = { fetchAttributes, fetchMessageBuffers };
