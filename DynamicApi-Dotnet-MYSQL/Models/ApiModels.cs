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
            public T? Data { get; set; }
        }

        public class ProcedureResult
        {
            public List<Dictionary<string, object>> Result { get; set; }
        }
    }
}
