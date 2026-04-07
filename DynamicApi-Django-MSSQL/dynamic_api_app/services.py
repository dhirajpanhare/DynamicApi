"""
Dynamic API Service Layer.
Contains core business logic for API operations.
"""
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any, Tuple
from django.db import connection, DEFAULT_DB_ALIAS
from django.conf import settings
from dynamic_api_app.executor import StoredProcedureExecutor
from dynamic_api_app.models import ExecutionLog


logger = logging.getLogger(__name__)


import re

class ParameterParser:
    """Parse delimited parameter strings into dictionaries with validation"""
    
    # Valid parameter name pattern (alphanumeric, underscore, @ prefix)
    PARAM_NAME_PATTERN = re.compile(r'^[a-zA-Z_@][a-zA-Z0-9_]*$')
    MAX_PARAM_VALUE_LENGTH = 50000
    
    @staticmethod
    def parse_parameters(
        param_string: str,
        param_separator: str = "|",
        key_value_separator: str = "="
    ) -> Dict[str, str]:
        """
        Parse delimited parameter string into dictionary with validation
        
        Args:
            param_string: Delimited parameter string (e.g., "p_Id=5|p_Name=John")
            param_separator: Separator between parameters (default: "|")
            key_value_separator: Separator between key and value (default: "=")
        
        Returns:
            Dictionary of parsed parameters
        
        Raises:
            ValueError: If parameter format is invalid
        """
        if not param_string or not param_string.strip():
            return {}
        
        # Validate separators are single characters
        if len(param_separator) != 1:
            raise ValueError("Parameter separator must be a single character")
        if len(key_value_separator) != 1:
            raise ValueError("Key-value separator must be a single character")
        
        parameters = {}
        try:
            # Split by parameter separator
            param_pairs = param_string.split(param_separator)
            
            for pair in param_pairs:
                if not pair.strip():
                    continue
                
                # Split by key-value separator
                if key_value_separator not in pair:
                    logger.warning(f"Invalid parameter format: {pair}")
                    raise ValueError(f"Invalid parameter format: {pair}")
                
                key, value = pair.split(key_value_separator, 1)
                key = key.strip()
                value = value.strip()
                
                # Validate parameter name is not empty
                if not key:
                    raise ValueError("Parameter name cannot be empty")
                
                # Validate parameter name format
                if not ParameterParser.PARAM_NAME_PATTERN.match(key):
                    raise ValueError(f"Invalid parameter name format: {key}. Must start with letter or underscore, contain only alphanumeric and underscore")
                
                # Check for duplicate parameters
                if key in parameters:
                    raise ValueError(f"Duplicate parameter: {key}")
                
                # Validate value length
                if len(value) > ParameterParser.MAX_PARAM_VALUE_LENGTH:
                    raise ValueError(f"Parameter value exceeds maximum length for: {key}")
                
                parameters[key] = value
                logger.debug(f"Parsed parameter: {key}={value}")
            
            return parameters
        
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error parsing parameters: {str(e)}")
            raise ValueError(f"Parameter parsing error: {str(e)}")


