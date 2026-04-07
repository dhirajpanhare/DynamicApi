# Django Dynamic API Implementation

## Overview

This is a Django REST Framework implementation of the Dynamic API that enables direct execution of stored procedures without creating specific endpoints for each procedure.

## Project Structure

```
DynamicApi-Django/
├── dynamic_api_project/          # Django project settings
│   ├── __init__.py
│   ├── settings.py               # Django configuration
│   ├── urls.py                   # URL routing
│   ├── asgi.py
│   └── wsgi.py
├── dynamic_api_app/              # Django application
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py                  # Django admin configuration
│   ├── apps.py                   # App configuration
│   ├── auth.py                   # JWT authentication
│   ├── executor.py               # Stored procedure executor
│   ├── models.py                 # Database models
│   ├── serializers.py            # DRF serializers
│   ├── services.py               # Business logic
│   ├── urls.py                   # App URL routing
│   └── views.py                  # API views (controllers)
├── tests/                        # Test suite
│   ├── __init__.py
│   └── test_api.py
├── logs/                         # Application logs
├── manage.py                     # Django management script
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment configuration template
├── README.md                     # This file
├── QUICK_START.md               # Quick start guide
└── DEPLOYMENT_GUIDE.md          # Deployment instructions
```

## Installation & Setup

### Prerequisites

- Python 3.8+
- pip or poetry
- SQL Server (or sqlite3 for development)
- Virtual environment (recommended)

### Step 1: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# For MSSQL
DB_ENGINE=django.db.backends.mssql
DB_NAME=YourDatabase
DB_USER=YourUser
DB_PASSWORD=YourPassword
DB_HOST=YourServer
DB_PORT=1433

JWT_SECRET=your-jwt-secret
```

### Step 4: Run Migrations

```bash
python manage.py migrate
```

### Step 5: Create Superuser (Optional)

For accessing Django admin:

```bash
python manage.py createsuperuser
```

### Step 6: Start Development Server

```bash
python manage.py runserver
```

API will be available at: `http://localhost:8000/api/v1.0/DynamicApi/`

## API Endpoints

### 1. Execute Stored Procedure

**Endpoint:** `POST /api/v1.0/DynamicApi/DynamicApiExecute`

**Request:**
```json
{
  "stringOne": "p_ContactId=5|p_Status=Active",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_GetContactData"
}
```

**Response (Success):**
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ContactId": 5,
      "ContactName": "John Doe",
      "Status": "Active"
    }
  ]
}
```

**Response (Error):**
```json
{
  "status": false,
  "message": "Procedure not found or invalid: SP_NonExistent",
  "data": null
}
```

### 2. Generate Payload from Procedure Definition

**Endpoint:** `POST /api/v1.0/DynamicApi/GeneratePayload`

**Description:** Paste a CREATE PROCEDURE SQL definition and receive a ready-to-use payload with sample values.

**Request:**
```json
{
  "procedureDefinition": "CREATE PROCEDURE GetProductById(IN p_ProductId INT, IN p_Category VARCHAR(100)) BEGIN SELECT * FROM Products WHERE ProductId = p_ProductId; END"
}
```

**Response:**
```json
{
  "stringOne": "p_ProductId=1|p_Category=SampleText",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "GetProductById"
}
```

You can then use this response directly in the DynamicApiExecute endpoint!

### 3. Health Check

**Endpoint:** `GET|POST /api/v1.0/DynamicApi/Health`

**Response:**
```json
{
  "status": true,
  "message": "Dynamic API is operational",
  "data": {
    "timestamp": "2026-03-26T10:30:45.123Z"
  }
}
```

## Interactive API Documentation

The Dynamic API includes **interactive Swagger/OpenAPI documentation** for testing and integration.

### Access Documentation

After starting the server (`python manage.py runserver`), visit:

- **Swagger UI (Recommended)**: [http://localhost:8000/api/docs/swagger/](http://localhost:8000/api/docs/swagger/)
  - Interactive endpoint testing
  - Request/response examples
  - Parameter validation
  - Copy as cURL

- **ReDoc (Alternative)**: [http://localhost:8000/api/docs/redoc/](http://localhost:8000/api/docs/redoc/)
  - Clean, responsive documentation
  - Offline-friendly
  - Search functionality

- **OpenAPI Schema**: [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)
  - Raw JSON specification
  - For code generation and integrations

### Quick Test in Swagger

1. Open [http://localhost:8000/api/docs/swagger/](http://localhost:8000/api/docs/swagger/)
2. Click **Health & Status** → **GET /api/v1.0/DynamicApi/Health**
3. Click **Try it out** → **Execute**
4. View the response

See [SWAGGER_DOCUMENTATION.md](SWAGGER_DOCUMENTATION.md) for detailed instructions.

## Configuration

### Database Configuration

#### SQLite (Default, Development Only)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

#### SQL Server (MSSQL)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mssql',
        'NAME': 'YourDatabase',
        'USER': 'YourUsername',
        'PASSWORD': 'YourPassword',
        'HOST': 'YourServer',
        'PORT': '1433',
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
        }
    }
}
```

