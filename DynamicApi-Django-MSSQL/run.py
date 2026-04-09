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
    
    # Get port from environment or use default (8000 for MSSQL backend)
    port = os.environ.get('DJANGO_PORT', '8000')
    
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
    print(f"  - Swagger UI: http://localhost:{port}/api/docs/swagger/")
    print(f"  - ReDoc: http://localhost:{port}/api/docs/redoc/")
    print(f"  - OpenAPI Schema: http://localhost:{port}/api/schema/")
    print(f"  - API Endpoint: http://localhost:{port}/api/v1.0/DynamicApi/DynamicApiExecute")
    print()
    print(f"[STARTUP] Running on: http://localhost:{port}")
    print("[STARTUP] Press CTRL+C to stop the server")
    print("="*60 + "\n")
    
    # Run the development server
    execute_from_command_line(['manage.py', 'runserver', f'0.0.0.0:{port}'])


if __name__ == '__main__':
    main()
