using System.Text.RegularExpressions;

namespace DynamicApi.Utilities
{
    /// <summary>
    /// Parser that reads a CREATE PROCEDURE SQL definition (MySQL or MSSQL syntax)
    /// and generates a ready-to-use DynamicApiExecute request payload.
    /// </summary>
    public static class ProcedurePayloadGenerator
    {
        // ── Public entry point ─────────────────────────────────────────────────

        /// <summary>
        /// Parse the SQL CREATE PROCEDURE definition and return the generated payload.
        /// </summary>
        public static GeneratedPayload Generate(string procedureDefinition)
        {
            if (string.IsNullOrWhiteSpace(procedureDefinition))
                throw new ArgumentException("Procedure definition is required.");

            var (procedureName, parameters) = ParseDefinition(procedureDefinition);

            const string paramSep = "|";
            const string kvSep = "=";

            var stringOne = string.Join(paramSep,
                parameters.Select(p => $"{p.Name}{kvSep}{p.SampleValue}"));

            return new GeneratedPayload
            {
                StringOne   = stringOne,
                StringTwo   = paramSep,
                StringThree = kvSep,
                StringFour  = procedureName,
                Parameters  = parameters
            };
        }

        // ── Parser internals ───────────────────────────────────────────────────

        private static (string procedureName, List<ProcedureParameter> parameters)
            ParseDefinition(string sql)
        {
            // Extract procedure name
            // Covers MySQL  : CREATE [DEFINER=…] PROCEDURE `Name`(
            // Covers MSSQL  : CREATE [OR ALTER] PROC[EDURE] [schema.]Name (
            var nameRegex = new Regex(
                @"CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?(?:OR\s+ALTER\s+)?PROC(?:EDURE)?\s+" +
                @"(?:\[?[^\s\[.\]]+\]?\.)?" +
                @"\[?`?([a-zA-Z_][a-zA-Z0-9_]*)`?\]?\s*[\(@]",
                RegexOptions.IgnoreCase);

            var nameMatch = nameRegex.Match(sql);
            if (!nameMatch.Success)
                throw new ArgumentException(
                    "Could not extract procedure name. Make sure the SQL starts with CREATE PROCEDURE.");

            var procedureName = nameMatch.Groups[1].Value;

            // Find outer parameter block ( … )
            int parenStart = sql.IndexOf('(', nameMatch.Index + nameMatch.Length - 1);
            if (parenStart < 0)
                return (procedureName, new List<ProcedureParameter>());

            int depth = 0, parenEnd = -1;
            for (int i = parenStart; i < sql.Length; i++)
            {
                if (sql[i] == '(') depth++;
                else if (sql[i] == ')') { depth--; if (depth == 0) { parenEnd = i; break; } }
            }

            var paramBlock = parenEnd > parenStart
                ? sql.Substring(parenStart + 1, parenEnd - parenStart - 1).Trim()
                : string.Empty;

            if (string.IsNullOrWhiteSpace(paramBlock))
                return (procedureName, new List<ProcedureParameter>());

            // Split on commas not inside nested parens
            var paramStrings = SplitParams(paramBlock);
            var parameters = new List<ProcedureParameter>();

            // MySQL  : IN|OUT|INOUT name TYPE
            var mysqlRegex = new Regex(
                @"^(IN|OUT|INOUT)\s+[`\[]?([a-zA-Z_@][a-zA-Z0-9_]*)[`\]]?\s+([A-Za-z]+(?:\([^)]*\))?)",
                RegexOptions.IgnoreCase);

            // MSSQL  : @name TYPE [= default] [OUTPUT]
            var mssqlRegex = new Regex(
                @"^@([a-zA-Z_][a-zA-Z0-9_]*)\s+([A-Za-z]+(?:\([^)]*\))?)",
                RegexOptions.IgnoreCase);

            foreach (var paramStr in paramStrings)
            {
                if (string.IsNullOrWhiteSpace(paramStr)) continue;

                string name, mode, type;

                var mysqlMatch = mysqlRegex.Match(paramStr.Trim());
                var mssqlMatch = mssqlRegex.Match(paramStr.Trim());

                if (mysqlMatch.Success)
                {
                    mode = mysqlMatch.Groups[1].Value.ToUpper();
                    name = mysqlMatch.Groups[2].Value.Trim('`', '[', ']');
                    type = mysqlMatch.Groups[3].Value;
                }
                else if (mssqlMatch.Success)
                {
                    name = "@" + mssqlMatch.Groups[1].Value;
                    type = mssqlMatch.Groups[2].Value;
                    mode = Regex.IsMatch(paramStr, @"\bOUTPUT\b", RegexOptions.IgnoreCase)
                        ? "OUT" : "IN";
                }
                else
                {
                    // Fallback — skip unparseable params
                    continue;
                }

                // OUT-only params have no input value — skip them
                if (mode == "OUT") continue;

                parameters.Add(new ProcedureParameter
                {
                    Name        = name,
                    Mode        = mode,
                    Type        = type,
                    SampleValue = SampleValueForType(type)
                });
            }

            return (procedureName, parameters);
        }

