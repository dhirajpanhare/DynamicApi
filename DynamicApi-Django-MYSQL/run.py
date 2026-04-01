#!/usr/bin/env python
"""
Django development server startup script with logging
Shows API endpoints and Swagger URL on startup
"""
import os
import sys
import logging

def main():
    """Run development server with startup messages"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    
    try:
        from django.core.management import execute_from_command_line
        from django.conf import settings
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Print startup information
    print("\n" + "="*60)
    print("  Django Dynamic API - Starting Development Server")
    print("="*60)
    print(f"[STARTUP] Environment: {os.environ.get('DJANGO_SETTINGS_MODULE', 'development')}")
    print(f"[STARTUP] DEBUG: {settings.DEBUG}")
    print(f"[STARTUP] ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"[STARTUP] CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}")
    print()
    print("[STARTUP] API Endpoints:")
    print("  - Swagger UI: http://localhost:8000/api/docs/swagger/")
    print("  - ReDoc: http://localhost:8000/api/docs/redoc/")
    print("  - OpenAPI Schema: http://localhost:8000/api/schema/")
    print("  - API Endpoint: http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute")
    print()
    print("[STARTUP] Running on: http://localhost:8000")
    print("[STARTUP] Press CTRL+C to stop the server")
    print("="*60 + "\n")
    
    # Run the development server
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])


if __name__ == '__main__':
    main()
