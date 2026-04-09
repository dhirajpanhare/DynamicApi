"""
Email Service for Django
Handles OTP generation and email sending using Django's email backend
"""

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
import logging
import os

logger = logging.getLogger(__name__)


def send_otp_email(email, otp, expiry_minutes=10):
    """
    Send OTP email to user
    
    Args:
        email: Recipient email address
        otp: One-time password (6-digit code)
        expiry_minutes: OTP expiry time in minutes (default: 10)
    
    Returns:
        dict: { 'success': bool, 'message': str, 'message_id': str }
    """
    try:
        from datetime import datetime, timedelta
        
        sender_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@dynamicapi.com')
        expiry_time = datetime.now() + timedelta(minutes=expiry_minutes)
        
        # HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }}
              .container {{ max-width: 500px; margin: 0 auto; padding: 20px; background: #f5f6fa; border-radius: 8px; }}
              .card {{ background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
              .header {{ text-align: center; margin-bottom: 30px; }}
              .logo {{ font-size: 28px; font-weight: 700; color: #667eea; margin-bottom: 10px; }}
              .title {{ font-size: 24px; color: #2c3e50; margin: 0; }}
              .message {{ color: #7f8c8d; font-size: 16px; line-height: 1.6; margin: 20px 0; }}
              .otp-box {{ background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }}
              .otp-code {{ font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 6px; font-family: 'Courier New', monospace; }}
              .expiry {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; color: #856404; font-size: 14px; margin: 20px 0; }}
              .footer {{ color: #95a5a6; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #ecf0f1; padding-top: 20px; }}
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
                  <div class="otp-code">{otp}</div>
                </div>
                <div class="expiry">
                  <strong>⏱️ Expires in {expiry_minutes} minutes</strong><br>
                  This code will expire at {expiry_time.strftime('%I:%M %p')}
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
        """
        
        plain_text = f"""
        Verify Your Email
        
        Use this code to complete your sign-in: {otp}
        
        This code expires in {expiry_minutes} minutes.
        
        Security Notice: Never share this code with anyone.
        If you didn't request this code, you can safely ignore this email.
        
        © 2026 Dynamic API. All rights reserved.
        """
        
        # Send email
        result = send_mail(
            subject=f'Your OTP Code: {otp}',
            message=plain_text,
            from_email=sender_email,
            recipient_list=[email],
            html_message=html_content,
            fail_silently=False,
        )
        
        logger.info(f'✓ OTP email sent to {email}')
        
        return {
            'success': True,
            'message': 'OTP sent successfully',
            'email': email
        }
        
    except Exception as error:
        logger.error(f'✗ Failed to send OTP email to {email}: {str(error)}')
        return {
            'success': False,
            'message': f'Failed to send email: {str(error)}',
            'email': email
        }


def initialize_email_service():
    """
    Initialize email service (validates settings)
    """
    try:
        # Check if email backend is configured
        email_backend = getattr(settings, 'EMAIL_BACKEND', None)
        
        if email_backend == 'django.core.mail.backends.console.EmailBackend':
            logger.warning('⚠ Email backend set to console (test mode)')
        elif email_backend == 'django.core.mail.backends.locmem.EmailBackend':
            logger.warning('⚠ Email backend set to in-memory (test mode)')
        else:
            logger.info('✓ Email service configured and ready')
            
    except Exception as error:
        logger.error(f'✗ Failed to initialize email service: {str(error)}')
