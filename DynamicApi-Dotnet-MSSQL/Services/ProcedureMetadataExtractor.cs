using Microsoft.Data.SqlClient;
using System.Data;

namespace DynamicApi.Services
{
    /// <summary>
    /// Extracts metadata about stored procedures from SQL Server system views
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
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var metadata = new ProcedureMetadata
                {
                    ProcedureName = procedureName,
                    Parameters = new List<ParameterInfo>()
                };

                // Query INFORMATION_SCHEMA for procedure parameters
                var query = @"
                    SELECT 
                        p.PARAMETER_NAME,
                        p.DATA_TYPE,
                        p.CHARACTER_MAXIMUM_LENGTH,
                        p.NUMERIC_PRECISION,
                        p.NUMERIC_SCALE,
                        p.IS_RESULT,
                        p.PARAMETER_MODE,
                        COLUMNPROPERTY(OBJECT_ID(ROUTINE_SCHEMA + '.' + ROUTINE_NAME), PARAMETER_NAME, 'AllowsNull') as IS_NULLABLE
                    FROM INFORMATION_SCHEMA.PARAMETERS p
                    WHERE p.SPECIFIC_NAME = @ProcName
                    ORDER BY p.ORDINAL_POSITION";

                using var command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@ProcName", procedureName);

                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var param = new ParameterInfo
                    {
                        Name = reader.GetString(0),
                        Type = reader.GetString(1),
                        MaxLength = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                        Precision = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                        Scale = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                        IsNullable = reader.IsDBNull(7) ? true : reader.GetBoolean(7),
                        IsOutput = !reader.IsDBNull(6) && reader.GetString(6) == "OUT"
                    };

                    // Skip RETURN_VALUE parameters
                    if (param.Name != "RETURN_VALUE")
                    {
                        metadata.Parameters.Add(param);
                    }
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
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_NAME = @ProcName
                    AND ROUTINE_TYPE = 'PROCEDURE'";

                using var command = new SqlCommand(query, connection);
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
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT ROUTINE_NAME
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_TYPE = 'PROCEDURE'
                    ORDER BY ROUTINE_NAME";

                using var command = new SqlCommand(query, connection);
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
