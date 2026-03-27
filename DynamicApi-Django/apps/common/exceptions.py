"""
Custom exceptions for the Dynamic API.
"""


class ProcedureExecutionError(Exception):
    """Raised when stored procedure execution fails"""
    pass


class ProcedureNotFoundError(ProcedureExecutionError):
    """Raised when stored procedure is not found"""
    pass


class InvalidParametersError(ProcedureExecutionError):
    """Raised when procedure parameters are invalid"""
    pass


class DatabaseConnectionError(Exception):
    """Raised when database connection fails"""
    pass
