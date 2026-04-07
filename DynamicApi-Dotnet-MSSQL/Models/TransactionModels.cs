using System.Collections.Generic;

namespace DynamicApi.Models
{
    public class TransactionModels
    {
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
        /// Response for transaction execution
        /// </summary>
        public class TransactionResponse
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
        /// Metadata for procedure (used in info endpoint)
        /// </summary>
        public class ProcedureMetadataResponse
        {
            public string ProcedureName { get; set; }
            public List<ParameterMetadata> Parameters { get; set; } = new();
            public Dictionary<string, object> ExampleRequest { get; set; }
            public Dictionary<string, object> SwaggerSchema { get; set; }
        }

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
