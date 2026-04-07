using System.Collections.Generic;
using System.Text.Json;

namespace DynamicApi.Services
{
    /// <summary>
    /// Generates OpenAPI/Swagger schemas and example payloads for stored procedures
    /// </summary>
    public class SwaggerSchemaGenerator
    {
        private readonly ILogger<SwaggerSchemaGenerator> _logger;

        public SwaggerSchemaGenerator(ILogger<SwaggerSchemaGenerator> logger)
        {
            _logger = logger;
        }

        public class SwaggerSchema
        {
            public string Description { get; set; }
            public Dictionary<string, object> Properties { get; set; } = new();
            public List<string> Required { get; set; } = new();
            public string Type { get; set; } = "object";
        }

        public class ExampleRequest
        {
            public string StringOne { get; set; }
            public string StringTwo { get; set; } = "|";
            public string StringThree { get; set; } = "=";
            public string StringFour { get; set; }
        }

        /// <summary>
        /// Generate OpenAPI schema properties from procedure parameters
        /// </summary>
        public SwaggerSchema GenerateSchema(ProcedureMetadataExtractor.ProcedureMetadata metadata)
        {
            var schema = new SwaggerSchema
            {
                Description = $"Parameters for stored procedure: {metadata.ProcedureName}",
                Type = "object"
            };

            foreach (var param in metadata.Parameters)
            {
                var propSchema = GeneratePropertySchema(param);
                schema.Properties[param.Name] = propSchema;

                if (!param.IsNullable && !param.IsOutput)
                {
                    schema.Required.Add(param.Name);
                }
            }

            return schema;
        }

        /// <summary>
        /// Generate schema for a single parameter
        /// </summary>
        private Dictionary<string, object> GeneratePropertySchema(ProcedureMetadataExtractor.ParameterInfo param)
        {
            var schema = new Dictionary<string, object>
            {
                { "type", MapSqlTypeToJsonType(param.Type) },
                { "description", $"Parameter: {param.Name} ({param.Type})" }
            };

            // Add constraints
            if (param.MaxLength.HasValue)
            {
                schema["maxLength"] = param.MaxLength.Value;
            }

            if (param.Type.ToLower() == "decimal" || param.Type.ToLower() == "numeric")
            {
                if (param.Precision.HasValue)
                    schema["pattern"] = $"Precision: {param.Precision}";
                if (param.Scale.HasValue)
                    schema["scale"] = param.Scale;
            }

            // Add example value
            schema["example"] = GenerateExampleValue(param.Type);

            return schema;
        }

        /// <summary>
        /// Map SQL type to JSON Schema type
        /// </summary>
        private string MapSqlTypeToJsonType(string sqlType)
        {
            return sqlType.ToLower() switch
            {
                "int" => "integer",
                "bigint" => "integer",
                "smallint" => "integer",
                "tinyint" => "integer",
                "float" => "number",
                "double" => "number",
                "decimal" => "number",
                "numeric" => "number",
                "real" => "number",
                "bit" => "boolean",
                "datetime" => "string",
                "timestamp" => "string",
                "date" => "string",
                "time" => "string",
                "guid" => "string",
                "char" => "string",
                "varchar" => "string",
                "text" => "string",
                "longtext" => "string",
                _ => "string"  // Default to string for all other types
            };
        }

        /// <summary>
        /// Generate example value based on SQL type
        /// </summary>
        private object GenerateExampleValue(string sqlType)
        {
            return sqlType.ToLower() switch
            {
                "int" or "bigint" or "smallint" or "tinyint" => 1,
                "float" or "double" or "decimal" or "numeric" or "real" => 99.99,
                "bit" => true,
                "datetime" or "timestamp" or "date" or "time" => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"),
                "guid" => Guid.NewGuid().ToString(),
                _ => "example_value"
            };
        }

        /// <summary>
        /// Generate example API request payload
        /// </summary>
        public ExampleRequest GenerateExampleRequest(ProcedureMetadataExtractor.ProcedureMetadata metadata)
        {
            var parameters = new List<string>();

            foreach (var param in metadata.Parameters)
            {
                if (!param.IsOutput)
                {
                    var exampleValue = GenerateExampleValue(param.Type);
                    parameters.Add($"{param.Name}={exampleValue}");
                }
            }

            return new ExampleRequest
            {
                StringOne = string.Join("|", parameters),
                StringTwo = "|",
                StringThree = "=",
                StringFour = metadata.ProcedureName
            };
        }

        /// <summary>
        /// Generate complete OpenAPI documentation object
        /// </summary>
        public Dictionary<string, object> GenerateOpenApiOperation(ProcedureMetadataExtractor.ProcedureMetadata metadata)
        {
            var operation = new Dictionary<string, object>
            {
                { "summary", $"Execute {metadata.ProcedureName}" },
                { "description", $"Executes the {metadata.ProcedureName} stored procedure" },
                { "tags", new[] { "Dynamic API" } },
                { "parameters", new object[] { } },
                {
                    "requestBody", new Dictionary<string, object>
                    {
                        {
                            "required", true
                        },
                        {
                            "content", new Dictionary<string, object>
                            {
                                {
                                    "application/json", new Dictionary<string, object>
                                    {
                                        {
                                            "schema", new Dictionary<string, object>
                                            {
                                                { "type", "object" },
                                                { 
                                                    "properties", new Dictionary<string, object>
                                                    {
                                                        { "stringOne", new { type = "string", description = "Parameters" } },
                                                        { "stringTwo", new { type = "string", @default = "|", description = "Parameter separator" } },
                                                        { "stringThree", new { type = "string", @default = "=", description = "Key-value separator" } },
                                                        { "stringFour", new { type = "string", description = "Procedure name" } }
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            "example", GenerateExampleRequest(metadata)
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    "responses", new Dictionary<string, object>
                    {
                        {
                            "200", new Dictionary<string, object>
                            {
                                { "description", "Success" },
                                {
                                    "content", new Dictionary<string, object>
                                    {
                                        {
                                            "application/json", new Dictionary<string, object>
                                            {
                                                {
                                                    "schema", new Dictionary<string, object>
                                                    {
                                                        { "type", "object" },
                                                        {
                                                            "properties", new Dictionary<string, object>
                                                            {
                                                                { "status", new { type = "boolean" } },
                                                                { "message", new { type = "string" } },
                                                                { "executionTime", new { type = "integer" } },
                                                                { "cached", new { type = "boolean" } },
                                                                { "data", new { type = "array", items = new { type = "object" } } }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            return operation;
        }
    }
}
