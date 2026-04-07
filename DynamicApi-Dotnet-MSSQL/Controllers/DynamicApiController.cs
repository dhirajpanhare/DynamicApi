using DynamicApi.Models;
using DynamicApi.Services;
using DynamicApi.Utilities;
using Microsoft.AspNetCore.Mvc;
using static DynamicApi.Models.ApiModels;
using static DynamicApi.Models.TransactionModels;

namespace DynamicApi.Controllers
{
    [ApiController]
    [Route("api/v1.0/[controller]")]
    public class DynamicApiController : ControllerBase
    {
        private readonly DynamicApiService _service;
        private readonly ProcedureMetadataExtractor _metadataExtractor;
        private readonly SwaggerSchemaGenerator _schemaGenerator;
        private readonly TransactionExecutor _transactionExecutor;
        private readonly ILogger<DynamicApiController> _logger;

        public DynamicApiController(
            DynamicApiService service,
            ProcedureMetadataExtractor metadataExtractor,
            SwaggerSchemaGenerator schemaGenerator,
            TransactionExecutor transactionExecutor,
            ILogger<DynamicApiController> logger)
        {
            _service = service;
            _metadataExtractor = metadataExtractor;
            _schemaGenerator = schemaGenerator;
            _transactionExecutor = transactionExecutor;
            _logger = logger;
        }

