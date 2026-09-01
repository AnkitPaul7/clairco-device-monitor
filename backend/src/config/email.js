require('dotenv').config();

const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  from: process.env.EMAIL_FROM || 'clairco-monitor@clairco.com',
  recipient: process.env.ALERT_RECIPIENT || 'ops-team@clairco.com',
  recoveryEmailsEnabled: process.env.SEND_RECOVERY_EMAILS === 'true'
};

function validateEmailConfig(logger = console) {
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    logger.warn('Email credentials not configured. Email alerts will be disabled.');
    return false;
  }

  return true;
}

module.exports = {
  emailConfig,
  validateEmailConfig
};
