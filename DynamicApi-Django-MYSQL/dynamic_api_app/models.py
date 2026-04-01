"""
Models for Dynamic API application.
Currently minimal models as most data comes from stored procedures.
"""
from django.db import models


class ExecutionLog(models.Model):
    """Log entries for stored procedure executions"""
    
    procedure_name = models.CharField(max_length=255)
    parameters = models.TextField()
    status = models.BooleanField(default=True)
    message = models.TextField(blank=True, null=True)
    execution_time_ms = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    execution_user = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['procedure_name', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.procedure_name} - {self.created_at}"
