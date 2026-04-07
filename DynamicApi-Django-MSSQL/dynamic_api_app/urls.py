"""
URL routing for Dynamic API application.
"""
from django.urls import path
from . import views

app_name = 'dynamic_api'

urlpatterns = [
    path('DynamicApiExecute', views.execute_stored_procedure, name='execute_procedure'),
    path('GetProcedureMetadata/<str:procedure_name>', views.get_procedure_metadata, name='get_procedure_metadata'),
    path('ListProcedures', views.list_procedures, name='list_procedures'),
    path('DynamicTransactionApiExecute', views.execute_transaction, name='execute_transaction'),
    path('GeneratePayload', views.generate_payload, name='generate_payload'),
]
