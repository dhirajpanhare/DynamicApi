"""
Authentication for Dynamic API.

Priority order:

  1. AUTH_SERVICE_URL (highest priority)
     If set, every token is forwarded to that external auth endpoint.
     Dynamic API sends POST to AUTH_SERVICE_URL with Authorization: Bearer <token>.
     Expected response: { "status": true|false, "message": "..." }
     HTTP 200 + status:true  â†’ allow
     Anything else           â†’ deny
     Use this when a project has its own auth API â€” no secrets needed here.

  2. AUTH_MODE (fallback when AUTH_SERVICE_URL is not set)

     none    â€” No authentication (development / internal networks).
     token   â€” Static token(s) via STATIC_TOKENS.
     jwt     â€” JWT from external auth API(s) via JWT_SECRETS.
     hybrid  â€” Both static tokens AND JWTs (migration phase).

Migration path:
  1. AUTH_MODE=token        â†’ hand out a static token, up and running instantly
  2. AUTH_SERVICE_URL=<url> â†’ delegate to the project's own auth API
  3. AUTH_MODE=jwt          â†’ validate JWT locally with shared secret
"""
import jwt
import logging
import functools
import requests as http_requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework.authentication import BaseAuthentication


logger = logging.getLogger(__name__)

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Internal helpers
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _extract_bearer_token(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        return auth_header[len('Bearer '):].strip()
    return None


def _is_valid_static_token(token):
    raw = getattr(settings, 'STATIC_TOKENS', '')
    if not raw:
        return False
    return token in [t.strip() for t in raw.split(',') if t.strip()]


def _verify_jwt(token):
    algorithm = getattr(settings, 'JWT_ALGORITHM', 'HS256')
    raw = getattr(settings, 'JWT_SECRETS', '') or getattr(settings, 'JWT_SECRET', '')
    secrets = [s.strip() for s in raw.split(',') if s.strip()]
    for secret in secrets:
        try:
            return jwt.decode(token, secret, algorithms=[algorithm])
        except jwt.InvalidTokenError:
            continue
    return None


def _call_auth_service(token):
    """
    Forward the Bearer token to AUTH_SERVICE_URL via POST.
    Returns True if service responds HTTP 200 + { "status": true }.
    Returns False on rejection, error, or timeout.
    Returns None if AUTH_SERVICE_URL is not configured.
    """
    service_url = getattr(settings, 'AUTH_SERVICE_URL', '') or ''
    if not service_url.strip():
        return None  # not configured â€” skip

    try:
        response = http_requests.post(
            service_url,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            },
            json={},
            timeout=5
        )
        if response.status_code == 200:
            body = response.json()
            return body.get('status') is True
        return False
    except http_requests.exceptions.Timeout:
        logger.warning(f'AUTH | Auth service timed out: {service_url}')
        return False
    except Exception as e:
        logger.error(f'AUTH | Auth service error: {e}')
        return False


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# require_auth decorator
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def require_auth(view_func):
    """
    View decorator that enforces authentication based on AUTH_SERVICE_URL / AUTH_MODE.
    Apply to any view function that should be protected.
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):

        # â”€â”€ 1. External auth service (highest priority) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        #    If AUTH_SERVICE_URL is set, delegate validation to that service.
        service_url = getattr(settings, 'AUTH_SERVICE_URL', '') or ''
        if service_url.strip():
            token = _extract_bearer_token(request)
            if not token:
                return JsonResponse(
                    {'status': False, 'message': 'Authorization header with Bearer token required', 'data': None},
                    status=401
                )
            result = _call_auth_service(token)
            if result is True:
                return view_func(request, *args, **kwargs)
            logger.warning(f"AUTH | Auth service rejected token | IP:{request.META.get('REMOTE_ADDR')}")
            return JsonResponse({'status': False, 'message': 'Invalid or expired token', 'data': None}, status=403)

        # â”€â”€ 2. AUTH_MODE fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        mode = getattr(settings, 'AUTH_MODE', 'none').strip().lower()

        if mode == 'none':
            return view_func(request, *args, **kwargs)

        token = _extract_bearer_token(request)
        if not token:
            return JsonResponse(
                {'status': False, 'message': 'Authorization header with Bearer token required', 'data': None},
                status=401
            )

        if mode == 'token':
            if _is_valid_static_token(token):
                return view_func(request, *args, **kwargs)
            logger.warning(f"AUTH | Invalid static token | IP:{request.META.get('REMOTE_ADDR')}")
            return JsonResponse({'status': False, 'message': 'Invalid token', 'data': None}, status=403)

        if mode == 'jwt':
            payload = _verify_jwt(token)
            if payload is not None:
                request.auth_payload = payload
                return view_func(request, *args, **kwargs)
            logger.warning(f"AUTH | Invalid JWT | IP:{request.META.get('REMOTE_ADDR')}")
            return JsonResponse({'status': False, 'message': 'Invalid or expired token', 'data': None}, status=403)

        if mode == 'hybrid':
            if _is_valid_static_token(token):
                return view_func(request, *args, **kwargs)
            payload = _verify_jwt(token)
            if payload is not None:
                request.auth_payload = payload
                return view_func(request, *args, **kwargs)
            logger.warning(f"AUTH | Invalid hybrid auth | IP:{request.META.get('REMOTE_ADDR')}")
            return JsonResponse({'status': False, 'message': 'Invalid or expired token', 'data': None}, status=403)

        logger.error(f"AUTH | Unknown AUTH_MODE value: '{mode}'")
        return JsonResponse({'status': False, 'message': 'Server authentication misconfiguration', 'data': None}, status=500)

    return wrapper


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# DRF-compatible authentication class (kept for compatibility)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        return None
