const { renderEmail } = require('../utils/emailRenderer');
const { WelcomeEmail } = require('../../../emails/templates/WelcomeEmail');
const transporter = require('../utils/nodemailerConfig');
const logger = require('../../../utils/logger');

/**
 * Sends a welcome email to the specified user.
 * @param {string} to - The recipient's email address
 * @param {string} userName - The recipient's name
 */
async function sendWelcomeEmail(to, userName) {
  try {
    const emailHtml = await renderEmail(WelcomeEmail, {
      userName,
      logoUrl: process.env.COMPANY_LOGO_URL
    });

    const info = await transporter.sendMail({
      from: `"Titan CRM" <noreply@${process.env.SMTP_DOMAIN || 'example.com'}>`,
      to,
      subject: 'Welcome to Titan CRM!',
      html: emailHtml,
    });

    logger.info(`Welcome email sent to ${to}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending welcome email:', error.message);
    throw error;
  }
}

module.exports = {
  sendWelcomeEmail
};
