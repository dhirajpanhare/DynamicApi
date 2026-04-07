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
from dynamic_api_app.serializers import DynamicApiRequestSerializer, DynamicApiResponseSerializer, ParameterMetadataSerializer, ProcedureMetadataResponseSerializer, ListProceduresSerializer
from dynamic_api_app.services import DynamicApiService
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
    description='Retrieve parameter metadata and generate Swagger schema for a stored procedure',
    responses={200: ProcedureMetadataResponseSerializer},
    tags=['Metadata'],
)
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_procedure_metadata(request, procedure_name):
    """Get metadata for a specific stored procedure"""
    try:
        metadata = DynamicApiService.get_procedure_metadata(procedure_name)
        return Response({'status': True, 'message': 'Metadata retrieved', 'data': metadata})
    except Exception as e:
        logger.error(f"Error getting metadata for {procedure_name}: {str(e)}")
        return Response({'status': False, 'message': str(e)}, status=400)


@extend_schema(
    summary='List Procedures',
    description='Get list of all available stored procedures',
    responses={200: ListProceduresSerializer},
    tags=['Metadata'],
)
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def list_procedures(request):
    """Get list of all available procedures"""
    try:
        procedures = DynamicApiService.list_procedures()
        return Response({'status': True, 'message': 'Procedures retrieved', 'data': procedures})
    except Exception as e:
        logger.error(f"Error listing procedures: {str(e)}")
        return Response({'status': False, 'message': str(e)}, status=400)


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

    # Extract procedure name
    name_match = re.search(
        r'CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?(?:OR\s+ALTER\s+)?PROC(?:EDURE)?\s+'
        r'(?:\[?[^\s\[.\]]+\]?\.)?' r'\[?`?([a-zA-Z_][a-zA-Z0-9_]*)`?\]?\s*[\(@]',
        sql, re.IGNORECASE
    )
    if not name_match:
        raise ValueError('Could not extract procedure name. Make sure the SQL starts with CREATE PROCEDURE.')

    procedure_name = name_match.group(1)

    # Find the outermost parameter block ( ... )
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

    # Split on commas not inside nested parentheses
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
        # MySQL: IN|OUT|INOUT name TYPE
        mysql_match = re.match(
            r'^(IN|OUT|INOUT)\s+[`\[]?([a-zA-Z_@][a-zA-Z0-9_]*)[`\]]?\s+([A-Za-z]+(?:\([^)]*\))?)',
            param_str, re.IGNORECASE
        )
        # MSSQL: @name TYPE
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
            continue  # OUT-only params have no input value

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

