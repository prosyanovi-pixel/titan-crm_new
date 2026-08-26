/**
 * Mail Module Configuration
 * Централизованная конфигурация для всех timeout и параметров
 */

module.exports = {
  // IMAP Connection Settings
  imap: {
    // Таймаут подключения к IMAP серверу (мс)
    connectTimeout: process.env.MAIL_IMAP_CONNECT_TIMEOUT || 30000,
    
    // Таймаут загрузки списка папок (мс) - увеличено для медленных серверов
    foldersTimeout: process.env.MAIL_IMAP_FOLDERS_TIMEOUT || 120000,
  },

  // Sync Settings
  sync: {
    // Максимальное количество писем за одну синхронизацию
    maxMessagesPerSync: process.env.MAIL_SYNC_MAX_MESSAGES || 1000,

    // Базовый таймаут синхронизации папки (мс) - УВЕЛИЧЕНО к 10 мин
    baseFolderSyncTimeout: process.env.MAIL_SYNC_BASE_FOLDER_TIMEOUT || 600000, // 10 min

    // Базовый таймаут загрузки писем (мс) - УВЕЛИЧЕНО к 15 мин
    baseFetchMessagesTimeout: process.env.MAIL_SYNC_BASE_FETCH_TIMEOUT || 900000, // 15 min

    // Дополнительный таймаут на 1000 писем для папки (мс) - УВЕЛИЧЕНО к 3 мин
    timeoutPer1000Emails: process.env.MAIL_SYNC_TIMEOUT_PER_1K || 180000, // 3 min

    // Дополнительный таймаут на 1000 писем для fetch (мс) - УВЕЛИЧЕНО к 5 мин
    fetchTimeoutPer1000Emails: process.env.MAIL_SYNC_FETCH_TIMEOUT_PER_1K || 300000, // 5 min
  },

  // Attachment Settings
  attachments: {
    // Максимальный размер вложения (bytes)
    maxSize: process.env.MAIL_ATTACHMENT_MAX_SIZE || 25 * 1024 * 1024, // 25MB
    
    // Папка для хранения вложений (relative to backend root)
    uploadDir: process.env.MAIL_ATTACHMENT_DIR || 'uploads/mail',

    // Шаблон для структуры папок внутри uploadDir. 
    // Доступные переменные: {folderName}, {date}, {subject}, {mailId}, {accountId}, {folderId}
    // По умолчанию: "название папки/YYYY-MM-DD тема [ID]"
    pathTemplate: process.env.MAIL_ATTACHMENT_PATH_TEMPLATE || '{folderName}/{date} {subject} [{mailId}]',
  },

  // Scheduler Settings
  scheduler: {
    // Интервал автоматической синхронизации (мс)
    autoSyncInterval: process.env.MAIL_AUTO_SYNC_INTERVAL || 5 * 60 * 1000, // 5 min
    
    // Интервал проверки новых писем (мс)
    checkNewInterval: process.env.MAIL_CHECK_NEW_INTERVAL || 1 * 60 * 1000, // 1 min
  },

  // Sync Mode
  // 'light' - только метаданные, вложения на запрос
  // 'heavy' - полная загрузка всех вложений
  syncMode: process.env.MAIL_SYNC_MODE || 'light',

  // Logging
  logging: {
    // Логировать детали разбора каждого письма
    logMessageProcessing: process.env.MAIL_LOG_MESSAGES === 'true',
    
    // Логировать детали IMAP операций
    logImapOperations: process.env.MAIL_LOG_IMAP === 'true',
  },
};
