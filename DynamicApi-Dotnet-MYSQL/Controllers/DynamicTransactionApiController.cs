using DynamicApi.Models;
using DynamicApi.Services;
using Microsoft.AspNetCore.Mvc;
using static DynamicApi.Models.ApiModels;
using static DynamicApi.Models.TransactionModels;

namespace DynamicApi.Controllers
{
    /// <summary>
    /// Dynamic Transaction API Controller
    /// Executes stored procedures with full transaction support (commit/rollback)
    /// Ideal for operations requiring atomicity (header + detail inserts, multi-step workflows)
    /// </summary>
    [ApiController]
    [Route("api/v1.0/[controller]")]
    [Produces("application/json")]
    public class DynamicTransactionApiController : ControllerBase
    {
        private readonly DynamicTransactionService _transactionService;
        private readonly ILogger<DynamicTransactionApiController> _logger;

        public DynamicTransactionApiController(
            DynamicTransactionService transactionService,
            ILogger<DynamicTransactionApiController> logger)
        {
            _transactionService = transactionService ?? throw new ArgumentNullException(nameof(transactionService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Execute a stored procedure within a database transaction
        /// All operations are atomic - either all succeed or all are rolled back
        /// </summary>
        /// <param name="request">Transaction execution request with procedure name and parameters</param>
        /// <returns>Transaction execution result with generated IDs if applicable</returns>
        /// <response code="200">Transaction executed successfully</response>
        /// <response code="400">Invalid request parameters</response>
        /// <response code="500">Internal server error or transaction rollback</response>
        /// <remarks>
        /// Sample request:
        /// 
        ///     POST /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute
        ///     {
        ///         "stringOne": "p_DBId=1|p_DivisionId=1|p_DocumentDate=2026-04-01|p_CreatedId=10",
        ///         "stringTwo": "|",
        ///         "stringThree": "=",
        ///         "stringFour": "Transaction_Header_Insert"
        ///     }
        ///     
        /// For procedures with output parameters, the generated ID will be returned in TransactionId field.
        /// 
        /// Parameter format:
        /// - stringOne: Pipe-delimited key-value pairs (e.g., "p_Key=Value|p_Key2=Value2")
        /// - stringTwo: Parameter separator (default: "|")
        /// - stringThree: Key-value separator (default: "=")
        /// - stringFour: Stored procedure name (required)
        /// - intOne through intSeven: Optional integer parameters
        /// - dateOne, dateTwo: Optional date parameters
        /// - pkId: Optional primary key identifier
        /// </remarks>
        [HttpPost("DynamicTransactionApiExecute")]
        [ProducesResponseType(typeof(TransactionResponse<List<Dictionary<string, object>>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DynamicTransactionApiExecute([FromBody] DynamicTransactionRequest request)
        {
            try
            {
                // Validate procedure name
                if (string.IsNullOrEmpty(request?.StringFour))
                {
                    _logger.LogWarning("DynamicTransactionApiExecute: Procedure name is required");
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Procedure name (StringFour) is required",
                        Data = null
                    });
                }

                // Validate procedure name format - alphanumeric, underscore only
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.StringFour, @"^[a-zA-Z_][a-zA-Z0-9_]*$"))
                {
                    _logger.LogWarning("DynamicTransactionApiExecute: Invalid procedure name format: {ProcedureName}", 
                        request.StringFour);
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Invalid procedure name format. Only alphanumeric characters and underscores allowed.",
                        Data = null
                    });
                }

                // Validate separators
                if (!string.IsNullOrEmpty(request.StringTwo) && request.StringTwo.Length > 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Parameter separator (StringTwo) must be a single character",
                        Data = null
                    });
                }

                if (!string.IsNullOrEmpty(request.StringThree) && request.StringThree.Length > 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Status = false,
                        Message = "Key-value separator (StringThree) must be a single character",
                        Data = null
                    });
                }

                _logger.LogInformation("Executing transaction: {ProcedureName}", request.StringFour);

                var result = await _transactionService.ExecuteTransactionAsync(request);

                if (result.Status)
                {
                    return Ok(result);
                }
                else
                {
                    // Return 400 for business logic failures (e.g., validation errors from SP)
                    return BadRequest(result);
                }
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid parameters in DynamicTransactionApiExecute");
                return BadRequest(new ApiResponse<object>
                {
                    Status = false,
                    Message = $"Invalid parameters: {ex.Message}",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in DynamicTransactionApiExecute");
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
                {
                    Status = false,
                    Message = "An unexpected error occurred. The transaction has been rolled back.",
                    Data = null
                });
            }
        }

        /// <summary>
        /// Health check endpoint for transaction API
        /// </summary>
        /// <returns>API status</returns>
        [HttpGet("health")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public IActionResult Health()
        {
            return Ok(new ApiResponse<object>
            {
                Status = true,
                Message = "DynamicTransactionApi is running",
                Data = new
                {
                    Timestamp = DateTime.UtcNow,
                    Version = "1.0",
                    Features = new[]
                    {
                        "Transaction support with automatic rollback",
                        "Dynamic stored procedure execution",
                        "Output parameter support",
                        "Comprehensive logging"
                    }
                }
            });
        }
    }
}
