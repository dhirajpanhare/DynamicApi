"""
Stored Procedure Executor for Dynamic API.
Handles execution of stored procedures from database.
"""
import logging
from django.db import connection, DEFAULT_DB_ALIAS
from django.conf import settings
from typing import List, Dict, Any


logger = logging.getLogger(__name__)


class StoredProcedureExecutor:
    """Execute stored procedures and map results"""
    
    @staticmethod
    def _get_db_engine() -> str:
        """Get the database engine type from Django settings"""
        db_config = settings.DATABASES[DEFAULT_DB_ALIAS]
        engine = db_config.get('ENGINE', '')
        if 'mysql' in engine.lower():
            return 'mysql'
        elif 'mssql' in engine.lower() or 'pyodbc' in engine.lower():
            return 'mssql'
        else:
            return 'sqlite'
    
    @staticmethod
    def execute(procedure_name: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Execute a stored procedure with parameters
        
        Args:
            procedure_name: Name of the stored procedure to execute
            parameters: Dictionary of parameter names and values
        
        Returns:
            List of result dictionaries
        
        Raises:
            ValueError: If procedure execution fails
        """
        db_engine = StoredProcedureExecutor._get_db_engine()
        logger.info(f"Using database engine: {db_engine}")
        
        if db_engine == 'mysql':
            return StoredProcedureExecutor._execute_mysql(procedure_name, parameters)
        else:
            return StoredProcedureExecutor._execute_mssql(procedure_name, parameters)
    
    @staticmethod
    def _execute_mysql(procedure_name: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Execute stored procedure in MySQL
        
        Args:
            procedure_name: Name of the stored procedure
            parameters: Dictionary of parameter names and values
        
        Returns:
            List of result dictionaries
        """
        try:
            with connection.cursor() as cursor:
                # Build parameter placeholders
                param_names = list(parameters.keys())
                param_values = list(parameters.values())
                
                # MySQL uses % as placeholder and CALL syntax
                placeholders = ','.join(['%s'] * len(param_names))
                query = f"CALL {procedure_name}({placeholders})" if param_names else f"CALL {procedure_name}()"
                
                logger.info(f"Executing MySQL procedure: {procedure_name} with params: {param_names}")
                logger.debug(f"Query: {query}, Values: {param_values}")
                
                cursor.execute(query, param_values)
                
                # For MySQL, we need to handle the cursor properly
                # Multiple result sets are possible
                results = []
                if cursor.description:
                    columns = [col[0] for col in cursor.description]
                    results = [
                        dict(zip(columns, row))
                        for row in cursor.fetchall()
                    ]
                
                # Close any additional result sets
                while cursor.nextset():
                    pass
                
                logger.info(f"Procedure {procedure_name} executed successfully. Rows: {len(results)}")
                return results
        
        except Exception as e:
            logger.error(f"Error executing MySQL procedure {procedure_name}: {str(e)}")
            logger.error(f"  Parameters: {parameters}")
            raise ValueError(f"Error executing procedure: {str(e)}")
    
    @staticmethod
    def _execute_mssql(procedure_name: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Execute stored procedure in MSSQL
        
        Args:
            procedure_name: Name of the stored procedure
            parameters: Dictionary of parameter names and values
        
        Returns:
            List of result dictionaries
        """
        try:
            with connection.cursor() as cursor:
                # Build parameter placeholders and values
                param_names = list(parameters.keys())
                param_values = list(parameters.values())
                
                # For MSSQL
                placeholders = ','.join([f'@{name}=?' for name in param_names])
                
                # Execute stored procedure
                query = f"EXEC {procedure_name} {placeholders}" if param_names else f"EXEC {procedure_name}"
                
                logger.info(f"Executing MSSQL procedure: {procedure_name} with params: {param_names}")
                cursor.execute(query, param_values)
                
                # Fetch all results
                columns = [col[0] for col in cursor.description] if cursor.description else []
                results = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]
                
                logger.info(f"Procedure {procedure_name} executed successfully. Rows: {len(results)}")
                return results
        
        except Exception as e:
            logger.error(f"Error executing MSSQL procedure {procedure_name}: {str(e)}")
            raise ValueError(f"Error executing procedure: {str(e)}")
    
    @staticmethod
    def execute_with_mssql(procedure_name: str, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Execute stored procedure using pyodbc for MSSQL (legacy method)
        
        Args:
            procedure_name: Name of the stored procedure
            parameters: Dictionary of parameters
        
        Returns:
            List of result dictionaries
        """
        return StoredProcedureExecutor._execute_mssql(procedure_name, parameters)
