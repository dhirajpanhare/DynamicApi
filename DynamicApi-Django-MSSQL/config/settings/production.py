"""
Production settings for dynamic_api project.
Extends base settings with production-specific security and optimization.
"""
from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# Security Settings
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "'unsafe-inline'"),
    'style-src': ("'self'", "'unsafe-inline'"),
}

# Database - Production MSSQL
# Support both PROD_ prefixed variables (for production) and DB_ variables (for backward compatibility)
DATABASES = {
    'default': {
        'ENGINE': 'sqlserver_pymssql',
        'NAME': config('PROD_DB_NAME', default=config('DB_NAME')),
        'USER': config('PROD_DB_USER', default=config('DB_USER')),
        'PASSWORD': config('PROD_DB_PASSWORD', default=config('DB_PASSWORD')),
        'HOST': config('PROD_DB_HOST', default=config('DB_HOST')),
        'PORT': config('PROD_DB_PORT', default=config('DB_PORT', default='1433')),
        'OPTIONS': {
            'tds_version': '7.3',
        },
        'CONN_MAX_AGE': 600,
        'ATOMIC_REQUESTS': True,
    }
}

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Reduced logging in production
LOGGING['loggers']['apps']['level'] = 'WARNING'
