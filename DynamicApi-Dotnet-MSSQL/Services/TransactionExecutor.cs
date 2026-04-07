using DynamicApi.Common;
using DynamicApi.Data;
using DynamicApi.Models;
using Microsoft.Data.SqlClient;
using System.Data;
using static DynamicApi.Models.TransactionModels;

namespace DynamicApi.Services
{
    /// <summary>
    /// Executes multiple stored procedures within a single database transaction
    /// </summary>
    public class TransactionExecutor
    {
        private readonly StoredProcedureExecutor _executor;
        private readonly DynamicApiDbContext _dbContext;
        private readonly ILogger<TransactionExecutor> _logger;
        private readonly string _connectionString;

        public TransactionExecutor(
            StoredProcedureExecutor executor,
            DynamicApiDbContext dbContext,
            ILogger<TransactionExecutor> logger,
            string connectionString)
        {
            _executor = executor;
            _dbContext = dbContext;
            _logger = logger;
            _connectionString = connectionString;
        }

        /// <summary>
        /// Execute multiple operations in a single transaction
        /// </summary>
        public async Task<TransactionResponse> ExecuteTransactionAsync(
            List<TransactionOperation> operations,
            string userEmail = "anonymous")
        {
            var overallStartTime = DateTime.UtcNow;
            var operationResults = new List<OperationResult>();
            int successCount = 0;
            int failureCount = 0;

            try
            {
                if (operations == null || operations.Count == 0)
                {
                    return new TransactionResponse
                    {
                        Status = false,
                        Message = "No operations provided",
                        ExecutionTime = 0,
                        OperationCount = 0,
                        SuccessfulOperations = 0,
                        FailedOperations = 0,
                        Operations = new List<OperationResult>()
                    };
                }

                _logger.LogInformation($"Starting transaction execution with {operations.Count} operations");

                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted);

                try
                {
                    foreach (var operation in operations)
                    {
                        var opStartTime = DateTime.UtcNow;

                        try
                        {
                            // Validate operation
                            if (string.IsNullOrEmpty(operation.ProcedureName))
                            {
                                throw new ArgumentException("Procedure name is required");
                            }

                            _logger.LogInformation($"Executing operation: {operation.ProcedureName}");

                            // Execute procedure
                            using var command = new SqlCommand(operation.ProcedureName, connection, transaction)
                            {
                                CommandType = CommandType.StoredProcedure
                            };

                            // Parse and add parameters
                            if (!string.IsNullOrEmpty(operation.StringOne))
                            {
                                var parameters = ParseParameters(operation.StringOne);
                                foreach (var param in parameters)
                                {
                                    var paramValue = (object?)(param.Value ?? (object)DBNull.Value);
                                    command.Parameters.AddWithValue($"@{param.Key}", paramValue);
                                }
                            }

                            var data = new List<Dictionary<string, object>>();
                            using var reader = await command.ExecuteReaderAsync();

                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                }
                                data.Add(row);
                            }

                            var opExecutionTime = (int)(DateTime.UtcNow - opStartTime).TotalMilliseconds;

                            operationResults.Add(new OperationResult
                            {
                                ProcedureName = operation.ProcedureName,
                                Status = true,
                                Message = "Success",
                                ExecutionTime = opExecutionTime,
                                Data = data
                            });

                            successCount++;

                            _logger.LogInformation($"Operation {operation.ProcedureName} completed successfully in {opExecutionTime}ms");
                        }
                        catch (Exception ex)
                        {
                            var opExecutionTime = (int)(DateTime.UtcNow - opStartTime).TotalMilliseconds;

                            _logger.LogError(ex, $"Error executing operation: {operation.ProcedureName}");

                            operationResults.Add(new OperationResult
                            {
                                ProcedureName = operation.ProcedureName,
                                Status = false,
                                Message = $"Error: {ex.Message}",
                                ExecutionTime = opExecutionTime,
                                Data = new List<Dictionary<string, object>>()
                            });

                            failureCount++;

                            // Rollback entire transaction on first failure
                            await transaction.RollbackAsync();
                            _logger.LogWarning($"Transaction rolled back due to operation failure: {operation.ProcedureName}");

                            throw; // Re-throw to break out of loop
                        }
                    }

                    // All operations succeeded, commit the transaction
                    await transaction.CommitAsync();
                    _logger.LogInformation("Transaction committed successfully");

                    var totalExecutionTime = (int)(DateTime.UtcNow - overallStartTime).TotalMilliseconds;

                    return new TransactionResponse
                    {
                        Status = true,
                        Message = $"Transaction completed successfully. {successCount} operations executed.",
                        ExecutionTime = totalExecutionTime,
                        Cached = false,
                        OperationCount = operations.Count,
                        SuccessfulOperations = successCount,
                        FailedOperations = failureCount,
                        Operations = operationResults
                    };
                }
                catch (Exception ex)
                {
                    // Transaction already rolled back above
                    var totalExecutionTime = (int)(DateTime.UtcNow - overallStartTime).TotalMilliseconds;

                    _logger.LogError(ex, "Transaction execution failed");

                    return new TransactionResponse
                    {
                        Status = false,
                        Message = $"Transaction failed and was rolled back. {failureCount} operation(s) failed.",
                        ExecutionTime = totalExecutionTime,
                        Cached = false,
                        OperationCount = operations.Count,
                        SuccessfulOperations = successCount,
                        FailedOperations = failureCount,
                        Operations = operationResults
                    };
                }
            }
            catch (Exception ex)
            {
                var totalExecutionTime = (int)(DateTime.UtcNow - overallStartTime).TotalMilliseconds;

                _logger.LogError(ex, "Unexpected error in transaction execution");

                return new TransactionResponse
                {
                    Status = false,
                    Message = "An unexpected error occurred during transaction execution",
                    ExecutionTime = totalExecutionTime,
                    Cached = false,
                    OperationCount = operations.Count,
                    SuccessfulOperations = successCount,
                    FailedOperations = failureCount,
                    Operations = operationResults
                };
            }
        }

        private Dictionary<string, string> ParseParameters(string parametersString)
        {
            var parameters = new Dictionary<string, string>();

            if (string.IsNullOrEmpty(parametersString))
                return parameters;

            try
            {
                var pairs = parametersString.Split('|');
                foreach (var pair in pairs)
                {
                    if (string.IsNullOrWhiteSpace(pair))
                        continue;

                    var keyValue = pair.Split('=');
                    if (keyValue.Length == 2)
                    {
                        var key = keyValue[0].Trim();
                        var value = keyValue[1].Trim();

                        // Validate parameter name format
                        if (!System.Text.RegularExpressions.Regex.IsMatch(key, @"^[a-zA-Z_@][a-zA-Z0-9_]*$"))
                        {
                            throw new ArgumentException($"Invalid parameter name format: {key}");
                        }

                        // Prevent duplicate parameters
                        if (parameters.ContainsKey(key))
                        {
                            throw new ArgumentException($"Duplicate parameter: {key}");
                        }

                        parameters[key] = value;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"Error parsing parameters: {ex.Message}", ex);
            }

            return parameters;
        }
    }
}
