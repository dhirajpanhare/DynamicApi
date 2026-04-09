"""
OTP Authentication Views for Django
Handles OTP generation, sending, and verification
"""

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
import logging
import re
from datetime import datetime, timedelta
from .email_service import send_otp_email, initialize_email_service

logger = logging.getLogger(__name__)

# Global OTP storage (in production, use database or cache)
otp_storage = {}


def validate_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None


@csrf_exempt
@require_http_methods(["POST"])
def send_otp(request):
    """
    Generate and send OTP to email
    
    POST /api/v1.0/auth/send-otp
    {
        "email": "user@example.com"
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        
        # Validate email
        if not email or not validate_email(email):
            return JsonResponse({
                'success': False,
                'message': 'Invalid email address'
            }, status=400)
        
        # Generate 6-digit OTP
        import random
        otp = str(random.randint(100000, 999999))
        
        # Store OTP with expiry (10 minutes)
        expiry_time = datetime.now() + timedelta(minutes=10)
        otp_storage[email] = {
            'code': otp,
            'expires_at': expiry_time,
            'attempts': 0
        }
        
        # Send OTP email
        email_result = send_otp_email(email, otp, 10)
        
        if email_result['success']:
            logger.info(f'[OTP] Generated for {email}: {otp} (expires at {expiry_time.isoformat()})')
            
            return JsonResponse({
                'success': True,
                'message': 'OTP sent successfully. Check your email.',
                'data': {
                    'email': email,
                    'expiresIn': 600  # seconds
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Failed to send OTP email',
                'error': email_result.get('message', 'Unknown error')
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON format'
        }, status=400)
    except Exception as error:
        logger.error(f'[OTP Send Error] {str(error)}')
        return JsonResponse({
            'success': False,
            'message': 'Server error while sending OTP',
            'error': str(error)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def verify_otp(request):
    """
    Verify OTP code
    
    POST /api/v1.0/auth/verify-otp
    {
        "email": "user@example.com",
        "otp": "123456"
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        otp = data.get('otp', '').strip()
        
        if not email or not otp:
            return JsonResponse({
                'success': False,
                'message': 'Email and OTP are required'
            }, status=400)
        
        # Check if OTP exists
        if email not in otp_storage:
            return JsonResponse({
                'success': False,
                'message': 'OTP not found. Please request a new one.'
            }, status=400)
        
        stored_otp = otp_storage[email]
        
        # Check expiry
        if datetime.now() > stored_otp['expires_at']:
            del otp_storage[email]
            return JsonResponse({
                'success': False,
                'message': 'OTP has expired. Please request a new one.'
            }, status=400)
        
        # Check attempts
        if stored_otp['attempts'] >= 5:
            del otp_storage[email]
            return JsonResponse({
                'success': False,
                'message': 'Too many invalid attempts. Please request a new OTP.'
            }, status=400)
        
        # Verify OTP
        if stored_otp['code'] != otp:
            stored_otp['attempts'] += 1
            return JsonResponse({
                'success': False,
                'message': 'Invalid OTP. Please try again.',
                'attemptsRemaining': 5 - stored_otp['attempts']
            }, status=400)
        
        # OTP verified successfully
        del otp_storage[email]
        user_id = f"user_{int(datetime.now().timestamp() * 1000)}"
        
        logger.info(f'[OTP Verified] User {email} authenticated successfully')
        
        return JsonResponse({
            'success': True,
            'message': 'OTP verified successfully',
            'data': {
                'userId': user_id,
                'email': email,
                'authenticatedAt': datetime.now().isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON format'
        }, status=400)
    except Exception as error:
        logger.error(f'[OTP Verification Error] {str(error)}')
        return JsonResponse({
            'success': False,
            'message': 'Server error while verifying OTP',
            'error': str(error)
        }, status=500)
