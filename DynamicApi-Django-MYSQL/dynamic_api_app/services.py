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
                execution_time = int((time.time() - start_time) * 1000)
                DynamicApiService._log_execution(False, message, execution_data, start_time)
                return False, message, None, execution_time
            
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
                execution_time = int((time.time() - start_time) * 1000)
                DynamicApiService._log_execution(False, message, execution_data, start_time)
                return False, message, None, execution_time
            
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
    
    @staticmethod
    def get_procedure_metadata(procedure_name: str) -> Dict[str, Any]:
        """
        Get metadata for a stored procedure including parameters and types
        
        Args:
            procedure_name: Name of the stored procedure
        
        Returns:
            Dictionary with procedure metadata
        """
        try:
            if not procedure_name or not procedure_name.strip():
                raise ValueError("Procedure name cannot be empty")
            
            params = DynamicApiService._extract_procedure_parameters(procedure_name)
            schema = DynamicApiService._generate_swagger_schema(procedure_name, params)
            
            return {
                'procedure_name': procedure_name,
                'parameters': params,
                'swagger_schema': schema
            }
        except Exception as e:
            logger.error(f"Error extracting metadata for {procedure_name}: {str(e)}")
            raise
    
    @staticmethod
    def _extract_procedure_parameters(procedure_name: str) -> List[Dict[str, Any]]:
        """
        Extract parameter information from MySQL information_schema
        
        Args:
            procedure_name: Name of the stored procedure
        
        Returns:
            List of parameter definitions
        """
        try:
            with connection.cursor() as cursor:
                # MySQL query for procedure parameters
                query = """
                    SELECT 
                        PARAMETER_NAME,
                        PARAMETER_TYPE,
                        ORDINAL_POSITION,
                        PARAMETER_MODE
                    FROM information_schema.PARAMETERS
                    WHERE SPECIFIC_NAME = %s
                    ORDER BY ORDINAL_POSITION
                """
                cursor.execute(query, [procedure_name])
                columns = [col[0] for col in cursor.description]
                parameters = []
                
                for row in cursor.fetchall():
                    param_dict = dict(zip(columns, row))
                    parameters.append({
                        'name': param_dict.get('PARAMETER_NAME', ''),
                        'type': param_dict.get('PARAMETER_TYPE', 'VARCHAR'),
                        'mode': param_dict.get('PARAMETER_MODE', 'IN'),
                        'position': param_dict.get('ORDINAL_POSITION', 0)
                    })
                
                return parameters
        except Exception as e:
            logger.error(f"Error extracting parameters: {str(e)}")
            raise
    
    @staticmethod
    def _generate_swagger_schema(procedure_name: str, parameters: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate OpenAPI/Swagger schema for procedure
        
        Args:
            procedure_name: Name of the procedure
            parameters: List of parameter definitions
        
        Returns:
            Swagger schema definition
        """
        parameter_properties = {}
        required_params = []
        
        for param in parameters:
            param_name = param.get('name', '')
            param_type = param.get('type', 'VARCHAR').upper()
            param_mode = param.get('mode', 'IN').upper()
            
            # Map MySQL types to OpenAPI types
            openapi_type = DynamicApiService._map_mysql_to_openapi_type(param_type)
            
            parameter_properties[param_name] = {
                'type': openapi_type,
                'description': f"{param_mode} parameter",
                'example': DynamicApiService._get_example_value(openapi_type)
            }
            
            if param_mode != 'OUT':
                required_params.append(param_name)
        
        return {
            'type': 'object',
            'properties': parameter_properties,
            'required': required_params
        }
    
    @staticmethod
    def _map_mysql_to_openapi_type(mysql_type: str) -> str:
        """Map MySQL data types to OpenAPI types"""
        mysql_type = mysql_type.upper()
        
        type_mapping = {
            'INT': 'integer',
            'BIGINT': 'integer',
            'SMALLINT': 'integer',
            'TINYINT': 'integer',
            'DECIMAL': 'number',
            'FLOAT': 'number',
            'DOUBLE': 'number',
            'VARCHAR': 'string',
            'CHAR': 'string',
            'TEXT': 'string',
            'LONGTEXT': 'string',
            'DATE': 'string',
            'DATETIME': 'string',
            'TIMESTAMP': 'string',
            'TIME': 'string',
            'BOOLEAN': 'boolean',
            'BOOL': 'boolean'
        }
        
        return type_mapping.get(mysql_type, 'string')
    
    @staticmethod
    def _get_example_value(openapi_type: str) -> Any:
        """Get example value for OpenAPI type"""
        examples = {
            'integer': 1,
            'number': 1.5,
            'string': 'example',
            'boolean': True
        }
        return examples.get(openapi_type, 'example')
    
    @staticmethod
    def list_procedures() -> List[str]:
        """
        List all stored procedures in the database
        
        Returns:
            List of procedure names
        """
        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT ROUTINE_NAME
                    FROM information_schema.ROUTINES
                    WHERE ROUTINE_SCHEMA = DATABASE()
                    AND ROUTINE_TYPE = 'PROCEDURE'
                    ORDER BY ROUTINE_NAME
                """
                cursor.execute(query)
                procedures = [row[0] for row in cursor.fetchall()]
                return procedures
        except Exception as e:
            logger.error(f"Error listing procedures: {str(e)}")
            raise
    
    @staticmethod
    def execute_transaction(
        operations: List[Dict[str, str]],
        user_email: str = None
    ) -> Tuple[bool, str, Dict[str, Any], int]:
        """
        Execute multiple stored procedures within a transaction (MySQL variant)
        
        Args:
            operations: List of operations, each with:
                - procedureName (str): Name of stored procedure
                - stringOne (str): First parameter
                - stringTwo (str): Second parameter
                - stringThree (str): Third parameter
            user_email (str): Email of user executing transaction
        
        Returns:
            Tuple of (success, message, result_data, execution_time_ms)
        """
        import time
        start_time = time.time()
        successful_operations = 0
        failed_operations = 0
        operation_results = []
        
        try:
            with connection.cursor() as cursor:
                # Start MySQL transaction
                cursor.execute("START TRANSACTION")
                
                try:
                    for idx, operation in enumerate(operations):
                        op_start = time.time()
                        
                        try:
                            proc_name = operation.get('procedureName', '')
                            string_one = operation.get('stringOne', '')
                            string_two = operation.get('stringTwo', '')
                            string_three = operation.get('stringThree', '')
                            
                            # Parse procedure name if it contains SCHEMA. prefix
                            if '.' in proc_name:
                                proc_name = proc_name.split('.')[-1]
                            
                            # Build dynamic call statement
                            query = f"CALL {proc_name} (%s, %s, %s)"
                            
                            # Execute procedure
                            cursor.execute(query, [string_one, string_two, string_three])
                            
                            # Try to fetch results if available
                            try:
                                result = cursor.fetchall()
                                if result:
                                    result_data = result
                                else:
                                    result_data = None
                            except:
                                result_data = None
                            
                            op_time = int((time.time() - op_start) * 1000)
                            
                            operation_results.append({
                                'operationIndex': idx,
                                'procedureName': proc_name,
                                'success': True,
                                'message': 'Procedure executed successfully',
                                'executionTime': op_time,
                                'result': result_data
                            })
                            successful_operations += 1
                            
                        except Exception as op_err:
                            op_time = int((time.time() - op_start) * 1000)
                            
                            operation_results.append({
                                'operationIndex': idx,
                                'procedureName': operation.get('procedureName', 'Unknown'),
                                'success': False,
                                'message': f'Procedure execution failed: {str(op_err)}',
                                'executionTime': op_time,
                                'result': None
                            })
                            failed_operations += 1
                            
                            # Rollback entire transaction on first failure
                            cursor.execute("ROLLBACK")
                            
                            total_time = int((time.time() - start_time) * 1000)
                            
                            return (
                                False,
                                f'Transaction failed: Operation {idx} failed. All operations rolled back.',
                                {
                                    'operationCount': len(operations),
                                    'successfulOperations': successful_operations,
                                    'failedOperations': failed_operations,
                                    'operations': operation_results
                                },
                                total_time
                            )
                    
                    # All operations succeeded, commit transaction
                    cursor.execute("COMMIT")
                    
                except Exception as tx_err:
                    cursor.execute("ROLLBACK")
                    logger.error(f"Transaction error: {str(tx_err)}")
                    
                    total_time = int((time.time() - start_time) * 1000)
                    return (
                        False,
                        f'Transaction error: {str(tx_err)}',
                        {
                            'operationCount': len(operations),
                            'successfulOperations': successful_operations,
                            'failedOperations': failed_operations,
                            'operations': operation_results
                        },
                        total_time
                    )
            
            total_time = int((time.time() - start_time) * 1000)
            return (
                True,
                'All operations completed successfully',
                {
                    'operationCount': len(operations),
                    'successfulOperations': successful_operations,
                    'failedOperations': failed_operations,
                    'operations': operation_results
                },
                total_time
            )
            
        except Exception as e:
            logger.error(f"Transaction execution error: {str(e)}")
            total_time = int((time.time() - start_time) * 1000)
            
            return (
                False,
                f'Transaction execution error: {str(e)}',
                {
                    'operationCount': len(operations),
                    'successfulOperations': successful_operations,
                    'failedOperations': failed_operations,
                    'operations': operation_results
                },
                total_time
            )
