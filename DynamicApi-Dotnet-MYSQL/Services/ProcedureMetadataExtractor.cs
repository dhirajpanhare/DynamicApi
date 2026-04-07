using MySqlConnector;
using System.Data;

namespace DynamicApi.Services
{
    /// <summary>
    /// Extracts metadata about stored procedures from MySQL system views
    /// </summary>
    public class ProcedureMetadataExtractor
    {
        private readonly string _connectionString;
        private readonly ILogger<ProcedureMetadataExtractor> _logger;

        public ProcedureMetadataExtractor(string connectionString, ILogger<ProcedureMetadataExtractor> logger)
        {
            _connectionString = connectionString ?? throw new InvalidOperationException("Connection string cannot be null");
            _logger = logger;
        }

        public class ParameterInfo
        {
            public string Name { get; set; }
            public string Type { get; set; }
            public int? MaxLength { get; set; }
            public int? Precision { get; set; }
            public int? Scale { get; set; }
            public bool IsNullable { get; set; }
            public bool IsOutput { get; set; }
            public string DefaultValue { get; set; }
        }

        public class ProcedureMetadata
        {
            public string ProcedureName { get; set; }
            public string Schema { get; set; }
            public List<ParameterInfo> Parameters { get; set; } = new();
            public string Description { get; set; }
        }

        /// <summary>
        /// Extract metadata for a specific stored procedure
        /// </summary>
        public async Task<ProcedureMetadata> ExtractProcedureMetadataAsync(string procedureName)
        {
            try
            {
                using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync();

                var metadata = new ProcedureMetadata
                {
                    ProcedureName = procedureName,
                    Parameters = new List<ParameterInfo>()
                };

                // Query INFORMATION_SCHEMA for procedure parameters
                var query = @"
                    SELECT 
                        PARAMETER_NAME,
                        PARAMETER_TYPE,
                        COLUMN_TYPE,
                        CHARACTER_MAXIMUM_LENGTH,
                        NUMERIC_PRECISION,
                        NUMERIC_SCALE,
                        IS_NULLABLE
                    FROM INFORMATION_SCHEMA.PARAMETERS
                    WHERE SPECIFIC_NAME = @ProcName
                    AND SPECIFIC_SCHEMA = DATABASE()
                    ORDER BY ORDINAL_POSITION";

                using var command = new MySqlCommand(query, connection);
                command.Parameters.AddWithValue("@ProcName", procedureName);

                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var paramType = reader.IsDBNull(1) ? "" : reader.GetString(1);
                    var columnType = reader.IsDBNull(2) ? "" : reader.GetString(2);
                    
                    var param = new ParameterInfo
                    {
                        Name = reader.GetString(0),
                        Type = paramType.ToUpper(),
                        MaxLength = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                        Precision = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                        Scale = reader.IsDBNull(5) ? null : reader.GetInt32(5),
                        IsNullable = reader.IsDBNull(6) ? true : reader.GetString(6) == "YES",
                        IsOutput = paramType.ToUpper() == "OUT" || paramType.ToUpper() == "INOUT"
                    };

                    metadata.Parameters.Add(param);
                }

                _logger.LogInformation($"Extracted metadata for procedure: {procedureName}. Parameters count: {metadata.Parameters.Count}");

                return metadata;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting metadata for procedure: {procedureName}");
                throw;
            }
        }

        /// <summary>
        /// Validate if a procedure exists
        /// </summary>
        public async Task<bool> ProcedureExistsAsync(string procedureName)
        {
            try
            {
                using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_NAME = @ProcName
                    AND ROUTINE_TYPE = 'PROCEDURE'
                    AND ROUTINE_SCHEMA = DATABASE()";

                using var command = new MySqlCommand(query, connection);
                command.Parameters.AddWithValue("@ProcName", procedureName);

                var result = await command.ExecuteScalarAsync();
                return result != null && (int)result > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking if procedure exists: {procedureName}");
                return false;
            }
        }

        /// <summary>
        /// Get all procedures in the database
        /// </summary>
        public async Task<List<string>> GetAllProceduresAsync()
        {
            var procedures = new List<string>();

            try
            {
                using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT ROUTINE_NAME
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_TYPE = 'PROCEDURE'
                    AND ROUTINE_SCHEMA = DATABASE()
                    ORDER BY ROUTINE_NAME";

                using var command = new MySqlCommand(query, connection);
                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    procedures.Add(reader.GetString(0));
                }

                _logger.LogInformation($"Found {procedures.Count} procedures in database");

                return procedures;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving list of procedures");
                return procedures;
            }
        }
    }
}
