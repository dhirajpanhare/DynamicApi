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
    executionTime = serializers.IntegerField(default=0, help_text="Execution time in milliseconds")
    cached = serializers.BooleanField(default=False, help_text="Whether result was cached")
    data = serializers.JSONField(allow_null=True)


class HealthResponseSerializer(serializers.Serializer):
    """Serializer for health check response"""
    
    status = serializers.BooleanField()
    message = serializers.CharField()
    data = serializers.JSONField()


class ParameterMetadataSerializer(serializers.Serializer):
    """Serializer for stored procedure parameter metadata"""
    
    name = serializers.CharField()
    type = serializers.CharField()
    maxLength = serializers.IntegerField(required=False, allow_null=True)
    precision = serializers.IntegerField(required=False, allow_null=True)
    scale = serializers.IntegerField(required=False, allow_null=True)
    isNullable = serializers.BooleanField(default=True)
    isOutput = serializers.BooleanField(default=False)


class ProcedureMetadataResponseSerializer(serializers.Serializer):
    """Serializer for procedure metadata response"""
    
    procedureName = serializers.CharField()
    parameters = ParameterMetadataSerializer(many=True)
    exampleRequest = serializers.JSONField()
    swaggerSchema = serializers.JSONField()


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


class TransactionOperationSerializer(serializers.Serializer):
    """Serializer for a single operation in a transaction"""
    
    procedureName = serializers.CharField(help_text="Name of stored procedure")
    stringOne = serializers.CharField(required=False, allow_blank=True, help_text="Delimited parameters")
    stringTwo = serializers.CharField(required=False, default="|", help_text="Parameter separator")
    stringThree = serializers.CharField(required=False, default="=", help_text="Key-value separator")


class TransactionExecutionRequestSerializer(serializers.Serializer):
    """Serializer for transaction execution request"""
    
    transaction = serializers.BooleanField(default=True, help_text="Enable transaction support")
    operations = TransactionOperationSerializer(many=True, help_text="List of operations to execute")


class OperationResultSerializer(serializers.Serializer):
    """Serializer for result of a single operation"""
    
    procedureName = serializers.CharField()
    status = serializers.BooleanField()
    message = serializers.CharField()
    executionTime = serializers.IntegerField()
    data = serializers.JSONField(allow_null=True)


class TransactionResponseSerializer(serializers.Serializer):
    """Serializer for transaction execution response"""
    
    status = serializers.BooleanField()
    message = serializers.CharField()
    executionTime = serializers.IntegerField()
    cached = serializers.BooleanField(default=False)
    data = serializers.JSONField(allow_null=True)
