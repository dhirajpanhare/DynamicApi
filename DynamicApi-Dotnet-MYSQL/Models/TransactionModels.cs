using System.Collections.Generic;

namespace DynamicApi.Models
{
    public class TransactionModels
    {
        /// <summary>
        /// Request model for dynamic transaction API execution
        /// Supports multiple stored procedure calls within a single transaction
        /// </summary>
        public class DynamicTransactionRequest
        {
            /// <summary>
            /// Parameters string (e.g., "p_Id=1|p_Name=Test")
            /// </summary>
            public string? StringOne { get; set; }

            /// <summary>
            /// Parameter separator (default: "|")
            /// </summary>
            public string StringTwo { get; set; } = "|";

            /// <summary>
            /// Key-value separator (default: "=")
            /// </summary>
            public string StringThree { get; set; } = "=";

            /// <summary>
            /// Stored procedure name
            /// </summary>
            public string StringFour { get; set; } = string.Empty;

            /// <summary>
            /// Optional integer parameters
            /// </summary>
            public int? IntOne { get; set; }
            public int? IntTwo { get; set; }
            public int? IntThree { get; set; }
            public int? IntFour { get; set; }
            public int? IntFive { get; set; }
            public int? IntSix { get; set; }
            public int? IntSeven { get; set; }

            /// <summary>
            /// Optional date parameters
            /// </summary>
            public DateTime? DateOne { get; set; }
            public DateTime? DateTwo { get; set; }

            /// <summary>
            /// Primary key identifier
            /// </summary>
            public int? PKId { get; set; }
        }

        /// <summary>
        /// Response model for transaction execution
        /// </summary>
        public class TransactionResponse<T>
        {
            public bool Status { get; set; }
            public string? Message { get; set; }
            public T? Data { get; set; }
            public int? TransactionId { get; set; }
            public int ExecutionTimeMs { get; set; }
        }

        /// <summary>
        /// Transaction execution log entry
        /// </summary>
        public class TransactionExecutionLog
        {
            public int Id { get; set; }
            public string? ProcedureName { get; set; }
            public string? Parameters { get; set; }
            public bool Status { get; set; }
            public string? Message { get; set; }
            public int ExecutionTime { get; set; }
            public bool IsTransaction { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        }

        /// <summary>
        /// Request to execute multiple stored procedures in a transaction
        /// </summary>
        public class TransactionExecutionRequest
        {
            public bool Transaction { get; set; } = true;
            public List<TransactionOperation> Operations { get; set; } = new();
        }

        /// <summary>
        /// Single operation within a transaction
        /// </summary>
        public class TransactionOperation
        {
            public string ProcedureName { get; set; }
            public string StringOne { get; set; } // Parameters
            public string StringTwo { get; set; } = "|"; // Parameter separator
            public string StringThree { get; set; } = "="; // Key-value separator
        }

        /// <summary>
        /// Result of a single operation in transaction
        /// </summary>
        public class OperationResult
        {
            public string ProcedureName { get; set; }
            public bool Status { get; set; }
            public string Message { get; set; }
            public int ExecutionTime { get; set; }
            public List<Dictionary<string, object>> Data { get; set; } = new();
        }

        /// <summary>
        /// Transaction response structure
        /// </summary>
        public class TransactionExecutionResponse
        {
            public bool Status { get; set; }
            public string Message { get; set; }
            public int ExecutionTime { get; set; }
            public bool Cached { get; set; } = false;
            public int OperationCount { get; set; }
            public int SuccessfulOperations { get; set; }
            public int FailedOperations { get; set; }
            public List<OperationResult> Operations { get; set; } = new();
        }

        /// <summary>
        /// Metadata for procedure (used in metadata endpoint)
        /// </summary>
        public class ProcedureMetadataResponse
        {
            public string ProcedureName { get; set; }
            public List<ParameterMetadata> Parameters { get; set; } = new();
            public Dictionary<string, object> ExampleRequest { get; set; }
            public Dictionary<string, object> SwaggerSchema { get; set; }
        }

        /// <summary>
        /// Parameter metadata definition
        /// </summary>
        public class ParameterMetadata
        {
            public string Name { get; set; }
            public string Type { get; set; }
            public int? MaxLength { get; set; }
            public int? Precision { get; set; }
            public int? Scale { get; set; }
            public bool IsNullable { get; set; }
            public bool IsOutput { get; set; }
        }
    }
}
