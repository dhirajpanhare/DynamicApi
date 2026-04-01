"""
Dynamic API Service Layer.
Contains core business logic for API operations.
"""
import logging
import time
from typing import Dict, List, Any, Tuple
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
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Execute stored procedure with parameter parsing
        
        Args:
            procedure_name: Name of stored procedure to execute
            parameters: Delimited parameter string
            param_separator: Separator between parameters (default: "|")
            key_value_separator: Separator between key and value (default: "=")
            user_email: Email of user executing procedure (for logging)
        
        Returns:
            Tuple of (success: bool, message: str, data: list)
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
                DynamicApiService._log_execution(True, message, execution_data, start_time)
                return True, message, results
            
            except ValueError as e:
                message = f"Procedure not found or invalid: {procedure_name}"
                logger.error(f"{message} - {str(e)}")
                DynamicApiService._log_execution(False, message, execution_data, start_time)
                return False, message, None
        
        except Exception as e:
            message = f"Unexpected error: {str(e)}"
            logger.error(message)
            DynamicApiService._log_execution(False, message, execution_data, start_time)
            return False, message, None
    
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
