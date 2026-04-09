/**
 * Procedure Payload Generator
 * Parses a CREATE PROCEDURE SQL definition and generates a
 * ready-to-use DynamicApiExecute request payload.
 *
 * Supports both MySQL and MSSQL syntax.
 */

/**
 * Map a SQL data type to a representative sample value string.
 * @param {string} sqlType  e.g. "VARCHAR(150)", "INT", "DECIMAL(10,2)"
 * @returns {string}
 */
function sampleValueForType(sqlType) {
    const t = sqlType.toUpperCase().trim();

    if (/^(VARCHAR|CHAR|NVARCHAR|NCHAR|TEXT|NTEXT|LONGTEXT|MEDIUMTEXT|TINYTEXT|CLOB)/.test(t))
        return 'SampleText';
    if (/^(INT|INTEGER|BIGINT|SMALLINT|TINYINT|MEDIUMINT)/.test(t))
        return '1';
    if (/^(DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL|MONEY|SMALLMONEY)/.test(t))
        return '0.00';
    if (/^(BIT|BOOLEAN|BOOL)/.test(t))
        return '1';
    if (/^DATETIME2/.test(t))
        return '2026-01-01 00:00:00';
    if (/^(DATETIME|SMALLDATETIME|TIMESTAMP)/.test(t))
        return '2026-01-01 00:00:00';
    if (/^DATE/.test(t))
        return '2026-01-01';
    if (/^TIME/.test(t))
        return '00:00:00';
    if (/^(UNIQUEIDENTIFIER|UUID)/.test(t))
        return '00000000-0000-0000-0000-000000000000';
    if (/^(XML|JSON)/.test(t))
        return '{}';
    if (/^(VARBINARY|BINARY|IMAGE|BLOB|LONGBLOB|MEDIUMBLOB|TINYBLOB)/.test(t))
        return '';

    return 'Value';
}

/**
 * Parse a CREATE PROCEDURE SQL definition (MySQL or MSSQL).
 *
 * @param {string} sql  Full procedure definition text
 * @returns {{ procedureName: string, parameters: Array<{name, mode, type, sampleValue}> }}
 * @throws {Error} if SQL cannot be parsed
 */
function parseProcedureDefinition(sql) {
    if (!sql || typeof sql !== 'string' || sql.trim() === '') {
        throw new Error('Procedure definition is required');
    }

    const normalized = sql.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // ── Extract procedure name ────────────────────────────────────────────────
    // Handles:
    //   MySQL : CREATE [DEFINER=...] PROCEDURE `Name`(
    //   MSSQL : CREATE [OR ALTER] PROC[EDURE] [schema.]Name (
    const nameMatch = normalized.match(
        /CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?(?:OR\s+ALTER\s+)?PROC(?:EDURE)?\s+(?:\[?[^\s\[.\]]+\]?\.)?\[?`?([a-zA-Z_][a-zA-Z0-9_]*)`?\]?\s*[\(@]/i
    );

    if (!nameMatch) {
        throw new Error('Could not extract procedure name. Make sure the SQL starts with CREATE PROCEDURE.');
    }

    const procedureName = nameMatch[1];

    // ── Extract the parameter block between the outermost ( ) ────────────────
    const parenStart = normalized.indexOf('(', nameMatch.index + nameMatch[0].length - 1);
    if (parenStart === -1) {
        // No parameters
        return { procedureName, parameters: [] };
    }

    let depth = 0;
    let parenEnd = -1;
    for (let i = parenStart; i < normalized.length; i++) {
        if (normalized[i] === '(') depth++;
        else if (normalized[i] === ')') {
            depth--;
            if (depth === 0) { parenEnd = i; break; }
        }
    }

    const paramBlock = parenEnd > parenStart
        ? normalized.slice(parenStart + 1, parenEnd).trim()
        : '';

    if (!paramBlock) {
        return { procedureName, parameters: [] };
    }

    // ── Parse individual parameters ──────────────────────────────────────────
    // Split on commas that are NOT inside nested parentheses
    const paramStrings = [];
    let current = '';
    let d = 0;
    for (const ch of paramBlock) {
        if (ch === '(') d++;
        else if (ch === ')') d--;
        if (ch === ',' && d === 0) {
            paramStrings.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) paramStrings.push(current.trim());

    const parameters = [];

    for (const paramStr of paramStrings) {
        if (!paramStr) continue;

        let name = '';
        let mode = 'IN';
        let type = 'VARCHAR(255)';

        // MySQL: IN|OUT|INOUT p_Name DATATYPE
        const mysqlMatch = paramStr.match(
            /^(IN|OUT|INOUT)\s+([`\[]?[a-zA-Z_@][a-zA-Z0-9_]*[`\]]?)\s+([A-Za-z]+(?:\([^)]*\))?)/i
        );

        // MSSQL:  @Name DATATYPE [= default] [OUTPUT]
        const mssqlMatch = paramStr.match(
            /^@([a-zA-Z_][a-zA-Z0-9_]*)\s+([A-Za-z]+(?:\([^)]*\))?)/i
        );

        if (mysqlMatch) {
            mode = mysqlMatch[1].toUpperCase();
            name = mysqlMatch[2].replace(/[`\[\]]/g, '');
            type = mysqlMatch[3];
        } else if (mssqlMatch) {
            name = '@' + mssqlMatch[1];
            type = mssqlMatch[2];
            mode = /OUTPUT/i.test(paramStr) ? 'OUT' : 'IN';
        } else {
            // Fallback: treat the whole token as a name
            const tokenMatch = paramStr.match(/([`@]?[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (tokenMatch) name = tokenMatch[1];
            else continue; // skip unparseable
        }

        // Only include IN / INOUT parameters in the payload (OUT params have no input value)
        if (mode === 'OUT') continue;

        parameters.push({
            name,
            mode,
            type,
            sampleValue: sampleValueForType(type)
        });
    }

    return { procedureName, parameters };
}

/**
 * Generate a DynamicApiExecute-compatible request payload from a CREATE PROCEDURE definition.
 *
 * @param {string} procedureDefinition  Full SQL CREATE PROCEDURE text
 * @returns {{
 *   stringOne: string,
 *   stringTwo: string,
 *   stringThree: string,
 *   stringFour: string,
 *   parameters: Array<{name, mode, type, sampleValue}>
 * }}
 */
function generatePayload(procedureDefinition) {
    const { procedureName, parameters } = parseProcedureDefinition(procedureDefinition);

    const paramSeparator = '|';
    const kvSeparator = '=';

    const stringOne = parameters
        .map(p => `${p.name}${kvSeparator}${p.sampleValue}`)
        .join(paramSeparator);

    return {
        stringOne,
        stringTwo: paramSeparator,
        stringThree: kvSeparator,
        stringFour: procedureName,
        parameters
    };
}

module.exports = { generatePayload, parseProcedureDefinition, sampleValueForType };
