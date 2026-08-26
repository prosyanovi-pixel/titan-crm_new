/**
 * Mail Module - Messages Controller
 * Получение, отправка, удаление, перемещение писем, bulk-операции
 */

const db = require('../../../db');
const { v4: uuidv4 } = require('uuid');
const mailSendService = require('../services/mailSendService');
const helpers = require('../utils/helpers');
const logger = require('../../../utils/logger');
const messagesDocuments = require('./messagesDocuments');
const messagesBulk = require('./messagesBulk');
const messagesMutations = require('./messagesMutations');
const messagesThread = require('./messagesThread');
const messagesRead = require('./messagesRead');
const messagesSend = require('./messagesSend');
const messagesList = require('./messagesList');

// ----- GET all mails (with FTS) -----

async function getAllMails(req, res) {
  return messagesList.getAllMails({ req, res, db, helpers });
}

// ----- GET mail by ID -----

async function getMailById(req, res) {
  return messagesRead.getMailById({ req, res, db, helpers });
}

// ----- SEND mail -----

async function sendMail(req, res) {
  return messagesSend.sendMail({ req, res, db, helpers, uuidv4, mailSendService });
}

// ----- MARK as read/unread -----

async function markRead(req, res) {
  return messagesMutations.markRead({ req, res, db, helpers });
}

// ----- TOGGLE star -----

async function toggleStar(req, res) {
  return messagesMutations.toggleStar({ req, res, db, helpers });
}
// ----- MOVE mail to folder -----

async function moveMail(req, res) {
  return messagesMutations.moveMail({ req, res, db, helpers, logger });
}

// ----- DELETE mail -----

async function deleteMail(req, res) {
  return messagesMutations.deleteMail({ req, res, db, helpers });
}

// ----- BULK mark read/unread -----

async function bulkRead(req, res) {
  return messagesBulk.bulkRead({ req, res, db, helpers });
}

// ----- BULK move -----

async function bulkMove(req, res) {
  return messagesBulk.bulkMove({ req, res, db, helpers, logger });
}

// ----- BULK delete -----

async function bulkDelete(req, res) {
  return messagesBulk.bulkDelete({ req, res, db, helpers, logger });
}

// ----- GET mail thread (related messages) -----

async function getMailThread(req, res) {
  return messagesThread.getMailThread({ req, res, db });
}
// ----- SAVE attachment to system Documents -----

async function saveToDocuments(req, res) {
  return messagesDocuments.saveToDocuments({ req, res, db, helpers, logger, uuidv4 });
}

// ----- CLEAR account mails from database -----

async function clearAccountMails(req, res) {
  return messagesDocuments.clearAccountMails({ req, res, db, helpers });
}

module.exports = {
  getAllMails,
  getMailById,
  sendMail,
  markRead,
  toggleStar,
  moveMail,
  deleteMail,
  bulkRead,
  bulkMove,
  bulkDelete,
  getMailThread,
  saveToDocuments,
  clearAccountMails,
};
