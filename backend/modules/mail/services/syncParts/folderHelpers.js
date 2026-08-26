const { validateImapPath, validateFolderName } = require('../utils/fieldNormalizer');

async function openBox(imap, folderPath, readOnly = true) {
  const normalized = typeof folderPath === 'string' && folderPath.trim() !== '' ? folderPath : 'INBOX';
  return new Promise((resolve, reject) => {
    imap.openBox(normalized, readOnly, (err, box) => {
      if (err) return reject(err);
      resolve(box);
    });
  });
}

function resolveFolderPathFromMail(mail) {
  // Prefer explicit IMAP path, then stored imap_folder_path, then folder_name, fallback to INBOX
  const candidate = mail.imapFolderPath || mail.imap_folder_path || mail.folderPath || mail.imap_folder || mail.folder_name || mail.folderName || 'INBOX';
  // Validate basic shape
  try {
    // guard with validator if available
    if (validateImapPath && typeof validateImapPath === 'function') {
      const cleaned = validateImapPath(candidate);
      if (cleaned) return cleaned;
    }
  } catch (e) {
    // ignore and fallback
  }
  // Fallback to folder name normalization
  try {
    if (validateFolderName && typeof validateFolderName === 'function') {
      return validateFolderName(candidate);
    }
  } catch (e) {
    // ignore
  }
  return String(candidate || 'INBOX');
}

module.exports = {
  openBox,
  resolveFolderPathFromMail
};
