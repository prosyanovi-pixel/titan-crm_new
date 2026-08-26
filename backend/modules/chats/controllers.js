const services = require('./services');

async function getChats(req, res, next) {
  try {
    const result = await services.getChats(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getChatMessages(req, res, next) {
  try {
    const messages = await services.getChatMessages(req.params.id, req.query);
    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    await services.markAsRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { text } = req.body;
    const userId = req.user ? req.user.id : 1; // fallback
    const message = await services.sendMessage(req.params.id, text, userId);
    res.json({ data: message });
  } catch (err) {
    next(err);
  }
}

async function createChat(req, res, next) {
  try {
    const { name, platform } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const chat = await services.createChat(name, platform);
    res.status(201).json({ data: chat });
  } catch (err) {
    next(err);
  }
}

async function editMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const userId = req.user ? req.user.id : 1;
    const message = await services.editMessage(req.params.id, req.params.messageId, text, userId);
    res.json({ data: message });
  } catch (err) {
    next(err);
  }
}

async function clearChatHistory(req, res, next) {
  try {
    await services.clearChatHistory(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteChat(req, res, next) {
  try {
    await services.deleteChat(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const chatDir = path.join(__dirname, '../../../uploads/chats');
    if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });
    cb(null, chatDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/chats/${req.file.filename}`;
    res.json({
      data: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getChats,
  getChatMessages,
  markAsRead,
  sendMessage,
  createChat,
  editMessage,
  clearChatHistory,
  deleteChat,
  upload,
  uploadFile
};
