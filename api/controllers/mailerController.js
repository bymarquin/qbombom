const { sendTemplateEmail } = require('../services/mailer');

const sendTestEmail = async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Recipient email (to) is required.' });
  }

  try {
    const result = await sendTemplateEmail(
      to,
      subject || 'Test Email - Qbombom',
      'test-email',
      {
        message: message || 'Este é um email de teste enviado via SMTP configurado no Qbombom.'
      }
    );

    return res.json({ success: true, message: 'Email sent successfully!', messageId: result.messageId });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({ error: 'Failed to send email. Check SMTP configuration.' });
  }
};

module.exports = {
  sendTestEmail,
};
