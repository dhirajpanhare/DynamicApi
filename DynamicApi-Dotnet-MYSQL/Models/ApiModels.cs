namespace DynamicApi.Models
{
    public class ApiModels
    {
        public class ProcedureExecutionRequest
        {
            public string StringOne { get; set; } // Parameters
            public string StringTwo { get; set; } = "|"; // Parameter separator
            public string StringThree { get; set; } = "="; // Key-value separator
            public string StringFour { get; set; } // Procedure name
        }

        public class ApiResponse<T>
        {
            public bool Status { get; set; }
            public string? Message { get; set; }
            public int ExecutionTime { get; set; } = 0; // milliseconds
            public bool Cached { get; set; } = false;   // defaults to false
            public T? Data { get; set; }
        }

        public class ProcedureResult
        {
            public List<Dictionary<string, object>> Result { get; set; }
        }
    }
}
