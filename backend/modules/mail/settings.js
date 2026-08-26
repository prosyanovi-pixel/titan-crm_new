/**
 * Mail Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 30,
    defaultSort: 'date',
    defaultView: 'list',
  },
  features: {
    enableFolders: true,
    enableLabels: true,
    enableStars: true,
    enableUnreadCount: true,
    enableSearch: true,
    enableFilters: true,
  },
  folders: {
    defaults: ['inbox', 'sent', 'drafts', 'spam', 'trash'],
  },
  defaults: {
    folder: 'inbox',
    read: false,
  },
  // Настройки хранения вложений
  attachmentStorage: {
    // "structured" — {accountId}/{folderId}/{mailId}/{uuid}_{name.ext}
    // "flat" — плоская структура без подпапок (legacy)
    mode: 'structured',
    // Максимальный размер одного вложения (25 MB)
    maxAttachmentSize: 25 * 1024 * 1024,
    // Сохранять оригинальное имя файла
    preserveOriginalName: true,
  },
};
