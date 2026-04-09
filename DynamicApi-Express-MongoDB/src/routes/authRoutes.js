/**
 * Authentication Routes
 * Handles OTP sending and verification
 */

const express = require('express');
const router = express.Router();
const { sendOTPEmail } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/v1.0/auth/send-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Send OTP to Email
 *     description: Generate and send a 6-digit OTP to the specified email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Invalid email
 *       500:
 *         description: Server error
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in server memory (in production, use database or Redis)
    // For now, store in a simple object with expiry
    if (!global.otpStorage) {
      global.otpStorage = {};
    }

    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    global.otpStorage[email] = {
      code: otp,
      expiresAt: expiryTime,
      attempts: 0,
    };

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, 10);

    if (emailResult.success) {
      logger.info(`[OTP] Generated for ${email}: ${otp} (expires at ${new Date(expiryTime).toISOString()})`);

      return res.json({
        success: true,
        message: 'OTP sent successfully. Check your email.',
        data: {
          messageId: emailResult.messageId,
          email: email,
          expiresIn: 600, // seconds
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

/**
 * @swagger
 * /api/v1.0/auth/verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify OTP
 *     description: Verify the OTP code sent to the email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *             required:
 *               - email
 *               - otp
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // Get stored OTP
    if (!global.otpStorage || !global.otpStorage[email]) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new one.',
      });
    }

    const storedOTP = global.otpStorage[email];

    // Check expiry
    if (Date.now() > storedOTP.expiresAt) {
      delete global.otpStorage[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Check attempts (limit to 5 invalid attempts)
    if (storedOTP.attempts >= 5) {
      delete global.otpStorage[email];
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (storedOTP.code !== otp.toString()) {
      storedOTP.attempts += 1;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - storedOTP.attempts,
      });
    }

    // OTP verified successfully
    delete global.otpStorage[email];

    // Create user session data
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
