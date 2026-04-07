using DynamicApi.Common;
using DynamicApi.Data;
using DynamicApi.Models;
using static DynamicApi.Models.TransactionModels;

namespace DynamicApi.Services
{
    /// <summary>
    /// Service for executing stored procedures with transaction support
    /// Provides business logic layer for dynamic transaction operations
    /// </summary>
    public class DynamicTransactionService
    {
        private readonly TransactionExecutor _executor;
        private readonly DynamicApiDbContext _dbContext;
        private readonly ILogger<DynamicTransactionService> _logger;

        public DynamicTransactionService(
            TransactionExecutor executor,
            DynamicApiDbContext dbContext,
            ILogger<DynamicTransactionService> logger)
        {
            _executor = executor ?? throw new ArgumentNullException(nameof(executor));
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Executes a stored procedure within a transaction
        /// </summary>
        public async Task<TransactionResponse<List<Dictionary<string, object>>>> ExecuteTransactionAsync(
            DynamicTransactionRequest request)
        {
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Executing transaction procedure: {ProcedureName}", request.StringFour);

                // Parse parameters from StringOne
                var parameters = _executor.ParseParameters(
                    request.StringOne, 
                    request.StringTwo, 
                    request.StringThree);

                // Add optional integer parameters
                if (request.IntOne.HasValue) parameters["IntOne"] = request.IntOne.Value;
                if (request.IntTwo.HasValue) parameters["IntTwo"] = request.IntTwo.Value;
                if (request.IntThree.HasValue) parameters["IntThree"] = request.IntThree.Value;
                if (request.IntFour.HasValue) parameters["IntFour"] = request.IntFour.Value;
                if (request.IntFive.HasValue) parameters["IntFive"] = request.IntFive.Value;
                if (request.IntSix.HasValue) parameters["IntSix"] = request.IntSix.Value;
                if (request.IntSeven.HasValue) parameters["IntSeven"] = request.IntSeven.Value;

                // Add optional date parameters
                if (request.DateOne.HasValue) parameters["DateOne"] = request.DateOne.Value;
                if (request.DateTwo.HasValue) parameters["DateTwo"] = request.DateTwo.Value;

                // Add PKId if provided
                if (request.PKId.HasValue) parameters["PKId"] = request.PKId.Value;

                // Execute transaction
                var (success, message, data, generatedId) = await _executor.ExecuteTransactionAsync(
                    request.StringFour, 
                    parameters);

                var executionTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

                // Log execution
                var executionLog = new ExecutionLog
                {
                    ProcedureName = request.StringFour,
                    Parameters = request.StringOne ?? string.Empty,
                    Status = success,
                    Message = message,
                    ExecutionTime = executionTime,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.ExecutionLogs.Add(executionLog);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Transaction procedure {ProcedureName} - Success: {Success}, GeneratedId: {GeneratedId}", 
                    request.StringFour, 
                    success, 
                    generatedId);

                return new TransactionResponse<List<Dictionary<string, object>>>
                {
                    Status = success,
                    Message = message,
                    Data = data,
                    TransactionId = generatedId,
                    ExecutionTimeMs = executionTime
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing transaction procedure {ProcedureName}", request.StringFour);

                var executionTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

                return new TransactionResponse<List<Dictionary<string, object>>>
                {
                    Status = false,
                    Message = "An error occurred executing the transaction. Please contact support if the problem persists.",
                    Data = new List<Dictionary<string, object>>(),
                    TransactionId = null,
                    ExecutionTimeMs = executionTime
                };
            }
        }
    }
}
