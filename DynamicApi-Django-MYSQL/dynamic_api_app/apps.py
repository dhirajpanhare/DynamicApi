from django.apps import AppConfig


class DynamicApiAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dynamic_api_app'
    verbose_name = 'Dynamic API Application'
