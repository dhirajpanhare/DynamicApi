"""
Django base settings for dynamic_api project.
Common settings used across all environments.
"""
from pathlib import Path
from decouple import config
import os

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY
SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-dev-key-change-in-production')

# Application definition
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
    'dynamic_api_app',
    'apps.common',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# Swagger/OpenAPI Configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'Dynamic API',
    'DESCRIPTION': 'A flexible RESTful API for executing stored procedures dynamically',
    'VERSION': '1.0.0',
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
    'SERVE_AUTHENTICATION': None,
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
    ],
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ORIGINS',
    default='http://localhost:3000,http://localhost:5173,http://localhost:4200,http://localhost:5173,http://localhost:8000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

CORS_ALLOW_CREDENTIALS = True

# JWT Configuration
JWT_SECRET = config('JWT_SECRET', default='your-secret-key-change-in-production')
JWT_ALGORITHM = config('JWT_ALGORITHM', default='HS256')
JWT_EXPIRATION_HOURS = config('JWT_EXPIRATION_HOURS', default=24, cast=int)

# ─────────────────────────────────────────────────────────────────────────────
# Authentication Mode
# ─────────────────────────────────────────────────────────────────────────────
# AUTH_MODE controls authentication strategy:
#   none    — No authentication (development / internal networks)
#   token   — Static token(s) via STATIC_TOKENS
#   jwt     — JWT from external auth API(s) via JWT_SECRETS
#   hybrid  — Both static tokens AND JWTs (migration phase)
AUTH_MODE = config('AUTH_MODE', default='none')

# Comma-separated static tokens. Clients send: Authorization: Bearer <token>
# Generate: python -c "import secrets; print(secrets.token_hex(32))"
# Remove once all clients switch to JWT.
STATIC_TOKENS = config('STATIC_TOKENS', default='')

# Comma-separated JWT secrets from external auth APIs.
# Dynamic API NEVER generates tokens — it only validates them.
# Add one secret per project that has its own auth API.
JWT_SECRETS = config('JWT_SECRETS', default='')

# External auth service URL (optional — takes priority over AUTH_MODE)
# If set, every token is forwarded to this URL for validation.
# POST with Authorization: Bearer <token> → expects { "status": true|false }
AUTH_SERVICE_URL = config('AUTH_SERVICE_URL', default='')

DB_CONNECTION_TIMEOUT = config('DB_CONNECTION_TIMEOUT', default=30, cast=int)
DB_COMMAND_TIMEOUT = config('DB_COMMAND_TIMEOUT', default=300, cast=int)

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'api.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
        },
        'apps': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

# API Configuration
API_VERSION = 'v1.0'

# ─────────────────────────────────────────────────────────────────────────────
# Email Configuration
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='dhirajpanhare08@gmail.com')
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='dhirajpanhare08@gmail.com')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
