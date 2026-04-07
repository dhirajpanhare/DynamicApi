using DynamicApi.Common;
using DynamicApi.Data;
using DynamicApi.Models;
using static DynamicApi.Models.ApiModels;

namespace DynamicApi.Services
{
    public class DynamicApiService
    {
        private readonly StoredProcedureExecutor _executor;
        private readonly DynamicApiDbContext _dbContext;
        private readonly ILogger<DynamicApiService> _logger;

        public DynamicApiService(
            StoredProcedureExecutor executor,
            DynamicApiDbContext dbContext,
            ILogger<DynamicApiService> logger)
        {
            _executor = executor;
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<ApiResponse<List<Dictionary<string, object>>>> ExecuteProcedureAsync(
            string procedureName,
            string parameters,
            string parameterSeparator = "|",
            string keyValueSeparator = "=",
            string userEmail = "anonymous")
        {
            var overallStartTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation($"Executing procedure: {procedureName}");

                var (success, message, data, executionTimeMs) = await _executor.ExecuteAsync(procedureName, parameters);

                // Log execution
                var executionLog = new ExecutionLog
                {
                    ProcedureName = procedureName,
                    Parameters = parameters,
                    Status = success,
                    Message = message,
                    ExecutionTime = executionTimeMs,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.ExecutionLogs.Add(executionLog);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation($"Procedure {procedureName} - Success: {success}");

                return new ApiResponse<List<Dictionary<string, object>>>
                {
                    Status = success,
                    Message = message,
                    ExecutionTime = executionTimeMs,
                    Cached = false,
                    Data = data
                };
            }
            catch (Exception ex)
            {
                // Log full error server-side for debugging
                _logger.LogError(ex, $"Error executing procedure {procedureName}");
                
                var overallExecutionTime = (int)(DateTime.UtcNow - overallStartTime).TotalMilliseconds;

                // Return generic error message to client (don't expose details)
                return new ApiResponse<List<Dictionary<string, object>>>
                {
                    Status = false,
                    Message = "An error occurred executing the procedure. Please contact support if the problem persists.",
                    ExecutionTime = overallExecutionTime,
                    Cached = false,
                    Data = new List<Dictionary<string, object>>()
                };
            }
        }
    }
}
