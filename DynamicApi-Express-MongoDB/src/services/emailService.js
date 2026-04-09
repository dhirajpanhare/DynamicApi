/**
 * Email Service
 * Handles sending emails via Nodemailer
 * Supports: Gmail, Mailgun, SendGrid, or any SMTP service
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Initialize email transporter based on environment configuration
 * Supports: GMAIL, MAILGUN, SENDGRID, or SMTP
 */
async function initializeEmailService() {
  const emailProvider = process.env.EMAIL_PROVIDER || 'GMAIL';

  try {
    switch (emailProvider.toUpperCase()) {
      case 'GMAIL':
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD, // Use app-specific password, not regular password
          },
        });
        logger.info('✓ Email service initialized with Gmail');
        break;

      case 'MAILGUN':
        transporter = nodemailer.createTransport({
          host: process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: process.env.MAILGUN_EMAIL,
            pass: process.env.MAILGUN_PASSWORD,
          },
        });
        logger.info('✓ Email service initialized with Mailgun');
        break;

      case 'SENDGRID':
        transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        logger.info('✓ Email service initialized with SendGrid');
        break;

      case 'SMTP':
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        logger.info('✓ Email service initialized with custom SMTP');
        break;

      default:
        logger.warn('⚠ Email provider not configured, using test mode');
        transporter = null;
        break;
    }

    // Test the connection
    if (transporter) {
      await transporter.verify();
      logger.info('✓ Email service connection verified');
    }
  } catch (error) {
    logger.error('✗ Failed to initialize email service:', error.message);
    transporter = null;
  }
}

/**
 * Send OTP email
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password
 * @param {number} expiryMinutes - OTP expiry time in minutes (default: 10)
 * @returns {Promise<Object>} - Send result { success: boolean, messageId?: string, error?: string }
 */
async function sendOTPEmail(email, otp, expiryMinutes = 10) {
  if (!transporter) {
    logger.warn(`⚠ Email service not configured. OTP for ${email}: ${otp}`);
    return {
      success: true,
      messageId: 'test-mode',
      note: 'Email service not configured. Check console logs.',
    };
  }

  try {
    const senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; background: #f5f6fa; border-radius: 8px; }
            .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 700; color: #667eea; margin-bottom: 10px; }
            .title { font-size: 24px; color: #2c3e50; margin: 0; }
            .message { color: #7f8c8d; font-size: 16px; line-height: 1.6; margin: 20px 0; }
            .otp-box { background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 6px; font-family: 'Courier New', monospace; }
            .expiry { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; color: #856404; font-size: 14px; margin: 20px 0; }
            .footer { color: #95a5a6; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #ecf0f1; padding-top: 20px; }
            .warning { color: #e74c3c; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">🔐</div>
                <h1 class="title">Verify Your Email</h1>
              </div>
              
              <p class="message">
                We received a request to verify your email address. Use the code below to complete your sign-in:
              </p>

              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #7f8c8d; font-size: 12px;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="expiry">
                <strong>⏱️ Expires in ${expiryMinutes} minutes</strong><br>
                This code will expire at ${new Date(Date.now() + expiryMinutes * 60000).toLocaleTimeString()}
              </div>

              <div class="message">
                <strong>Security Notice:</strong> Never share this code with anyone, including customer support staff.
              </div>

              <div class="footer">
                <p>If you didn't request this code, you can safely ignore this email.</p>
                <p style="margin-top: 10px;">© 2026 Dynamic API. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
      Verify Your Email
      
      Use this code to complete your sign-in: ${otp}
      
      This code expires in ${expiryMinutes} minutes.
      
      Security Notice: Never share this code with anyone.
      If you didn't request this code, you can safely ignore this email.
      
      © 2026 Dynamic API. All rights reserved.
    `;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: `Your OTP Code: ${otp}`,
      html: htmlContent,
      text: textContent,
    };

    const result = await transporter.sendMail(mailOptions);

    logger.info(`✓ OTP email sent to ${email} (Message ID: ${result.messageId})`);

    return {
      success: true,
      messageId: result.messageId,
      email: email,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`✗ Failed to send OTP email to ${email}:`, error.message);

    return {
      success: false,
      error: error.message,
      email: email,
    };
  }
}

/**
 * Send welcome email
 * @param {string} email - Recipient email address
 * @returns {Promise<Object>} - Send result
 */
async function sendWelcomeEmail(email) {
  if (!transporter) {
    logger.warn(`⚠ Email service not configured. Welcome email for ${email}`);
    return {
      success: true,
      messageId: 'test-mode',
    };
  }

  try {
    const senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: 'Welcome to Dynamic API',
      html: `
        <h2>Welcome!</h2>
        <p>Your account has been successfully created.</p>
        <p>You can now use Dynamic API to test and execute stored procedures across multiple backends.</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`✓ Welcome email sent to ${email}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    logger.error(`✗ Failed to send welcome email to ${email}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  initializeEmailService,
  sendOTPEmail,
  sendWelcomeEmail,
};
