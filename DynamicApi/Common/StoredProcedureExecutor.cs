using System.Data;
using MySqlConnector;

namespace DynamicApi.Common
{
    public class StoredProcedureExecutor
    {
        private readonly string _connectionString;

        /// <summary>
        /// Constructor that accepts connection string (can be from IConfiguration or direct)
        /// </summary>
        public StoredProcedureExecutor(string connectionString)
        {
            _connectionString = connectionString 
                ?? throw new InvalidOperationException("Connection string cannot be null");
        }

        public async Task<(bool success, string message, List<Dictionary<string, object>> data)> ExecuteAsync(
            string procedureName, 
            string parametersString)
        {
            try
            {
                using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new MySqlCommand(procedureName, connection)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // Parse parameters
                if (!string.IsNullOrEmpty(parametersString))
                {
                    var parameters = ParseParameters(parametersString);
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

                return (true, "Success", data);
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}", new List<Dictionary<string, object>>());
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
