# Multi-stage build for Django MSSQL API
# Production-optimized Docker image for Google Cloud Run

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies including ODBC driver
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libodbc1 \
    odbcinst1debian2 \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create wheels for dependencies
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies with ODBC driver for MSSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libodbc1 \
    odbcinst1debian2 \
    unixodbc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Microsoft ODBC Driver for SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https \
    gnupg \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Install Python dependencies from wheels
RUN pip install --no-cache /wheels/*

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/v1.0/DynamicApi/Health || exit 1

# Run gunicorn
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-tmp-dir", "/dev/shm", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "config.wsgi:application"]
