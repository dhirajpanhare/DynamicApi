"""
URL configuration for dynamic_api project.
Main URL routing for the application.
"""
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # API endpoints
    path('api/v1.0/DynamicApi/', include('dynamic_api_app.urls')),
    
    # Swagger/OpenAPI Schema and UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc-ui'),
]
