using DynamicApi.Data;
using DynamicApi.Services;
using DynamicApi.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1.0", new OpenApiInfo { Title = "Dynamic API", Version = "v1.0" });
});

// ============================================================================
// CONFIGURE DATABASE CONNECTION
// ============================================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' not found in configuration");
}

Console.WriteLine($"[STARTUP] Database connection configured");
Console.WriteLine($"[STARTUP] Environment: {builder.Environment.EnvironmentName}");

builder.Services.AddDbContext<DynamicApiDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Add Services - Pass the connection string directly
builder.Services.AddScoped<StoredProcedureExecutor>(provider => 
    new StoredProcedureExecutor(connectionString));
builder.Services.AddScoped<DynamicApiService>();

// Add CORS with restricted origins
var corsOrigins = builder.Configuration["CorsOrigins"]?.Split(',') ?? new[] { "http://localhost:3000", "http://localhost:8000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", builder =>
    {
        builder.WithOrigins(corsOrigins.Select(o => o.Trim()).ToArray())
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
    
    // Restrict development to localhost only
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowDevelopment", builder =>
        {
            builder.WithOrigins("http://localhost:3000", "http://localhost:8000", "http://localhost:5000")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
        });
    }
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1.0/swagger.json", "Dynamic API V1.0"));
}

app.UseHttpsRedirection();
app.UseCors(app.Environment.IsDevelopment() ? "AllowDevelopment" : "AllowSpecificOrigins");
app.MapControllers();

// ============================================================================
// STARTUP BANNER
// ============================================================================
Console.WriteLine("");
Console.WriteLine(new string('=', 60));
Console.WriteLine("  .NET Dynamic API - Development Server Started");
Console.WriteLine(new string('=', 60));
Console.WriteLine($"[STARTUP] Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"[STARTUP] CORS Origins: {string.Join(", ", corsOrigins.Select(o => o.Trim()))}");
Console.WriteLine("");
Console.WriteLine("[STARTUP] API Endpoints:");
Console.WriteLine("  - Swagger UI: http://localhost:5000/swagger/index.html");
Console.WriteLine("  - API Endpoint: http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute");
Console.WriteLine("");
Console.WriteLine("Press CTRL+C to shut down");
Console.WriteLine(new string('=', 60) + "");

app.Run();
