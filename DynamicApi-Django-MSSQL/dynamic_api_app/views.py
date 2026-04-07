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
from dynamic_api_app.serializers import (
    DynamicApiRequestSerializer, 
    DynamicApiResponseSerializer,
    ProcedureMetadataResponseSerializer,
    TransactionExecutionRequestSerializer,
    TransactionResponseSerializer
)
from dynamic_api_app.services import DynamicApiService, ProcedureMetadataExtractor, SwaggerSchemaGenerator
from dynamic_api_app.auth import require_auth
import re


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
@require_auth
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
        success, message, result_data, execution_time = DynamicApiService.execute_stored_procedure(
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
            'executionTime': execution_time,
            'cached': False,
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


@extend_schema(
    summary='Get Procedure Metadata',
    description='Get metadata and Swagger schema for a stored procedure',
    responses={
        200: DynamicApiResponseSerializer,
        404: DynamicApiResponseSerializer,
    },
    tags=['Metadata'],
)
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_procedure_metadata(request, procedure_name):
    """
    Get metadata and auto-generated Swagger schema for a stored procedure.
    
    Returns:
    {
        "status": true,
        "message": "Metadata retrieved successfully",
        "data": {
            "procedureName": "GetProductById",
            "parameters": [...],
            "exampleRequest": {...},
            "swaggerSchema": {...}
        }
    }
    """
    try:
        # Validate procedure name
        if not procedure_name or not procedure_name.strip():
            return Response(
                {
                    'status': False,
                    'message': 'Procedure name is required',
                    'executionTime': 0,
                    'cached': False,
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if procedure exists
        if not ProcedureMetadataExtractor.procedure_exists(procedure_name):
            return Response(
                {
                    'status': False,
                    'message': f'Procedure "{procedure_name}" not found',
                    'executionTime': 0,
                    'cached': False,
                    'data': None
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Extract metadata
        metadata = ProcedureMetadataExtractor.extract_metadata(procedure_name)
        
        # Generate schema
        schema = SwaggerSchemaGenerator.generate_schema(metadata)
        
        # Build response
        response_data = {
            'procedureName': procedure_name,
            'parameters': metadata.get('parameters', []),
            'exampleRequest': SwaggerSchemaGenerator.generate_example_request(metadata),
            'swaggerSchema': schema
        }
        
        logger.info(f"Retrieved metadata for procedure: {procedure_name}")
        
        return Response(
            {
                'status': True,
                'message': 'Metadata retrieved successfully',
                'executionTime': 0,
                'cached': False,
                'data': response_data
            },
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error retrieving metadata for procedure {procedure_name}: {str(e)}", exc_info=True)
        return Response(
            {
                'status': False,
                'message': 'Error retrieving procedure metadata',
                'executionTime': 0,
                'cached': False,
                'data': None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary='List Procedures',
    description='Get list of all available stored procedures',
    responses={200: DynamicApiResponseSerializer},
    tags=['Metadata'],
)
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def list_procedures(request):
    """
    Get list of all available stored procedures.
    
    Returns:
    {
        "status": true,
        "message": "Found X procedures",
        "data": ["Procedure1", "Procedure2", ...]
    }
    """
    try:
        procedures = ProcedureMetadataExtractor.get_all_procedures()
        
        logger.info(f"Retrieved list of {len(procedures)} procedures")
        
        return Response(
            {
                'status': True,
                'message': f'Found {len(procedures)} procedures',
                'executionTime': 0,
                'cached': False,
                'data': procedures
            },
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error listing procedures: {str(e)}", exc_info=True)
        return Response(
            {
                'status': False,
                'message': 'Error retrieving procedures list',
                'executionTime': 0,
                'cached': False,
                'data': None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary='Execute Transaction',
    description='Execute multiple stored procedures within a single database transaction',
    request=TransactionExecutionRequestSerializer,
    responses={200: TransactionResponseSerializer},
    tags=['Transactions'],
)
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@require_auth
def execute_transaction(request):
    """
    Execute multiple stored procedures in a transaction.
    
    If any operation fails, all are rolled back.
    
    Expected POST body:
    {
        "transaction": true,
        "operations": [
            {
                "procedureName": "SP_InsertHeader",
                "stringOne": "p_DocumentId=100|p_Amount=5000",
                "stringTwo": "|",
                "stringThree": "="
            },
            {
                "procedureName": "SP_InsertDetail",
                "stringOne": "p_HeaderId=100|p_ItemId=1|p_Quantity=10",
                "stringTwo": "|",
                "stringThree": "="
            }
        ]
    }
    
    Returns:
    {
        "status": true|false,
        "message": "Transaction completed successfully...",
        "executionTime": 150,
        "cached": false,
        "data": {
            "operationCount": 2,
            "successfulOperations": 2,
            "failedOperations": 0,
            "operations": [...]
        }
    }
    """
    try:
        # Validate request method
        if request.method != 'POST':
            return Response(
                {
                    'status': False,
                    'message': 'Method not allowed. Use POST.',
                    'executionTime': 0,
                    'cached': False,
                    'data': None
                },
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        
        # Validate request
        serializer = TransactionExecutionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Invalid transaction request: {serializer.errors}")
            return Response(
                {
                    'status': False,
                    'message': 'Invalid request parameters',
                    'executionTime': 0,
                    'cached': False,
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract validated data
        data = serializer.validated_data
        operations = data.get('operations', [])
        
        # Get user email from JWT token if available
        user_email = None
        if hasattr(request, 'user') and request.user:
            user_email = getattr(request.user, 'email', None)
        
        # Execute transaction
        success, message, result_data, execution_time = DynamicApiService.execute_transaction(
            operations=operations,
            user_email=user_email
        )
        
        # Prepare response
        response_data = {
            'status': success,
            'message': message,
            'executionTime': execution_time,
            'cached': False,
            'data': result_data
        }
        
        http_status = status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
        
        logger.info(f"Transaction execution - Success: {success}")
        
        return Response(response_data, status=http_status)
    
    except Exception as e:
        logger.error(f"Unexpected error in execute_transaction: {str(e)}", exc_info=True)
        
        return Response(
            {
                'status': False,
                'message': 'An error occurred processing your transaction. Please contact support if the problem persists.',
                'executionTime': 0,
                'cached': False,
                'data': None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _sample_value_for_type(sql_type: str) -> str:
    """Return a representative sample value string for a given SQL data type."""
    t = sql_type.upper().strip()
    if re.match(r'(VARCHAR|CHAR|NVARCHAR|NCHAR|TEXT|NTEXT|LONGTEXT|MEDIUMTEXT|TINYTEXT|CLOB)', t):
        return 'SampleText'
    if re.match(r'(INT|INTEGER|BIGINT|SMALLINT|TINYINT|MEDIUMINT)', t):
        return '1'
    if re.match(r'(DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL|MONEY|SMALLMONEY)', t):
        return '0.00'
    if re.match(r'(BIT|BOOLEAN|BOOL)', t):
        return '1'
    if re.match(r'DATETIME2', t):
        return '2026-01-01 00:00:00'
    if re.match(r'(DATETIME|SMALLDATETIME|TIMESTAMP)', t):
        return '2026-01-01 00:00:00'
    if re.match(r'DATE', t):
        return '2026-01-01'
    if re.match(r'TIME', t):
        return '00:00:00'
    if re.match(r'(UNIQUEIDENTIFIER|UUID)', t):
        return '00000000-0000-0000-0000-000000000000'
    if re.match(r'(XML|JSON)', t):
        return '{}'
    if re.match(r'(VARBINARY|BINARY|IMAGE|BLOB|LONGBLOB|MEDIUMBLOB|TINYBLOB)', t):
        return ''
    return 'Value'


def _parse_procedure_definition(sql: str) -> dict:
    """
    Parse a CREATE PROCEDURE SQL definition (MySQL or MSSQL) and return
    { procedureName, parameters: [{name, mode, type, sampleValue}] }.
    """
    if not sql or not sql.strip():
        raise ValueError('Procedure definition is required')

    name_match = re.search(
        r'CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?(?:OR\s+ALTER\s+)?PROC(?:EDURE)?\s+'
        r'(?:\[?[^\s\[.\]]+\]?\.)?' r'\[?`?([a-zA-Z_][a-zA-Z0-9_]*)`?\]?\s*[\(@]',
        sql, re.IGNORECASE
    )
    if not name_match:
        raise ValueError('Could not extract procedure name. Make sure the SQL starts with CREATE PROCEDURE.')

    procedure_name = name_match.group(1)

    paren_start = sql.find('(', name_match.start() + len(name_match.group(0)) - 1)
    if paren_start == -1:
        return {'procedureName': procedure_name, 'parameters': []}

    depth = 0
    paren_end = -1
    for i in range(paren_start, len(sql)):
        if sql[i] == '(':
            depth += 1
        elif sql[i] == ')':
            depth -= 1
            if depth == 0:
                paren_end = i
                break

    param_block = sql[paren_start + 1:paren_end].strip() if paren_end > paren_start else ''
    if not param_block:
        return {'procedureName': procedure_name, 'parameters': []}

    param_strings = []
    current = ''
    d = 0
    for ch in param_block:
        if ch == '(':
            d += 1
        elif ch == ')':
            d -= 1
        if ch == ',' and d == 0:
            param_strings.append(current.strip())
            current = ''
        else:
            current += ch
    if current.strip():
        param_strings.append(current.strip())

    parameters = []
    for param_str in param_strings:
        if not param_str:
            continue
        mysql_match = re.match(
            r'^(IN|OUT|INOUT)\s+[`\[]?([a-zA-Z_@][a-zA-Z0-9_]*)[`\]]?\s+([A-Za-z]+(?:\([^)]*\))?)',
            param_str, re.IGNORECASE
        )
        mssql_match = re.match(
            r'^@([a-zA-Z_][a-zA-Z0-9_]*)\s+([A-Za-z]+(?:\([^)]*\))?)',
            param_str, re.IGNORECASE
        )
        if mysql_match:
            mode = mysql_match.group(1).upper()
            name = mysql_match.group(2).replace('`', '').replace('[', '').replace(']', '')
            ptype = mysql_match.group(3)
        elif mssql_match:
            name = '@' + mssql_match.group(1)
            ptype = mssql_match.group(2)
            mode = 'OUT' if re.search(r'OUTPUT', param_str, re.IGNORECASE) else 'IN'
        else:
            token = re.search(r'([`@]?[a-zA-Z_][a-zA-Z0-9_]*)', param_str)
            if not token:
                continue
            name = token.group(1)
            ptype = 'VARCHAR(255)'
            mode = 'IN'

        if mode == 'OUT':
            continue

        parameters.append({
            'name': name,
            'mode': mode,
            'type': ptype,
            'sampleValue': _sample_value_for_type(ptype)
        })

    return {'procedureName': procedure_name, 'parameters': parameters}


@extend_schema(
    summary='Generate DynamicApiExecute Payload',
    description=(
        'Paste a CREATE PROCEDURE SQL definition (MySQL or MSSQL syntax). '
        'Returns a ready-to-use DynamicApiExecute request payload with sample values '
        'pre-filled based on each parameter\'s data type.'
    ),
    request={
        'application/json': {
            'type': 'object',
            'required': ['procedureDefinition'],
            'properties': {
                'procedureDefinition': {
                    'type': 'string',
                    'description': 'Full CREATE PROCEDURE SQL text',
                    'example': (
                        'CREATE PROCEDURE `InsertProduct`('
                        'IN p_ProductName VARCHAR(150), '
                        'IN p_Price DECIMAL(10,2), '
                        'IN p_Category VARCHAR(100)) BEGIN ... END'
                    )
                }
            }
        }
    },
    responses={
        200: {
            'type': 'object',
            'properties': {
                'status': {'type': 'boolean'},
                'message': {'type': 'string'},
                'data': {
                    'type': 'object',
                    'properties': {
                        'stringOne': {'type': 'string'},
                        'stringTwo': {'type': 'string'},
                        'stringThree': {'type': 'string'},
                        'stringFour': {'type': 'string'},
                        'parameters': {'type': 'array'},
                    }
                }
            }
        }
    },
    tags=['Utilities'],
)
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def generate_payload(request):
    """
    Parse a CREATE PROCEDURE definition and return a ready-to-use
    DynamicApiExecute request payload with sample values.
    """
    procedure_definition = request.data.get('procedureDefinition', '').strip()
    if not procedure_definition:
        return Response(
            {'status': False, 'message': 'procedureDefinition is required in the request body'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        parsed = _parse_procedure_definition(procedure_definition)
    except ValueError as e:
        return Response(
            {'status': False, 'message': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f'Error parsing procedure definition: {str(e)}')
        return Response(
            {'status': False, 'message': f'Failed to parse procedure definition: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    param_separator = '|'
    kv_separator = '='
    string_one = param_separator.join(
        f"{p['name']}{kv_separator}{p['sampleValue']}" for p in parsed['parameters']
    )

    payload = {
        'stringOne': string_one,
        'stringTwo': param_separator,
        'stringThree': kv_separator,
        'stringFour': parsed['procedureName'],
    }

    # Return payload directly without wrapper
    return Response(payload)

