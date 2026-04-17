const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email via SMTP.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 * @returns {Promise<any>}
 */
const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"QbomBom" <no-reply@qbombom.com>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Compile template by replacing placeholders and send email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of the html file inside templates directory (without .html)
 * @param {object} variables - Key-value pairs to replace {{key}} in the template
 */
const sendTemplateEmail = async (to, subject, templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Replace all occurrences of {{key}} with the corresponding value
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
    }

    return await sendEmail(to, subject, htmlContent);
  } catch (error) {
    console.error(`Error sending template email [${templateName}]:`, error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
};