class DynamicApiService:
    """Main service for Dynamic API operations"""
    
    @staticmethod
    def execute_stored_procedure(
        procedure_name: str,
        parameters: str,
        param_separator: str = "|",
        key_value_separator: str = "=",
        user_email: str = None
    ) -> Tuple[bool, str, List[Dict[str, Any]], int]:
        """
        Execute stored procedure with parameter parsing
        
        Args:
            procedure_name: Name of stored procedure to execute
            parameters: Delimited parameter string
            param_separator: Separator between parameters (default: "|")
            key_value_separator: Separator between key and value (default: "=")
            user_email: Email of user executing procedure (for logging)
        
        Returns:
            Tuple of (success: bool, message: str, data: list, execution_time: int)
        """
        start_time = time.time()
        execution_data = {
            'procedure_name': procedure_name,
            'parameters': parameters,
            'user_email': user_email or 'anonymous'
        }
        
        try:
            # Validate procedure name
            if not procedure_name or not procedure_name.strip():
                message = "Procedure name cannot be empty"
                logger.warning(message)
                DynamicApiService._log_execution(False, message, execution_data, start_time)
                return False, message, None
            
            # Parse parameters
            try:
                param_dict = ParameterParser.parse_parameters(
                    parameters,
                    param_separator,
                    key_value_separator
                )
            except ValueError as e:
                message = f"Invalid parameters: {str(e)}"
                logger.warning(message)
                DynamicApiService._log_execution(False, message, execution_data, start_time)
                return False, message, None
            
            # Execute procedure
            try:
                results = StoredProcedureExecutor.execute(procedure_name, param_dict)
                message = "Success"
                execution_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds
                DynamicApiService._log_execution(True, message, execution_data, start_time)
                return True, message, results, execution_time
            
            except ValueError as e:
                message = f"Procedure not found or invalid: {procedure_name}"
                logger.error(f"{message} - {str(e)}")
                execution_time = int((time.time() - start_time) * 1000)
                DynamicApiService._log_execution(False, message, execution_data, start_time)
                return False, message, None, execution_time
        
        except Exception as e:
            message = f"Unexpected error: {str(e)}"
            logger.error(message)
            execution_time = int((time.time() - start_time) * 1000)
            DynamicApiService._log_execution(False, message, execution_data, start_time)
            return False, message, None, execution_time
    
    @staticmethod
    def get_health() -> Dict[str, Any]:
        """
        Get API health status
        
        Returns:
            Dictionary with health information
        """
        from datetime import datetime
        
        logger.info("Health check performed")
        return {
            'status': True,
            'message': 'Dynamic API is operational',
            'data': {
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        }
    
    @staticmethod
    def _log_execution(
        status: bool,
        message: str,
        execution_data: Dict[str, Any],
        start_time: float
    ):
        """
        Log procedure execution
        
        Args:
            status: Success or failure
            message: Execution message
            execution_data: Execution details
            start_time: Start time for calculating duration
        """
        try:
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            ExecutionLog.objects.create(
                procedure_name=execution_data.get('procedure_name', ''),
                parameters=execution_data.get('parameters', ''),
                status=status,
                message=message,
                execution_time_ms=execution_time_ms,
                execution_user=execution_data.get('user_email', 'anonymous')
            )
        except Exception as e:
            logger.warning(f"Failed to log execution: {str(e)}")


class ProcedureMetadataExtractor:
    """Extract metadata about stored procedures from MSSQL"""
    
    @staticmethod
    def extract_metadata(procedure_name: str) -> Dict[str, Any]:
        """
        Extract metadata for a specific stored procedure
        
        Args:
            procedure_name: Name of the stored procedure
        
        Returns:
            Dictionary with procedure metadata
        """
        try:
            with connection.cursor() as cursor:
                # Query INFORMATION_SCHEMA for procedure parameters
                query = """
                    SELECT 
                        p.PARAMETER_NAME,
                        p.DATA_TYPE,
                        p.CHARACTER_MAXIMUM_LENGTH,
                        p.NUMERIC_PRECISION,
                        p.NUMERIC_SCALE,
                        CASE WHEN p.PARAMETER_MODE = 'IN' THEN 0 ELSE 1 END as IS_OUTPUT
                    FROM INFORMATION_SCHEMA.PARAMETERS p
                    WHERE p.SPECIFIC_NAME = %s
                    ORDER BY p.ORDINAL_POSITION
                """
                
                cursor.execute(query, [procedure_name])
                
                parameters = []
                for row in cursor.fetchall():
                    param = {
                        'name': row[0],
                        'type': row[1],
                        'maxLength': row[2],
                        'precision': row[3],
                        'scale': row[4],
                        'isNullable': True,
                        'isOutput': bool(row[5])
                    }
                    parameters.append(param)
                
                logger.info(f"Extracted metadata for procedure: {procedure_name}. Parameters: {len(parameters)}")
                
                return {
                    'procedureName': procedure_name,
                    'parameters': parameters
                }
        except Exception as e:
            logger.error(f"Error extracting metadata for procedure {procedure_name}: {str(e)}")
            raise ValueError(f"Error extracting metadata: {str(e)}")
    
    @staticmethod
    def procedure_exists(procedure_name: str) -> bool:
        """Check if a procedure exists"""
        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_NAME = %s
                    AND ROUTINE_TYPE = 'PROCEDURE'
                """
                
                cursor.execute(query, [procedure_name])
                result = cursor.fetchone()
                return result[0] > 0 if result else False
        except Exception as e:
            logger.error(f"Error checking if procedure exists: {str(e)}")
            return False
    
    @staticmethod
    def get_all_procedures() -> List[str]:
        """Get list of all stored procedures"""
        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT ROUTINE_NAME
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_TYPE = 'PROCEDURE'
                    ORDER BY ROUTINE_NAME
                """
                
                cursor.execute(query)
                procedures = [row[0] for row in cursor.fetchall()]
                
                logger.info(f"Found {len(procedures)} procedures in database")
                return procedures
        except Exception as e:
            logger.error(f"Error retrieving procedures: {str(e)}")
            return []
    @staticmethod
    def execute_transaction(
        operations: List[Dict[str, str]],
        user_email: str = None
    ) -> Tuple[bool, str, Dict[str, Any], int]:
        """
        Execute multiple stored procedures within a transaction
        
        Args:
            operations: List of operation dictionaries with procedureName, stringOne, stringTwo, stringThree
            user_email: Email of user executing transaction (for logging)
        
        Returns:
            Tuple of (success: bool, message: str, result_data: dict, execution_time: int)
        """
        overall_start_time = time.time()
        operation_results = []
        successful_count = 0
        failed_count = 0
        
        try:
            if not operations or len(operations) == 0:
                return False, "No operations provided", None, 0
            
            logger.info(f"Starting transaction execution with {len(operations)} operations")
            
            # Execute all operations in transaction
            with connection.cursor() as cursor:
                try:
                    # Start transaction
                    cursor.execute("BEGIN TRANSACTION")
                    
                    for op_index, operation in enumerate(operations):
                        op_start_time = time.time()
                        
                        try:
                            procedure_name = operation.get('procedureName', '').strip()
                            parameters = operation.get('stringOne', '')
                            param_separator = operation.get('stringTwo', '|')
                            key_value_separator = operation.get('stringThree', '=')
                            
                            if not procedure_name:
                                raise ValueError("Procedure name is required")
                            
                            # Parse parameters
                            param_dict = ParameterParser.parse_parameters(
                                parameters,
                                param_separator,
                                key_value_separator
                            )
                            
                            # Execute procedure
                            result_data = StoredProcedureExecutor.execute(procedure_name, param_dict)
                            operation_time = int((time.time() - op_start_time) * 1000)
                            
                            operation_results.append({
                                'procedureName': procedure_name,
                                'status': True,
                                'message': 'Success',
                                'executionTime': operation_time,
                                'data': result_data or []
                            })
                            successful_count += 1
                            logger.info(f"Operation {op_index + 1}: {procedure_name} - Success")
                            
                        except Exception as e:
                            operation_time = int((time.time() - op_start_time) * 1000)
                            error_message = str(e)
                            
                            operation_results.append({
                                'procedureName': operation.get('procedureName', 'Unknown'),
                                'status': False,
                                'message': error_message,
                                'executionTime': operation_time,
                                'data': []
                            })
                            failed_count += 1
                            logger.error(f"Operation {op_index + 1} failed: {error_message}")
                            
                            # Rollback transaction on any failure
                            cursor.execute("ROLLBACK TRANSACTION")
                            execution_time = int((time.time() - overall_start_time) * 1000)
                            
                            return False, f"Transaction rolled back: {error_message}", {
                                'operationCount': len(operations),
                                'successfulOperations': successful_count,
                                'failedOperations': failed_count,
                                'operations': operation_results
                            }, execution_time
                    
                    # Commit if all succeeded
                    cursor.execute("COMMIT TRANSACTION")
                    execution_time = int((time.time() - overall_start_time) * 1000)
                    
                    logger.info(f"Transaction completed: {successful_count}/{len(operations)} operations succeeded")
                    
                    return True, f"Transaction completed successfully: {successful_count}/{len(operations)} operations", {
                        'operationCount': len(operations),
                        'successfulOperations': successful_count,
                        'failedOperations': failed_count,
                        'operations': operation_results
                    }, execution_time
                    
                except Exception as e:
                    cursor.execute("ROLLBACK TRANSACTION")
                    execution_time = int((time.time() - overall_start_time) * 1000)
                    logger.error(f"Transaction error: {str(e)}")
                    return False, f"Transaction error: {str(e)}", {
                        'operationCount': len(operations),
                        'successfulOperations': successful_count,
                        'failedOperations': failed_count,
                        'operations': operation_results
                    }, execution_time
                    
        except Exception as e:
            execution_time = int((time.time() - overall_start_time) * 1000)
            logger.error(f"Unexpected error in transaction execution: {str(e)}")
            return False, f"Unexpected error: {str(e)}", None, execution_time

class SwaggerSchemaGenerator:
    """Generate OpenAPI/Swagger schemas and example payloads"""
    
    @staticmethod
    def map_sql_type_to_json_type(sql_type: str) -> str:
        """Map SQL type to JSON Schema type"""
        sql_type_lower = sql_type.lower()
        
        type_map = {
            'int': 'integer',
            'bigint': 'integer',
            'smallint': 'integer',
            'tinyint': 'integer',
            'float': 'number',
            'real': 'number',
            'decimal': 'number',
            'numeric': 'number',
            'money': 'number',
            'smallmoney': 'number',
            'bit': 'boolean',
            'datetime': 'string',
            'datetime2': 'string',
            'date': 'string',
            'time': 'string',
            'datetimeoffset': 'string',
            'guid': 'string',
            'uniqueidentifier': 'string',
        }
        
        return type_map.get(sql_type_lower, 'string')
    
    @staticmethod
    def generate_example_value(sql_type: str) -> Any:
        """Generate example value based on SQL type"""
        sql_type_lower = sql_type.lower()
        
        if sql_type_lower in ['int', 'bigint', 'smallint', 'tinyint']:
            return 1
        elif sql_type_lower in ['float', 'real', 'decimal', 'numeric', 'money', 'smallmoney']:
            return 99.99
        elif sql_type_lower == 'bit':
            return True
        elif sql_type_lower in ['datetime', 'datetime2', 'date', 'time', 'datetimeoffset']:
            return datetime.utcnow().isoformat() + 'Z'
        elif sql_type_lower in ['guid', 'uniqueidentifier']:
            import uuid
            return str(uuid.uuid4())
        else:
            return 'example_value'
    
    @staticmethod
    def generate_schema(metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Generate OpenAPI schema from procedure metadata"""
        parameters = metadata.get('parameters', [])
        
        properties = {}
        required = []
        
        for param in parameters:
            param_name = param['name']
            param_type = param['type']
            is_nullable = param.get('isNullable', True)
            is_output = param.get('isOutput', False)
            
            prop_schema = {
                'type': SwaggerSchemaGenerator.map_sql_type_to_json_type(param_type),
                'description': f"Parameter: {param_name} ({param_type})",
                'example': SwaggerSchemaGenerator.generate_example_value(param_type)
            }
            
            if param.get('maxLength'):
                prop_schema['maxLength'] = param['maxLength']
            
            properties[param_name] = prop_schema
            
            if not is_nullable and not is_output:
                required.append(param_name)
        
        return {
            'type': 'object',
            'description': f"Parameters for {metadata.get('procedureName')}",
            'properties': properties,
            'required': required
        }
    
    @staticmethod
    def generate_example_request(metadata: Dict[str, Any]) -> Dict[str, str]:
        """Generate example API request"""
        parameters = metadata.get('parameters', [])
        
        param_strings = []
        for param in parameters:
            if not param.get('isOutput', False):
                example_value = SwaggerSchemaGenerator.generate_example_value(param['type'])
                param_strings.append(f"{param['name']}={example_value}")
        
        return {
            'stringOne': '|'.join(param_strings),
            'stringTwo': '|',
            'stringThree': '=',
            'stringFour': metadata.get('procedureName')
        }
