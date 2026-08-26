const helpers = require('../../utils/helpers');

function buildAttachmentPath(accountId, folderId, mailId, originalName, mailInfo = null) {
  return helpers.buildAttachmentPath(accountId, folderId, mailId, originalName, mailInfo);
}

function resolveAttachmentPath(storedPath) {
  return helpers.resolveAttachmentPath(storedPath);
}

module.exports = { buildAttachmentPath, resolveAttachmentPath };