### JWT Configuration

Enable JWT authentication in `settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'dynamic_api_app.auth.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### CORS Configuration


Update allowed origins in `settings.py` or `.env`:

```python
CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',  # React
        'http://localhost:4200',  # Angular
        'http://localhost:8000',
        'https://yourdomain.com',
]
```

Or in `.env`:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8000,https://yourdomain.com
```

---

### Frontend Redirection Example

To redirect users from a Django backend endpoint to a frontend app (e.g., after login):

```python
from django.shortcuts import redirect
from django.conf import settings

def redirect_to_frontend(request):
        frontend_url = 'http://localhost:3000'  # or http://localhost:4200 for Angular
        return redirect(frontend_url)
```

Add this view to your `urls.py` as needed.

---

### Frontend API Call Templates

#### React Example (fetch)

```jsx
// src/apiCall.js
import axios from 'axios';

export async function callDynamicApi() {
    const response = await axios.post('http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute', {
        stringOne: 'p_ContactId=5|p_Status=Active',
        stringTwo: '|',
        stringThree: '=',
        stringFour: 'SP_GetContactData'
    });
    return response.data;
}
```

#### Angular Example (HttpClient)

```typescript
// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private http: HttpClient) {}

    callDynamicApi(): Observable<any> {
        return this.http.post('http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute', {
            stringOne: 'p_ContactId=5|p_Status=Active',
            stringTwo: '|',
            stringThree: '=',
            stringFour: 'SP_GetContactData'
        });
    }
}
```

## Usage Examples

### Python

```python
import requests
import json

def execute_stored_procedure(server_url, procedure_name, parameters):
    """Execute stored procedure"""
    
    # Format parameters as delimited string
    param_string = "|".join([f"{k}={v}" for k, v in parameters.items()])
    
    payload = {
        "stringOne": param_string,
        "stringTwo": "|",
        "stringThree": "=",
        "stringFour": procedure_name
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{server_url}/api/v1.0/DynamicApi/DynamicApiExecute",
        json=payload,
        headers=headers
    )
    
    result = response.json()
    
    if result['status']:
        return result['data']
    else:
        raise Exception(f"API Error: {result['message']}")

# Usage
data = execute_stored_procedure(
    "http://localhost:8000",
    "SP_GetContactData",
    {"p_ContactId": 5, "p_Status": "Active"}
)

for record in data:
    print(record)
```

### JavaScript

```javascript
async function executeStoredProcedure(serverUrl, procedureName, parameters) {
    const paramString = Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join('|');

    const response = await fetch(
        `${serverUrl}/api/v1.0/DynamicApi/DynamicApiExecute`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stringOne: paramString,
                stringTwo: '|',
                stringThree: '=',
                stringFour: procedureName
            })
        }
    );

    const result = await response.json();
    
    if (result.status) {
        return result.data;
    } else {
        throw new Error(`API Error: ${result.message}`);
    }
}

// Usage
const data = await executeStoredProcedure(
    'http://localhost:8000',
    'SP_GetContactData',
    { 'p_ContactId': 5, 'p_Status': 'Active' }
);

console.log(data);
```

### C#

```csharp
using System;
using System.Net.Http;
using System.Text.Json;
using System.Text;

public class DynamicApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _serverUrl;
    
    public DynamicApiClient(string serverUrl)
    {
        _serverUrl = serverUrl;
        _httpClient = new HttpClient();
    }
    
    public async Task<JsonElement> ExecuteStoredProcedure(
        string procedureName,
        Dictionary<string, object> parameters)
    {
        var paramString = string.Join("|",
            parameters.Select(p => $"{p.Key}={p.Value}"));
        
        var payload = new
        {
            stringOne = paramString,
            stringTwo = "|",
            stringThree = "=",
            stringFour = procedureName
        };
        
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(
            $"{_serverUrl}/api/v1.0/DynamicApi/DynamicApiExecute",
            content
        );
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var result = JsonDocument.Parse(responseJson).RootElement;
        
        if (result.GetProperty("status").GetBoolean())
        {
            return result.GetProperty("data");
        }
        else
        {
            throw new Exception($"API Error: {result.GetProperty("message").GetString()}");
        }
    }
}
```

## Project Architecture

### Layers

1. **Views Layer** (`views.py`)
   - HTTP request/response handling
   - Request validation
   - Response serialization

