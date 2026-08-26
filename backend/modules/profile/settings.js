/**
 * Profile Module Settings
 */

module.exports = {
  display: {
    showAvatar: true,
    showDepartment: true,
    showNickname: true,
  },
  features: {
    enableAvatarUpload: true,
    enablePasswordChange: true,
    enableTelegramIntegration: true,
    enableShareLinks: true,
    enableDocumentView: true,
  },
  avatar: {
    uploadDir: 'uploads/avatars',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
  defaults: {
    avatar: null,
  },
};
