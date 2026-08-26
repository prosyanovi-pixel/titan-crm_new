/**
 * Конфигурация загрузчика файлов для модуля Legal Cases
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/legal-cases');

    // Создаём директорию если не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  },
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.png', '.jpg', '.jpeg', '.txt', '.zip', '.rar',
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла: ' + ext), false);
  }
};

// Экспорт настроенного загрузчика
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB лимит
  },
});

module.exports = upload;