        /// <summary>
        /// Execute a stored procedure dynamically
        /// </summary>
        /// <param name="request">Procedure execution request</param>
        /// <returns>Procedure result</returns>
        [HttpPost("DynamicApiExecute")]
        [ProducesResponseType(typeof(ApiResponse<List<Dictionary<string, object>>>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> DynamicApiExecute([FromBody] ProcedureExecutionRequest request)
        {
            try
            {
                // Validate procedure name
                if (string.IsNullOrEmpty(request?.StringFour))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Procedure name is required",
                        Data = null
                    });
                }
                
                // Validate procedure name format - alphanumeric, underscore only
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.StringFour, @"^[a-zA-Z_][a-zA-Z0-9_]*$"))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Invalid procedure name format",
                        Data = null
                    });
                }
                
                // Validate parameters separators if provided
                if (!string.IsNullOrEmpty(request.StringTwo) && request.StringTwo.Length > 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Parameter separator must be single character",
                        Data = null
                    });
                }
                
                if (!string.IsNullOrEmpty(request.StringThree) && request.StringThree.Length > 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Key-value separator must be single character",
                        Data = null
                    });
                }

                var result = await _service.ExecuteProcedureAsync(
                    request.StringFour,
                    request.StringOne,
                    request.StringTwo,
                    request.StringThree);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DynamicApiExecute");
                return StatusCode(500, new ApiResponse<object>
                {
                    Status = false,
                    Message = "Internal server error",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Get auto-generated metadata and schema for a stored procedure
        /// </summary>
        /// <param name="procedureName">Name of the stored procedure</param>
        /// <returns>Procedure metadata, parameter info, examples, and Swagger schema</returns>
        [HttpGet("GetProcedureMetadata/{procedureName}")]
        [ProducesResponseType(typeof(ProcedureMetadataResponse), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetProcedureMetadata(string procedureName)
        {
            try
            {
                // Validate procedure name
                if (string.IsNullOrEmpty(procedureName))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Procedure name is required",
                        ExecutionTime = 0,
                        Cached = false,
                        Data = null
                    });
                }

                // Check if procedure exists
                var exists = await _metadataExtractor.ProcedureExistsAsync(procedureName);
                if (!exists)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Status = false,
                        Message = $"Procedure '{procedureName}' not found",
                        ExecutionTime = 0,
                        Cached = false,
                        Data = null
                    });
                }

                // Extract metadata
                var metadata = await _metadataExtractor.ExtractProcedureMetadataAsync(procedureName);

                // Generate schema and example
                var schema = _schemaGenerator.GenerateSchema(metadata);

                // Build response with parameter metadata
                var paramMetadata = metadata.Parameters.Select(p => new ParameterMetadata
                {
                    Name = p.Name,
                    Type = p.Type,
                    MaxLength = p.MaxLength,
                    Precision = p.Precision,
                    Scale = p.Scale,
                    IsNullable = p.IsNullable,
                    IsOutput = p.IsOutput
                }).ToList();

                var response = new ProcedureMetadataResponse
                {
                    ProcedureName = procedureName,
                    Parameters = paramMetadata,
                    ExampleRequest = new Dictionary<string, object>
                    {
                        { "stringOne", string.Join("|", metadata.Parameters.Where(p => !p.IsOutput).Select(p => $"{p.Name}=example_value")) },
                        { "stringTwo", "|" },
                        { "stringThree", "=" },
                        { "stringFour", procedureName }
                    },
                    SwaggerSchema = new Dictionary<string, object>
                    {
                        { "type", "object" },
                        { "description", $"Parameters for {procedureName}" },
                        { "properties", schema.Properties },
                        { "required", schema.Required }
                    }
                };

                _logger.LogInformation($"Retrieved metadata for procedure: {procedureName}");

                return Ok(new ApiResponse<ProcedureMetadataResponse>
                {
                    Status = true,
                    Message = "Metadata retrieved successfully",
                    ExecutionTime = 0,
                    Cached = false,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving metadata for procedure: {procedureName}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Status = false,
                    Message = "Error retrieving procedure metadata",
                    ExecutionTime = 0,
                    Cached = false,
                    Data = null
                });
            }
        }

        /// <summary>
        /// List all available stored procedures
        /// </summary>
        /// <returns>List of procedure names</returns>
        [HttpGet("ListProcedures")]
        [ProducesResponseType(typeof(ApiResponse<List<string>>), 200)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> ListProcedures()
        {
            try
            {
                var procedures = await _metadataExtractor.GetAllProceduresAsync();

                _logger.LogInformation($"Retrieved list of {procedures.Count} procedures");

                return Ok(new ApiResponse<List<string>>
                {
                    Status = true,
                    Message = $"Found {procedures.Count} procedures",
                    ExecutionTime = 0,
                    Cached = false,
                    Data = procedures
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing procedures");
                return StatusCode(500, new ApiResponse<object>
                {
                    Status = false,
                    Message = "Error retrieving procedures list",
                    ExecutionTime = 0,
                    Cached = false,
                    Data = null
                });
            }
        }

        /// <summary>
        /// Execute multiple stored procedures in a single transaction
        /// </summary>
        /// <param name="request">Transaction request with list of operations</param>
        /// <returns>Transaction results with operation status</returns>
        [HttpPost("ExecuteTransaction")]
        [ProducesResponseType(typeof(TransactionResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> ExecuteTransaction([FromBody] TransactionExecutionRequest request)
        {
            try
            {
                // Validate request
                if (request?.Operations == null || request.Operations.Count == 0)
                {
                    return BadRequest(new TransactionResponse
                    {
                        Status = false,
                        Message = "At least one operation is required",
                        ExecutionTime = 0,
                        Cached = false,
                        OperationCount = 0,
                        SuccessfulOperations = 0,
                        FailedOperations = 0,
                        Operations = new List<OperationResult>()
                    });
                }

                // Validate all operations
                foreach (var op in request.Operations)
                {
                    if (string.IsNullOrEmpty(op.ProcedureName))
                    {
                        return BadRequest(new TransactionResponse
                        {
                            Status = false,
                            Message = "All operations must have a procedure name",
                            ExecutionTime = 0,
                            Cached = false,
                            OperationCount = 0,
                            SuccessfulOperations = 0,
                            FailedOperations = 0,
                            Operations = new List<OperationResult>()
                        });
                    }

                    // Validate procedure name format
                    if (!System.Text.RegularExpressions.Regex.IsMatch(op.ProcedureName, @"^[a-zA-Z_][a-zA-Z0-9_]*$"))
                    {
                        return BadRequest(new TransactionResponse
                        {
                            Status = false,
                            Message = $"Invalid procedure name format: {op.ProcedureName}",
                            ExecutionTime = 0,
                            Cached = false,
                            OperationCount = 0,
                            SuccessfulOperations = 0,
                            FailedOperations = 0,
                            Operations = new List<OperationResult>()
                        });
                    }
                }

                _logger.LogInformation($"Executing transaction with {request.Operations.Count} operations");

                var result = await _transactionExecutor.ExecuteTransactionAsync(request.Operations);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ExecuteTransaction");
                return StatusCode(500, new TransactionResponse
                {
                    Status = false,
                    Message = "Internal server error during transaction execution",
                    ExecutionTime = 0,
                    Cached = false,
                    OperationCount = 0,
                    SuccessfulOperations = 0,
                    FailedOperations = 0,
                    Operations = new List<OperationResult>()
                });
            }
        }

        /// <summary>
        /// Generate a DynamicApiExecute request payload from a CREATE PROCEDURE definition.
        /// Paste your full CREATE PROCEDURE SQL and receive a pre-filled payload
        /// with sample values based on each parameter's data type.
        /// </summary>
        /// <param name="request">Request containing the SQL procedure definition</param>
        /// <returns>Ready-to-use DynamicApiExecute payload (direct object without wrapper)</returns>
        [HttpPost("GeneratePayload")]
        [ProducesResponseType(typeof(GeneratedPayloadResponse), 200)]
        [ProducesResponseType(400)]
        public IActionResult GeneratePayload([FromBody] GeneratePayloadRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.ProcedureDefinition))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Status  = false,
                    Message = "procedureDefinition is required in the request body",
                    Data    = null
                });
            }

            try
            {
                var payload = ProcedurePayloadGenerator.Generate(request.ProcedureDefinition);

                // Return only the four string fields without parameters array
                var response = new GeneratedPayloadResponse
                {
                    StringOne = payload.StringOne,
                    StringTwo = payload.StringTwo,
                    StringThree = payload.StringThree,
                    StringFour = payload.StringFour
                };

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Status  = false,
                    Message = ex.Message,
                    Data    = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating payload");
                return BadRequest(new ApiResponse<object>
                {
                    Status  = false,
                    Message = $"Failed to parse procedure definition: {ex.Message}",
                    Data    = null
                });
            }
        }
    }
}
