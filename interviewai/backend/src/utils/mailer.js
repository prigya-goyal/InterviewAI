const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = require('../config/env');

/**
 * Sends an email using SMTP configurations.
 * If credentials are default/missing, it falls back to console logging.
 */
async function sendEmail({ to, subject, text, html }) {
  const isMock =
    !SMTP_USER ||
    SMTP_USER.includes('your_smtp_user') ||
    !SMTP_HOST ||
    SMTP_HOST.includes('example.com');

  if (isMock) {
    console.log(`\n=================== [MAILER MOCK] ===================`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:    ${text}`);
    console.log(`=====================================================\n`);
    return { mock: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log(`[mailer] Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[mailer] Error sending email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
