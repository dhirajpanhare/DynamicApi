"""
URL routing for Dynamic API application.
"""
from django.urls import path
from . import views

app_name = 'dynamic_api'

urlpatterns = [
    path('DynamicApiExecute', views.execute_stored_procedure, name='execute_procedure'),
]
