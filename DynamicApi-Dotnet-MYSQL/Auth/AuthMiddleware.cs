using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace DynamicApi.Auth;

/// <summary>
/// Flexible authentication middleware.
///
/// Priority order:
///  1. AUTH_SERVICE_URL â€” delegate token validation to the project's own auth API.
///  2. AUTH_MODE        â€” none / token / jwt / hybrid (local validation).
/// </summary>
public class AuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthMiddleware> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private static readonly string[] _publicPaths =
    [
        "/health",
        "/swagger",
        "/api/v1.0/dynamicapi/health"
    ];

    public AuthMiddleware(
        RequestDelegate next,
        IConfiguration config,
        ILogger<AuthMiddleware> logger,
        IHttpClientFactory httpClientFactory)
    {
        _next = next;
        _config = config;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (_publicPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var token = ExtractBearerToken(context);

        // â”€â”€ 1. External auth service (highest priority) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        var authServiceUrl = _config["AUTH_SERVICE_URL"];
        if (!string.IsNullOrWhiteSpace(authServiceUrl))
        {
            if (string.IsNullOrEmpty(token))
            {
                await WriteUnauthorized(context, "Authorization header with Bearer token required");
                return;
            }
            var valid = await CallAuthServiceAsync(token, authServiceUrl);
            if (valid) { await _next(context); return; }
            _logger.LogWarning("AUTH | Auth service rejected token | IP:{IP}", context.Connection.RemoteIpAddress);
            await WriteForbidden(context, "Invalid or expired token");
            return;
        }

        // â”€â”€ 2. AUTH_MODE fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        var mode = (_config["AUTH_MODE"] ?? "none").Trim().ToLowerInvariant();

        if (mode == "none") { await _next(context); return; }

        if (string.IsNullOrEmpty(token))
        {
            await WriteUnauthorized(context, "Authorization header with Bearer token required");
            return;
        }

        if (mode == "token")
        {
            if (IsValidStaticToken(token)) { await _next(context); return; }
            _logger.LogWarning("AUTH | Invalid static token | IP:{IP}", context.Connection.RemoteIpAddress);
            await WriteForbidden(context, "Invalid token"); return;
        }

        if (mode == "jwt")
        {
            if (await VerifyJwtAsync(token)) { await _next(context); return; }
            _logger.LogWarning("AUTH | Invalid JWT | IP:{IP}", context.Connection.RemoteIpAddress);
            await WriteForbidden(context, "Invalid or expired token"); return;
        }

        if (mode == "hybrid")
        {
            if (IsValidStaticToken(token) || await VerifyJwtAsync(token)) { await _next(context); return; }
            _logger.LogWarning("AUTH | Invalid hybrid auth | IP:{IP}", context.Connection.RemoteIpAddress);
            await WriteForbidden(context, "Invalid or expired token"); return;
        }

        _logger.LogError("AUTH | Unknown AUTH_MODE value: \"{Mode}\"", mode);
        await WriteError(context, "Server authentication misconfiguration");
    }

    private static string? ExtractBearerToken(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (authHeader != null && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return authHeader["Bearer ".Length..].Trim();
        return null;
    }

    private bool IsValidStaticToken(string token)
    {
        var raw = _config["STATIC_TOKENS"] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        return raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Contains(token);
    }

    private async Task<bool> VerifyJwtAsync(string token)
    {
        var raw = _config["JWT_SECRETS"] ?? _config["Jwt:Secret"] ?? string.Empty;
        var secrets = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var handler = new JsonWebTokenHandler();
        foreach (var secret in secrets)
        {
            var result = await handler.ValidateTokenAsync(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = false, ValidateAudience = false, ClockSkew = TimeSpan.Zero
            });
            if (result.IsValid) return true;
        }
        return false;
    }

    private async Task<bool> CallAuthServiceAsync(string token, string serviceUrl)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("AuthService");
            using var request = new HttpRequestMessage(HttpMethod.Post, serviceUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var response = await client.SendAsync(request, cts.Token);
            if (!response.IsSuccessStatusCode) return false;

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            return doc.RootElement.TryGetProperty("status", out var prop) && prop.GetBoolean();
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("AUTH | Auth service timed out: {Url}", serviceUrl);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError("AUTH | Auth service error: {Message}", ex.Message);
            return false;
        }
    }

    private static async Task WriteUnauthorized(HttpContext ctx, string msg)
    { ctx.Response.StatusCode = 401; ctx.Response.ContentType = "application/json";
      await ctx.Response.WriteAsJsonAsync(new { status = false, message = msg, data = (object?)null }); }

    private static async Task WriteForbidden(HttpContext ctx, string msg)
    { ctx.Response.StatusCode = 403; ctx.Response.ContentType = "application/json";
      await ctx.Response.WriteAsJsonAsync(new { status = false, message = msg, data = (object?)null }); }

    private static async Task WriteError(HttpContext ctx, string msg)
    { ctx.Response.StatusCode = 500; ctx.Response.ContentType = "application/json";
      await ctx.Response.WriteAsJsonAsync(new { status = false, message = msg, data = (object?)null }); }
}