2. **Service Layer** (`services.py`)
   - Business logic
   - Parameter parsing
   - Execution logging

3. **Executor Layer** (`executor.py`)
   - Database interactions
   - Stored procedure execution
   - Result mapping

4. **Authentication Layer** (`auth.py`)
   - JWT token generation
   - Token validation
   - Authorization

### Data Flow

```
HTTP Request
    ↓
View (HTTP validation)
    ↓
Serializer (Request validation)
    ↓
Service (Business logic, parameter parsing)
    ↓
Executor (Database execution)
    ↓
Service (Result processing, logging)
    ↓
Serializer (Response formatting)
    ↓
HTTP Response
```

## Features

### ✅ Implemented

- [x] Stored procedure execution via string parameters
- [x] Dynamic parameter parsing with configurable separators
- [x] Health check endpoint
- [x] Consistent JSON response format
- [x] Execution logging
- [x] JWT authentication (framework, currently disabled)
- [x] CORS support
- [x] Error handling and validation
- [x] Django admin interface for logs
- [x] Comprehensive test suite

### 📋 Planned

- [ ] Parameter validation and type conversion
- [ ] Rate limiting
- [ ] Advanced error handling with retry logic
- [ ] Caching layer for frequently executed procedures
- [ ] Bulk operation support
- [ ] API documentation with Swagger/OpenAPI
- [ ] Performance monitoring and metrics
- [ ] Database connection pooling
- [ ] Audit logging with more details

## Troubleshooting

### Issue: "No module named 'django'"

```bash
pip install -r requirements.txt
```

### Issue: Database Connection Error

Verify database configuration in `.env`:
- Check server name/host
- Verify database name
- Check credentials
- Ensure SQL Server is running and accessible

### Issue: Procedure Not Found

- Verify stored procedure exists in the database
- Check procedure name spelling (case-sensitive)
- Ensure database user has EXECUTE permissions
- Test procedure directly in SQL Server Management Studio

### Issue: Port Already in Use

```bash
# Use different port
python manage.py runserver 8001
```

## Security Notes

⚠️ **Before Production Deployment:**

- [ ] Change `DJANGO_SECRET_KEY` to a strong random value
- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Enable JWT authentication
- [ ] Restrict CORS origins
- [ ] Use HTTPS/TLS
- [ ] Implement request logging and monitoring
- [ ] Set up database backups
- [ ] Configure appropriate database permissions
- [ ] Use environment variables for all secrets

## Testing

Run tests:

```bash
python manage.py test
```

Run specific test:

```bash
python manage.py test tests.test_api.HealthCheckTestCase
```

## Logging

Logs are written to `logs/dynamic_api.log` with rotating file handler (10MB max per file, 5 backups).

Configure logging level in `settings.py`:

```python
'loggers': {
    'dynamic_api_app': {
        'level': 'DEBUG',  # Change log level here
    },
}
```

## Performance Tips

1. **Database Optimization**
   - Create indexes on frequently filtered columns
   - Use pagination in stored procedures
   - Monitor slow query logs

2. **Application Optimization**
   - Cache frequently requested data
   - Use connection pooling
   - Monitor request/response times

3. **Monitoring**
   - Set up Application Insights or similar APM
   - Monitor error rates and response times
   - Alert on anomalies

## Documentation & Testing

Complete documentation and testing guides are available:

- **[SWAGGER_DOCUMENTATION.md](SWAGGER_DOCUMENTATION.md)** - Interactive Swagger UI and OpenAPI specification
  - Access at: `http://localhost:8000/api/docs/swagger/`
  - ReDoc at: `http://localhost:8000/api/docs/redoc/`

- **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - Complete testing guide covering:
  - Swagger UI interactive testing
  - Postman collections and test scripts
  - cURL command examples
  - Python test scripts (pytest, requests)
  - JavaScript/Node.js testing (Fetch API, Axios, Jest)
  - CI/CD integration examples

- **[QUICK_START.md](QUICK_START.md)** - 5-minute startup guide

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical overview

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment instructions.

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Verify configuration in `.env`
3. Test stored procedures directly in database
4. Review API documentation

## Version

- **Version:** 1.0.0
- **Python:** 3.8+
- **Django:** 4.2.8
- **DRF:** 3.14.0
- **Last Updated:** March 26, 2026

## License

[Specify your license here]

## Changes from Other Implementations

This Django version mirrors the architecture of the C# and Express implementations while adapting to Django conventions:

- Uses DRF viewsets and serializers instead of Controllers
- Leverages Django ORM for execution logging
- Implements JWT using PyJWT library
- Uses Django settings for configuration management
- Provides Django admin interface for logs
- Follows Django best practices for project structure
