"""
Views (Controllers) for Dynamic API application.
Handles HTTP requests and responses.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema
from dynamic_api_app.serializers import DynamicApiRequestSerializer, DynamicApiResponseSerializer
from dynamic_api_app.services import DynamicApiService


logger = logging.getLogger(__name__)


@extend_schema(
    summary='Execute Stored Procedure',
    description='Execute a stored procedure with string-delimited parameters.',
    request=DynamicApiRequestSerializer,
    responses={
        200: DynamicApiResponseSerializer,
        400: DynamicApiResponseSerializer,
    },
    tags=['Procedures'],
)
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def execute_stored_procedure(request):
    """
    Execute stored procedure with string-delimited parameters.
    
    Expected POST body:
    {
        "stringOne": "p_ContactId=5|p_Status=Active",
        "stringTwo": "|",
        "stringThree": "=",
        "stringFour": "SP_GetContactData"
    }
    
    Returns:
    {
        "status": true|false,
        "message": "Success or error message",
        "data": [...] or null
    }
    """
    try:
        # Validate request method
        if request.method != 'POST':
            return Response(
                {
                    "status": False,
                    "message": "Method not allowed. Use POST.",
                    "data": None,
                },
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        # Validate request
        serializer = DynamicApiRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Invalid request: {serializer.errors}")
            return Response(
                {
                    'status': False,
                    'message': 'Invalid request parameters',
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        data = serializer.validated_data
        procedure_name = data['stringFour']
        parameters = data['stringOne']
        param_separator = data.get('stringTwo', '|')
        key_value_separator = data.get('stringThree', '=')
        
        # Get user email from JWT token if available
        user_email = None
        if hasattr(request, 'user') and request.user:
            user_email = getattr(request.user, 'email', None)
        
        # Execute procedure
        success, message, result_data = DynamicApiService.execute_stored_procedure(
            procedure_name=procedure_name,
            parameters=parameters,
            param_separator=param_separator,
            key_value_separator=key_value_separator,
            user_email=user_email
        )
        
        # Prepare response
        response_data = {
            'status': success,
            'message': message,
            'data': result_data if success else None
        }
        
        # Serialize response
        response_serializer = DynamicApiResponseSerializer(response_data)
        
        http_status = status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
        
        logger.info(f"Procedure {procedure_name} - Success: {success}")
        
        return Response(
            response_serializer.data,
            status=http_status
        )
    
    except Exception as e:
        # Log full error server-side with stack trace for debugging
        logger.error(f"Unexpected error in execute_stored_procedure: {str(e)}", exc_info=True)
        
        # Return generic error message to client (don't expose details)
        return Response(
            {
                'status': False,
                'message': 'An error occurred processing your request. Please contact support if the problem persists.',
                'data': None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
