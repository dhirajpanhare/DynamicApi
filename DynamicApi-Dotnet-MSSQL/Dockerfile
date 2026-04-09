# Multi-stage build for .NET MSSQL API
# Production-optimized Docker image for Google Cloud Run

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 as build

WORKDIR /src

# Copy project files
COPY ["DynamicApi.csproj", "./"]

# Restore dependencies
RUN dotnet restore "DynamicApi.csproj"

# Copy remaining source code
COPY . .

# Build the application
RUN dotnet build "DynamicApi.csproj" \
    -c Release \
    -o /app/build \
    --no-restore

# Publish the application
RUN dotnet publish "DynamicApi.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:DebugType=none \
    /p:DebugSymbols=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published app from build stage
COPY --from=build /app/publish .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1.0/DynamicApi/Health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "DynamicApi.dll"]
