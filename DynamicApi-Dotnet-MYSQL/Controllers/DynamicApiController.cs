using DynamicApi.Models;
using DynamicApi.Services;
using Microsoft.AspNetCore.Mvc;
using static DynamicApi.Models.ApiModels;

namespace DynamicApi.Controllers
{
    [ApiController]
    [Route("api/v1.0/[controller]")]
    public class DynamicApiController : ControllerBase
    {
        private readonly DynamicApiService _service;
        private readonly ILogger<DynamicApiController> _logger;

        public DynamicApiController(
            DynamicApiService service,
            ILogger<DynamicApiController> logger)
        {
            _service = service;
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
    }
}
