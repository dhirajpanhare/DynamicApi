"""
Serializers for Dynamic API application.
"""
from rest_framework import serializers


class DynamicApiRequestSerializer(serializers.Serializer):
    """Serializer for stored procedure execution requests"""
    
    stringOne = serializers.CharField(
        required=True,
        help_text="Delimited parameters (format: param1=value1|param2=value2)"
    )
    stringTwo = serializers.CharField(
        required=False,
        default="|",
        help_text="Parameter separator (default: |)"
    )
    stringThree = serializers.CharField(
        required=False,
        default="=",
        help_text="Key-value separator (default: =)"
    )
    stringFour = serializers.CharField(
        required=True,
        help_text="Stored procedure name"
    )
    
    def validate_stringFour(self, value):
        """Validate procedure name"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Procedure name cannot be empty")
        return value.strip()


class DynamicApiResponseSerializer(serializers.Serializer):
    """Serializer for API response structure"""
    
    status = serializers.BooleanField()
    message = serializers.CharField()
    data = serializers.JSONField(allow_null=True)


class HealthResponseSerializer(serializers.Serializer):
    """Serializer for health check response"""
    
    status = serializers.BooleanField()
    message = serializers.CharField()
    data = serializers.JSONField()


class ExecutionLogSerializer(serializers.Serializer):
    """Serializer for execution logs"""
    
    id = serializers.IntegerField()
    procedure_name = serializers.CharField()
    parameters = serializers.CharField()
    status = serializers.BooleanField()
    message = serializers.CharField(allow_blank=True)
    execution_time_ms = serializers.IntegerField(allow_null=True)
    created_at = serializers.DateTimeField()
    execution_user = serializers.CharField(allow_blank=True)
