/**
 * Authentication Routes
 * Handles OTP sending and verification
 */

const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');
const logger = require('../utils/logger');

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!global.otpStorage) {
      global.otpStorage = {};
    }

    const expiryTime = Date.now() + 10 * 60 * 1000;
    global.otpStorage[email] = {
      code: otp,
      expiresAt: expiryTime,
      attempts: 0,
    };

    const emailResult = await sendOTPEmail(email, otp, 10);

    if (emailResult.success) {
      logger.info(`[OTP] Generated for ${email}: ${otp} (expires at ${new Date(expiryTime).toISOString()})`);

      return res.json({
        success: true,
        message: 'OTP sent successfully. Check your email.',
        data: {
          messageId: emailResult.messageId,
          email: email,
          expiresIn: 600,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailResult.error,
      });
    }
  } catch (error) {
    logger.error('[OTP Send Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending OTP',
      error: error.message,
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    if (!global.otpStorage || !global.otpStorage[email]) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new one.',
      });
    }

    const storedOTP = global.otpStorage[email];

    if (Date.now() > storedOTP.expiresAt) {
      delete global.otpStorage[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (storedOTP.attempts >= 5) {
      delete global.otpStorage[email];
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new OTP.',
      });
    }

    if (storedOTP.code !== otp.toString()) {
      storedOTP.attempts += 1;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - storedOTP.attempts,
      });
    }

    delete global.otpStorage[email];
    const userId = `user_${Date.now()}`;

    logger.info(`[OTP Verified] User ${email} authenticated successfully`);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        userId: userId,
        email: email,
        authenticatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[OTP Verification Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP',
      error: error.message,
    });
  }
});

module.exports = router;
