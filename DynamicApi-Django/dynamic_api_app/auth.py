"""
JWT authentication and token handling for Dynamic API.
"""
import jwt
import logging
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


logger = logging.getLogger(__name__)


class JWTTokenGenerator:
    """Generate and validate JWT tokens"""
    
    @staticmethod
    def generate_token(contact_id, email, role='User', hours=None):
        """
        Generate JWT token for user authentication
        
        Args:
            contact_id: User contact ID
            email: User email
            role: User role (default: 'User')
            hours: Token expiration hours (uses Django setting if not provided)
        
        Returns:
            JWT token string
        """
        if hours is None:
            hours = settings.JWT_EXPIRATION_HOURS
        
        payload = {
            'contactId': contact_id,
            'sub': email,
            'role': role,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=hours)
        }
        
        token = jwt.encode(
            payload,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        
        logger.info(f"Token generated for user: {email}")
        return token
    
    @staticmethod
    def validate_token(token):
        """
        Validate JWT token and return payload
        
        Args:
            token: JWT token string
        
        Returns:
            Decoded payload dictionary
        
        Raises:
            jwt.InvalidTokenError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            raise jwt.InvalidTokenError("Token has expired")
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            raise


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication for Django REST Framework.
    Currently disabled - authentication not enforced.
    """
    
    def authenticate(self, request):
        """
        Authenticate request using JWT token in Authorization header.
        
        Returns:
            Tuple of (user, token) or None if no authentication provided
        """
        # Authentication is currently disabled
        # To enable, uncomment the code below and update REST_FRAMEWORK settings
        
        # auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        # if not auth_header:
        #     return None
        
        # try:
        #     auth_type, token = auth_header.split()
        #     if auth_type.lower() != 'bearer':
        #         return None
        #     
        #     payload = JWTTokenGenerator.validate_token(token)
        #     # Return authenticated user info
        #     return (payload, token)
        
        # except (ValueError, jwt.InvalidTokenError) as e:
        #     raise AuthenticationFailed(f"Invalid token: {str(e)}")
        
        # Allow all requests without authentication
        return None
