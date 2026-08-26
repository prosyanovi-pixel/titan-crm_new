/**
 * Documents Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 50,
    defaultSort: 'date',
    defaultView: 'list',
  },
  features: {
    enableFolders: true,
    enableStarred: true,
    enableSharing: true,
    enableDownload: true,
    enableBulkDelete: true,
    enableBulkUpload: false,
    enableStatistics: true,
  },
  storage_config: {
    provider: 'local',
    local: {
      baseDir: ''
    },
    s3: {
      endpoint: '',
      region: 'us-east-1',
      bucket: '',
      accessKeyId: '',
      secretAccessKey: '',
      forcePathStyle: true
    }
  },
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ],
    allowAll: true, // Флаг для разрешения всех типов, если список пуст или явно разрешено
  },
  defaults: {
    view: 'list',
  },
};
