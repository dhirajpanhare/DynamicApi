"""
Admin configuration for Django dynamic_api_app.
"""
from django.contrib import admin
from .models import ExecutionLog


@admin.register(ExecutionLog)
class ExecutionLogAdmin(admin.ModelAdmin):
    """Admin interface for ExecutionLog model"""
    
    list_display = ('procedure_name', 'status', 'execution_time_ms', 'created_at')
    list_filter = ('status', 'created_at', 'procedure_name')
    search_fields = ('procedure_name', 'execution_user')
    readonly_fields = ('created_at', 'procedure_name', 'parameters', 'status', 'message', 'execution_time_ms')
    
    fieldsets = (
        ('Execution Details', {
            'fields': ('procedure_name', 'parameters', 'execution_user')
        }),
        ('Results', {
            'fields': ('status', 'message', 'execution_time_ms')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