        private static List<string> SplitParams(string block)
        {
            var result = new List<string>();
            var current = new System.Text.StringBuilder();
            int depth = 0;
            foreach (char ch in block)
            {
                if (ch == '(') depth++;
                else if (ch == ')') depth--;
                if (ch == ',' && depth == 0)
                {
                    result.Add(current.ToString().Trim());
                    current.Clear();
                }
                else current.Append(ch);
            }
            if (current.Length > 0) result.Add(current.ToString().Trim());
            return result;
        }

        private static string SampleValueForType(string sqlType)
        {
            var t = sqlType.Trim().ToUpper();

            if (Regex.IsMatch(t, @"^(VARCHAR|CHAR|NVARCHAR|NCHAR|TEXT|NTEXT|LONGTEXT|MEDIUMTEXT|TINYTEXT|CLOB)"))
                return "SampleText";
            if (Regex.IsMatch(t, @"^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|MEDIUMINT)"))
                return "1";
            if (Regex.IsMatch(t, @"^(DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL|MONEY|SMALLMONEY)"))
                return "0.00";
            if (Regex.IsMatch(t, @"^(BIT|BOOLEAN|BOOL)"))
                return "1";
            if (Regex.IsMatch(t, @"^DATETIME2"))
                return "2026-01-01 00:00:00";
            if (Regex.IsMatch(t, @"^(DATETIME|SMALLDATETIME|TIMESTAMP)"))
                return "2026-01-01 00:00:00";
            if (Regex.IsMatch(t, @"^DATE"))
                return "2026-01-01";
            if (Regex.IsMatch(t, @"^TIME"))
                return "00:00:00";
            if (Regex.IsMatch(t, @"^(UNIQUEIDENTIFIER|UUID)"))
                return "00000000-0000-0000-0000-000000000000";
            if (Regex.IsMatch(t, @"^(XML|JSON)"))
                return "{}";
            if (Regex.IsMatch(t, @"^(VARBINARY|BINARY|IMAGE|BLOB|LONGBLOB|MEDIUMBLOB|TINYBLOB)"))
                return string.Empty;

            return "Value";
        }
    }

    // ── DTOs ───────────────────────────────────────────────────────────────────

    public class GeneratedPayload
    {
        public string StringOne   { get; set; } = string.Empty;
        public string StringTwo   { get; set; } = "|";
        public string StringThree { get; set; } = "=";
        public string StringFour  { get; set; } = string.Empty;
        public List<ProcedureParameter> Parameters { get; set; } = new();
    }

    public class GeneratedPayloadResponse
    {
        public string StringOne   { get; set; } = string.Empty;
        public string StringTwo   { get; set; } = "|";
        public string StringThree { get; set; } = "=";
        public string StringFour  { get; set; } = string.Empty;
    }

    public class ProcedureParameter
    {
        public string Name        { get; set; } = string.Empty;
        public string Mode        { get; set; } = "IN";
        public string Type        { get; set; } = string.Empty;
        public string SampleValue { get; set; } = string.Empty;
    }

    public class GeneratePayloadRequest
    {
        /// <summary>Full CREATE PROCEDURE SQL text (MySQL or MSSQL syntax)</summary>
        public string ProcedureDefinition { get; set; } = string.Empty;
    }
}
