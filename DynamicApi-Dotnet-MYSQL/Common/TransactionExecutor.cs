using System.Data;
using MySqlConnector;

namespace DynamicApi.Common
{
    /// <summary>
    /// Executes stored procedures within database transactions
    /// Provides atomic execution with automatic rollback on failure
    /// </summary>
    public class TransactionExecutor
    {
        private readonly string _connectionString;
        private readonly ILogger<TransactionExecutor> _logger;

        public TransactionExecutor(string connectionString, ILogger<TransactionExecutor> logger)
        {
            _connectionString = connectionString 
                ?? throw new ArgumentNullException(nameof(connectionString));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Executes a stored procedure within a database transaction
        /// </summary>
        public async Task<(bool success, string message, List<Dictionary<string, object>> data, int? generatedId)> 
            ExecuteTransactionAsync(string procedureName, Dictionary<string, object?> parameters)
        {
            MySqlConnection? connection = null;
            MySqlTransaction? transaction = null;

            try
            {
                _logger.LogInformation("Opening connection for transaction: {ProcedureName}", procedureName);
                
                connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync();
                
                transaction = await connection.BeginTransactionAsync();

                using var command = new MySqlCommand(procedureName, connection, transaction)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // Add input parameters
                foreach (var param in parameters.Where(p => !p.Key.StartsWith("OUT_")))
                {
                    var paramValue = param.Value ?? DBNull.Value;
                    command.Parameters.AddWithValue($"@{param.Key}", paramValue);
                }

                // Add output parameters
                var outParams = new List<string>();
                foreach (var param in parameters.Where(p => p.Key.StartsWith("OUT_")))
                {
                    var paramName = param.Key.Replace("OUT_", "");
                    var outParam = command.Parameters.Add($"@{paramName}", MySqlDbType.Int32);
                    outParam.Direction = ParameterDirection.Output;
                    outParams.Add(paramName);
                }

                var data = new List<Dictionary<string, object>>();
                
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.IsDBNull(i) ? null! : reader.GetValue(i);
                        }
                        data.Add(row);
                    }
                }

                // Get output parameter values
                int? generatedId = null;
                if (outParams.Count > 0)
                {
                    var firstOutParam = command.Parameters[$"@{outParams[0]}"];
                    if (firstOutParam.Value != DBNull.Value)
                    {
                        generatedId = Convert.ToInt32(firstOutParam.Value);
                    }
                }

                await transaction.CommitAsync();
                _logger.LogInformation("Transaction committed successfully: {ProcedureName}", procedureName);

                return (true, "Transaction completed successfully", data, generatedId);
            }
            catch (MySqlException ex)
            {
                _logger.LogError(ex, "MySQL error in transaction: {ProcedureName}", procedureName);
                
                if (transaction != null)
                {
                    try
                    {
                        await transaction.RollbackAsync();
                        _logger.LogInformation("Transaction rolled back: {ProcedureName}", procedureName);
                    }
                    catch (Exception rollbackEx)
                    {
                        _logger.LogError(rollbackEx, "Error during rollback: {ProcedureName}", procedureName);
                    }
                }

                return (false, $"Database error: {ex.Message}", new List<Dictionary<string, object>>(), null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in transaction: {ProcedureName}", procedureName);
                
                if (transaction != null)
                {
                    try
                    {
                        await transaction.RollbackAsync();
                        _logger.LogInformation("Transaction rolled back: {ProcedureName}", procedureName);
                    }
                    catch (Exception rollbackEx)
                    {
                        _logger.LogError(rollbackEx, "Error during rollback: {ProcedureName}", procedureName);
                    }
                }

                return (false, $"Error: {ex.Message}", new List<Dictionary<string, object>>(), null);
            }
            finally
            {
                if (transaction != null)
                {
                    await transaction.DisposeAsync();
                }

                if (connection != null)
                {
                    if (connection.State == ConnectionState.Open)
                    {
                        await connection.CloseAsync();
                    }
                    await connection.DisposeAsync();
                }
            }
        }

        /// <summary>
        /// Parses parameter string into dictionary
        /// Format: "p_Key=Value|p_Key2=Value2"
        /// </summary>
        public Dictionary<string, object?> ParseParameters(
            string? parametersString, 
            string separator = "|", 
            string keyValueSeparator = "=")
        {
            var parameters = new Dictionary<string, object?>();

            if (string.IsNullOrEmpty(parametersString))
                return parameters;

            try
            {
                var pairs = parametersString.Split(separator);
                foreach (var pair in pairs)
                {
                    if (string.IsNullOrWhiteSpace(pair))
                        continue;

                    var keyValue = pair.Split(keyValueSeparator);
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
                _logger.LogError(ex, "Error parsing parameters: {ParametersString}", parametersString);
                throw new ArgumentException($"Error parsing parameters: {ex.Message}", ex);
            }

            return parameters;
        }
    }
}
