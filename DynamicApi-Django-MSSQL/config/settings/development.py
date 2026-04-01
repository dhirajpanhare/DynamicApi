"""
Development settings for dynamic_api project.
Extends base settings with development-specific configuration.
"""
from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Database - MSSQL for development
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': config('DB_NAME', default='DynamicApiDb'),
        'USER': config('DB_USER', default='sa'),
        'PASSWORD': config('DB_PASSWORD', default='YourPassword123!'),
        'HOST': config('DB_HOST', default='127.0.0.1'),
        'PORT': config('DB_PORT', default='1433'),
        'OPTIONS': {
            'driver': config('DB_DRIVER', default='ODBC Driver 17 for SQL Server'),
            'TrustServerCertificate': 'yes',
        },
        'CONN_MAX_AGE': 600,
    }
}

# Extended logging in development
LOGGING['loggers']['apps']['level'] = 'DEBUG'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
}
