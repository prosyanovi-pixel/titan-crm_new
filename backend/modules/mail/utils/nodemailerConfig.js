const nodemailer = require('nodemailer');

// Global Nodemailer transporter for system/transactional emails
// This uses environment variables (e.g. SMTP_HOST) rather than user-specific mail_accounts in DB.

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: parseInt(process.env.SMTP_PORT, 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = transporter;
