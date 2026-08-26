const emailService = require('../services/systemMailService');

/**
 * Controller to handle sending transactional welcome emails.
 */
exports.sendWelcomeEmail = async (req, res) => {
  const { email, userName } = req.body;

  if (!email || !userName) {
    return res.status(400).json({ error: 'Email and userName are required' });
  }

  try {
    const result = await emailService.sendWelcomeEmail(email, userName);
    res.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
};

