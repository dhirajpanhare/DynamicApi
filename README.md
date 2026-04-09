<div align="center">

# 🚀 Dynamic API - Multi-Platform Implementation

### Execute stored procedures dynamically across multiple platforms with a unified API contract

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](./DynamicApi-Dotnet-MSSQL)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?logo=django)](./DynamicApi-Django-MSSQL)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)](./DynamicApi-Express-MSSQL)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-key-features) • [Quick Start](#-quick-start) • [Implementations](#-implementations) • [Documentation](#-documentation) • [API Reference](#-api-reference)

</div>

---

## 📋 Overview

A comprehensive Dynamic API solution that enables execution of stored procedures and database operations across multiple technology stacks and database systems. Choose your preferred platform and database combination - all implementations share the same API contract for seamless integration.

### 🎯 What Makes This Special?

- **Multi-Platform Support**: .NET, Django (Python), Express (Node.js)
- **Multi-Database Support**: MSSQL, MySQL, MongoDB
- **Unified API Contract**: Same request/response format across all implementations
- **Zero Configuration**: Execute any stored procedure without creating specific endpoints
- **Production Ready**: Comprehensive logging, error handling, and Swagger documentation
- **Frontend Ready**: CORS configured with examples for React, Angular, and Vue.js

---

## 🔥 Key Features

<table>
<tr>
<td width="50%">

### 🎨 Developer Experience
- **Zero Endpoint Creation**: Execute any stored procedure without coding new endpoints
- **Flexible Parameters**: Custom delimiters for parameter parsing
- **Interactive Swagger UI**: Test APIs directly in browser
- **Comprehensive Logging**: Track every execution with detailed logs

</td>
<td width="50%">

### 🛡️ Production Ready
- **Error Handling**: Robust error management and validation
- **CORS Support**: Pre-configured for frontend integration
- **Health Checks**: Monitor API status and database connectivity
- **Multiple Databases**: MSSQL, MySQL, and MongoDB support

</td>
</tr>
</table>

---

## 🏗️ Implementations

Choose your preferred technology stack and database combination:

<table>
<tr>
<th>Platform</th>
<th>Database</th>
<th>Port</th>
<th>Quick Links</th>
</tr>

<tr>
<td rowspan="2"><strong>.NET 8.0</strong><br/>C# / ASP.NET Core</td>
<td>MSSQL</td>
<td>5000</td>
<td>
  <a href="./DynamicApi-Dotnet-MSSQL">📁 Code</a> •
  <a href="./DynamicApi-Dotnet-MSSQL/README.md">📖 Docs</a> •
  <a href="./DynamicApi-Dotnet-MSSQL/QUICK_START.md">⚡ Quick Start</a>
</td>
</tr>
<tr>
<td>MySQL</td>
<td>5000</td>
<td>
  <a href="./DynamicApi-Dotnet-MYSQL">📁 Code</a> •
  <a href="./DynamicApi-Dotnet-MYSQL/README.md">📖 Docs</a>
</td>
</tr>

<tr>
<td rowspan="2"><strong>Django 4.2</strong><br/>Python / DRF</td>
<td>MSSQL</td>
<td>8000</td>
<td>
  <a href="./DynamicApi-Django-MSSQL">📁 Code</a> •
  <a href="./DynamicApi-Django-MSSQL/README.md">📖 Docs</a> •
  <a href="./DynamicApi-Django-MSSQL/SWAGGER_DOCUMENTATION.md">📊 Swagger</a>
</td>
</tr>
<tr>
<td>MySQL</td>
<td>8000</td>
<td>
  <a href="./DynamicApi-Django-MYSQL">📁 Code</a> •
  <a href="./DynamicApi-Django-MYSQL/README.md">📖 Docs</a> •
  <a href="./DynamicApi-Django-MYSQL/SWAGGER_DOCUMENTATION.md">📊 Swagger</a>
</td>
</tr>

<tr>
<td rowspan="3"><strong>Express.js</strong><br/>Node.js</td>
<td>MSSQL</td>
<td>3000</td>
<td>
  <a href="./DynamicApi-Express-MSSQL">📁 Code</a> •
  <a href="./DynamicApi-Express-MSSQL/README.md">📖 Docs</a>
</td>
</tr>
<tr>
<td>MySQL</td>
<td>3000</td>
<td>
  <a href="./DynamicApi-Express-MYSQL">📁 Code</a> •
  <a href="./DynamicApi-Express-MYSQL/README.md">📖 Docs</a>
</td>
</tr>
<tr>
<td>MongoDB</td>
<td>3000</td>
<td>
  <a href="./DynamicApi-Express-MongoDB">📁 Code</a> •
  <a href="./DynamicApi-Express-MongoDB/README.md">📖 Docs</a> •
  <a href="./DynamicApi-Express-MongoDB/MONGODB_IMPLEMENTATION.md">🍃 MongoDB Guide</a>
</td>
</tr>
</table>

### 📂 Repository Structure

```
backend/
├── DynamicApi-Dotnet-MSSQL/        # .NET + SQL Server
├── DynamicApi-Dotnet-MYSQL/        # .NET + MySQL
├── DynamicApi-Django-MSSQL/        # Django + SQL Server
├── DynamicApi-Django-MYSQL/        # Django + MySQL
├── DynamicApi-Express-MSSQL/       # Express + SQL Server
├── DynamicApi-Express-MYSQL/       # Express + MySQL
├── DynamicApi-Express-MongoDB/     # Express + MongoDB (NoSQL)
├── DYNAMIC_API_DOCUMENTATION.md    # Complete API documentation
└── README.md                        # This file
```

---

## 🚀 Quick Start

Choose your implementation and get started in minutes:

### 🔷 .NET + MSSQL

```bash
cd DynamicApi-Dotnet-MSSQL
# Configure appsettings.json with your database connection
dotnet restore
dotnet run
```
**Access**: http://localhost:5000/swagger

📖 [Full Setup Guide](./DynamicApi-Dotnet-MSSQL/README.md) | [Quick Start](./DynamicApi-Dotnet-MSSQL/QUICK_START.md) | [Deployment](./DynamicApi-Dotnet-MSSQL/DEPLOYMENT_GUIDE.md)

---

### 🐍 Django + MSSQL

```bash
cd DynamicApi-Django-MSSQL
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python manage.py migrate
python manage.py runserver
```
**Access**: http://localhost:8000/api/docs/swagger/

📖 [Full Setup Guide](./DynamicApi-Django-MSSQL/README.md) | [Swagger Docs](./DynamicApi-Django-MSSQL/SWAGGER_DOCUMENTATION.md)

---

### 🟢 Express + MongoDB

```bash
cd DynamicApi-Express-MongoDB
npm install
cp .env.example .env
# Edit .env with MongoDB connection string
npm run dev
```
**Access**: http://localhost:3000/api/docs

📖 [Full Setup Guide](./DynamicApi-Express-MongoDB/README.md) | [MongoDB Implementation](./DynamicApi-Express-MongoDB/MONGODB_IMPLEMENTATION.md)

---

### 🟢 Express + MySQL

```bash
cd DynamicApi-Express-MYSQL
npm install
cp .env.example .env
# Edit .env with database credentials
npm start
```
**Access**: http://localhost:3000/api/v1.0/docs

📖 [Full Setup Guide](./DynamicApi-Express-MYSQL/README.md)

---

### 🐍 Django + MySQL

```bash
cd DynamicApi-Django-MYSQL
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with database credentials
python manage.py migrate
python manage.py runserver
```
**Access**: http://localhost:8000/api/docs/swagger/

📖 [Full Setup Guide](./DynamicApi-Django-MYSQL/README.md)

---

## 📊 Platform Comparison

| Feature | .NET | Django | Express |
|---------|------|--------|---------|
| **Language** | C# 12 | Python 3.8+ | JavaScript (Node.js) |
| **Framework** | ASP.NET Core 8 | Django 4.2 + DRF | Express.js 4.18+ |
| **Databases** | MSSQL, MySQL | MSSQL, MySQL | MSSQL, MySQL, MongoDB |
| **ORM/Driver** | EF Core, MySqlConnector | PyMySQL, mssql-django | mysql2, tedious, mongoose |
| **Authentication** | JWT Ready | JWT Ready | JWT Ready |
| **Swagger/OpenAPI** | ✅ Swashbuckle | ✅ drf-spectacular | ✅ swagger-ui-express |
| **Default Port** | 5000 | 8000 | 3000 |
| **Performance** | ⚡ Excellent | 🚀 Very Good | ⚡ Excellent |
| **Setup Time** | Fast | Fast | Very Fast |
| **Production Ready** | ✅ | ✅ | ✅ |
| **Docker Support** | ✅ | ✅ | ✅ |
| **Hot Reload** | ✅ | ✅ | ✅ |

---

## � Email OTP Authentication

All implementations now include **email-based OTP (One-Time Password) authentication** with dynamic backend selection and real SMTP email sending via Gmail.

### Features ✅

- **Email OTP Generation**: 6-digit codes sent directly to user email
- **Configurable Expiry**: Customizable OTP validity period (default: 10 minutes)
- **Rate Limiting**: Prevent brute force with attempt limits (default: 5 attempts)
- **Multiple Email Providers**: Gmail, Mailgun, SendGrid, and SMTP
- **Dynamic Backend Selection**: Switch between email backends without restarting
- **Frontend Integration**: React component with localStorage persistence
- **All Platforms Supported**: .NET, Django, and Express implementations

### Email Configuration

#### Gmail SMTP Setup

**Configuration in all backends**:

**appsettings.json** (.NET):
```json
"Email": {
  "Provider": "GMAIL",
  "SenderEmail": "your-email@gmail.com",
  "GmailUser": "your-email@gmail.com",
  "GmailAppPassword": "your-app-password",
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587
}
```

**.env** (Django/Express):
```env
EMAIL_PROVIDER=GMAIL
SENDER_EMAIL=your-email@gmail.com
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### API Endpoints

#### Send OTP Email

**Endpoint**: `POST /api/v1.0/auth/send-otp`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "status": true,
  "message": "OTP sent to your email",
  "data": {
    "email": "user@example.com",
    "expiresAt": "2026-04-09T10:15:00Z"
  }
}
```

#### Verify OTP

**Endpoint**: `POST /api/v1.0/auth/verify-otp`

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com"
    }
  }
}
```

### Frontend Integration

The React frontend includes a **dynamic backend selector** that allows users to switch between all email service implementations without restarting:

```jsx
// Login page includes:
<EmailBackendSelector />  // Purple dropdown to choose backend
<LoginForm />             // Standard email + OTP form
```

**Features**:
- 🔄 Switch between any of 7 backends instantly
- 💾 Selection saved to localStorage
- 📱 Fully responsive mobile design
- 🎯 Shows current backend name and port

**Available Backends for Selection**:
- Express + MongoDB (3001)
- Express + MSSQL (3002)
- Express + MySQL (3003)
- Django + MSSQL (8000)
- Django + MySQL (8001)
- .NET + MSSQL (5000)
- .NET + MySQL (5001)

### Email Service Implementation

#### Supported Providers

| Provider | Status | Config Required | Notes |
|----------|--------|-----------------|-------|
| **Gmail** | ✅ Production Ready | App Password | Recommended - most reliable |
| **SMTP** | ✅ Production Ready | Credentials | Generic SMTP support (any provider) |
| **Mailgun** | ✅ Production Ready | API Key + Domain | Good for high volume |
| **SendGrid** | ✅ Production Ready | API Key | Enterprise-grade reliability |
| **Console** | ✅ Development | None | Logs OTP to console (testing) |

#### Implementation Details

Each backend implements real email sending (not stubs):

**.NET** - Uses `System.Net.Mail.SmtpClient`:
```csharp
using (var smtpClient = new SmtpClient("smtp.gmail.com", 587))
{
    smtpClient.EnableSsl = true;
    smtpClient.Credentials = new NetworkCredential(user, password);
    await smtpClient.SendMailAsync(mailMessage);
}
```

**Django** - Uses `django.core.mail`:
```python
from django.core.mail import EmailMessage
email = EmailMessage(subject, message, from_email, [to_email])
email.send()
```

**Express** - Uses `nodemailer`:
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: { user, pass }
});
await transporter.sendMail(mailOptions);
```

### OTP Configuration

#### Global Settings

- **OTP Length**: 6 digits
- **Expiry Time**: 10 minutes (configurable per backend)
- **Max Attempts**: 5 attempts per OTP
- **Resend Cooldown**: 30 seconds between requests

#### Per-Backend Configuration

**.NET** (appsettings.json):
```json
"Otp": {
  "Length": 6,
  "ExpiryMinutes": 10,
  "MaxAttempts": 5
}
```

**Django** (.env):
```env
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

**Express** (.env):
```env
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

---

## �🔌 API Reference

### Unified API Contract

All implementations share the same API contract for seamless platform switching:

#### Execute Stored Procedure

**Endpoint**: `POST /api/v1.0/DynamicApi/DynamicApiExecute`

**Request Body**:
```json
{
  "stringOne": "p_ProductId=1|p_Category=Electronics",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "GetProductById"
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stringOne` | string | No | Parameter values in key=value format |
| `stringTwo` | string | No | Parameter separator (default: `\|`) |
| `stringThree` | string | No | Key-value separator (default: `=`) |
| `stringFour` | string | Yes | Stored procedure name |

**Success Response** (200 OK):
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ProductId": 1,
      "ProductName": "Laptop",
      "Category": "Electronics",
      "Price": 999.99
    }
  ]
}
```

**Error Response** (400/500):
```json
{
  "status": false,
  "message": "Procedure not found: GetProductById",
  "data": null
}
```

#### Generate Payload from Procedure Definition

**Endpoint**: `POST /api/v1.0/DynamicApi/GeneratePayload`

**Description**: Paste a CREATE PROCEDURE SQL definition and receive a ready-to-use DynamicApiExecute request payload with sample values based on parameter data types.

**Request Body**:
```json
{
  "procedureDefinition": "CREATE PROCEDURE GetProductById(IN p_ProductId INT, IN p_Category VARCHAR(100)) BEGIN SELECT * FROM Products WHERE ProductId = p_ProductId AND Category = p_Category; END"
}
```

**Success Response** (200 OK):
```json
{
  "stringOne": "p_ProductId=1|p_Category=SampleText",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "GetProductById"
}
```

**Error Response** (400):
```json
{
  "status": false,
  "message": "procedureDefinition is required in the request body",
  "data": null
}
```

**Use Case**: Quickly generate test payloads from stored procedure definitions without manually typing parameter names and sample values.

#### Health Check

**Endpoint**: `GET /health` or `GET /api/v1.0/DynamicApi/Health`

**Response**:
```json
{
  "status": true,
  "message": "API is operational",
  "data": {
    "timestamp": "2026-04-01T10:30:00Z",
    "database": "connected"
  }
}
```

### MongoDB Operations (Express Only)

**Endpoint**: `POST /api/v1.0/DynamicApi/Operations`

**Request Body** (JSON Format - Recommended):
```json
{
  "operationType": "create",
  "collectionName": "users",
  "parameters": {
    "documents": {
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active"
    },
    "isMultiple": false
  }
}
```

**Supported Operations**: `create`, `read`, `update`, `delete`, `aggregate`

📖 [MongoDB Implementation Guide](./DynamicApi-Express-MongoDB/MONGODB_IMPLEMENTATION.md)

---

## 💻 Frontend Integration

### React Example (Axios)

```jsx
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // or 3000, 8000

export const executeProcedure = async (procedureName, params) => {
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('|');

  const response = await axios.post(
    `${API_BASE_URL}/api/v1.0/DynamicApi/DynamicApiExecute`,
    {
      stringOne: paramString,
      stringTwo: '|',
      stringThree: '=',
      stringFour: procedureName
    }
  );

  return response.data;
};

// Usage
const data = await executeProcedure('GetProductById', { p_ProductId: 1 });
```

### Angular Example (HttpClient)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DynamicApiService {
  private apiUrl = 'http://localhost:5000/api/v1.0/DynamicApi';

  constructor(private http: HttpClient) {}

  executeProcedure(procedureName: string, params: Record<string, any>): Observable<any> {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('|');

    return this.http.post(`${this.apiUrl}/DynamicApiExecute`, {
      stringOne: paramString,
      stringTwo: '|',
      stringThree: '=',
      stringFour: procedureName
    });
  }
}
```

### Vue.js Example (Fetch API)

```javascript
export async function executeProcedure(procedureName, params) {
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('|');

  const response = await fetch('http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stringOne: paramString,
      stringTwo: '|',
      stringThree: '=',
      stringFour: procedureName
    })
  });

  return await response.json();
}
```

### CORS Configuration

All implementations are pre-configured with CORS support for common frontend ports:

- `http://localhost:3000` (React, Next.js)
- `http://localhost:4200` (Angular)
- `http://localhost:8080` (Vue.js)
- `http://localhost:5173` (Vite)

Update CORS settings in:
- **.NET**: `appsettings.json` → `CorsOrigins`
- **Django**: `.env` → `CORS_ORIGINS`
- **Express**: `.env` → `CORS_ORIGINS`

---

## 🧪 Testing the API

### Using cURL

```bash
# Test health endpoint
curl http://localhost:5000/health

# Execute stored procedure
curl -X POST http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute \
  -H "Content-Type: application/json" \
  -d '{
    "stringOne": "p_ProductId=1",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "GetProductById"
  }'
```

### Using Swagger UI

1. Navigate to Swagger documentation:
   - **.NET**: http://localhost:5000/swagger
   - **Django**: http://localhost:8000/api/docs/swagger/
   - **Express**: http://localhost:3000/api/docs

2. Click on the endpoint you want to test
3. Click "Try it out"
4. Enter parameters and click "Execute"
5. View the response

### Using Postman

1. Import the OpenAPI/Swagger specification from `/api/schema/` endpoint
2. Or manually create a POST request to `/api/v1.0/DynamicApi/DynamicApiExecute`
3. Set `Content-Type: application/json` header
4. Add request body with parameters
5. Send request

📖 Detailed testing guides available in each implementation's documentation

---

## 🏛️ Architecture

All implementations follow a clean, layered architecture:

```
┌─────────────────────────────────────┐
│   HTTP Layer (Controllers/Views)    │
│   Request/Response Handling          │
├─────────────────────────────────────┤
│   Service Layer                      │
│   Business Logic & Orchestration     │
├─────────────────────────────────────┤
│   Executor/Repository Layer          │
│   Database Operations                │
├─────────────────────────────────────┤
│   Middleware & Utilities             │
│   Logging, Error Handling, CORS      │
├─────────────────────────────────────┤
│   Database (MSSQL/MySQL/MongoDB)     │
│   Stored Procedures / Collections    │
└─────────────────────────────────────┘
```

### Key Architecture Principles

✅ **Separation of Concerns**: Each layer has a single responsibility  
✅ **Dependency Injection**: Loose coupling between components  
✅ **Error Handling**: Centralized error management  
✅ **Logging**: Comprehensive logging at all layers  
✅ **Security**: Parameterized queries prevent SQL injection  
✅ **Scalability**: Stateless design for horizontal scaling  

---

## 📚 Documentation

### General Documentation
- 📘 [Complete API Documentation](./DYNAMIC_API_DOCUMENTATION.md)
- 🔐 [Security Guide](./SECURITY_GUIDE.md)
- 📄 [This README](./README.md)

### Platform-Specific Documentation

#### .NET Implementation
- 📗 [.NET + MSSQL README](./DynamicApi-Dotnet-MSSQL/README.md)
- ⚡ [Quick Start Guide](./DynamicApi-Dotnet-MSSQL/QUICK_START.md)
- 🚀 [Deployment Guide](./DynamicApi-Dotnet-MSSQL/DEPLOYMENT_GUIDE.md)
- ⚙️ [Environment Setup](./DynamicApi-Dotnet-MSSQL/ENV_SETUP_GUIDE.md)

#### Django Implementation
- 📗 [Django + MSSQL README](./DynamicApi-Django-MSSQL/README.md)
- 📗 [Django + MySQL README](./DynamicApi-Django-MYSQL/README.md)
- 📊 [Swagger Documentation](./DynamicApi-Django-MSSQL/SWAGGER_DOCUMENTATION.md)
- 🧪 [API Testing Guide](./DynamicApi-Django-MSSQL/docs/)

#### Express Implementation
- 📗 [Express + MSSQL README](./DynamicApi-Express-MSSQL/README.md)
- 📗 [Express + MySQL README](./DynamicApi-Express-MYSQL/README.md)
- 📗 [Express + MongoDB README](./DynamicApi-Express-MongoDB/README.md)
- 🍃 [MongoDB Implementation Guide](./DynamicApi-Express-MongoDB/MONGODB_IMPLEMENTATION.md)

---

## 🚢 Production Deployment

### Docker Deployment

Each implementation includes Docker support:

```bash
# .NET
cd DynamicApi-Dotnet-MSSQL
docker build -t dynamicapi-dotnet .
docker run -p 5000:80 -e ConnectionStrings__DefaultConnection="..." dynamicapi-dotnet

# Django
cd DynamicApi-Django-MSSQL
docker build -t dynamicapi-django .
docker run -p 8000:8000 --env-file .env dynamicapi-django

# Express
cd DynamicApi-Express-MYSQL
docker build -t dynamicapi-express .
docker run -p 3000:3000 --env-file .env dynamicapi-express
```

### Cloud Deployment Options

- **Azure**: App Service, Container Instances, AKS
- **AWS**: Elastic Beanstalk, ECS, EKS
- **Google Cloud**: App Engine, Cloud Run, GKE
- **Heroku**: Direct deployment with buildpacks

### Production Checklist

- [ ] Configure environment variables securely
- [ ] Enable HTTPS/TLS
- [ ] Set up database connection pooling
- [ ] Configure logging and monitoring
- [ ] Implement rate limiting
- [ ] Add authentication (JWT recommended)
- [ ] Restrict CORS to specific origins
- [ ] Set up automated backups
- [ ] Configure health checks
- [ ] Enable application insights/monitoring

📖 Detailed deployment guides available in each implementation

---

## 🔐 Security Considerations

### Current Implementation
✅ **SQL Injection Protection**: All queries use parameterized execution  
✅ **Input Validation**: Procedure names and parameters validated  
✅ **CORS Configuration**: Configurable allowed origins  
✅ **Error Handling**: Errors don't expose sensitive information  
⚠️ **No Authentication**: Designed for internal APIs (add JWT for production)  

### Before Public Deployment
- [ ] Implement authentication (JWT, OAuth, API Keys)
- [ ] Add rate limiting and throttling
- [ ] Enable HTTPS/TLS encryption
- [ ] Configure security headers (HSTS, CSP, etc.)
- [ ] Implement request signing
- [ ] Add IP whitelisting if needed
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable audit logging
- [ ] Perform security testing (OWASP Top 10)

📖 **Full security documentation, upgrade roadmap, and implementation code**: [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)

---

## 💡 Use Cases

### Perfect For:
- **Internal APIs**: Execute database procedures without creating endpoints
- **Microservices**: Lightweight database access layer
- **Legacy System Integration**: Bridge between old stored procedures and modern frontends
- **Rapid Prototyping**: Quick API development without boilerplate
- **Multi-Platform Teams**: Same API across different tech stacks
- **Database Migration**: Switch databases without changing API contract

### Not Recommended For:
- Public-facing APIs without authentication
- Complex business logic (use dedicated services)
- Real-time applications (consider WebSockets)
- File uploads/downloads
- GraphQL requirements

---

## 🛠️ Troubleshooting

### Common Issues

<details>
<summary><strong>Database Connection Failed</strong></summary>

- Verify database server is running
- Check connection string/credentials
- Ensure database exists
- Check firewall rules
- Test connection with database client
</details>

<details>
<summary><strong>Port Already in Use</strong></summary>

```bash
# .NET - Change port in launchSettings.json or:
dotnet run --urls="http://localhost:5001"

# Django
python manage.py runserver 8001

# Express - Change PORT in .env or:
PORT=3001 npm start
```
</details>

<details>
<summary><strong>Swagger Not Loading</strong></summary>

- Clear browser cache
- Restart application
- Check console for JavaScript errors
- Verify Swagger configuration in code
- Ensure all routes are properly decorated
</details>

<details>
<summary><strong>Stored Procedure Not Found</strong></summary>

- Verify procedure exists in database
- Check spelling (case-sensitive in some databases)
- Ensure user has EXECUTE permissions
- Test procedure directly in database client
</details>

<details>
<summary><strong>CORS Errors</strong></summary>

- Add your frontend origin to CORS configuration
- Check browser console for specific error
- Verify preflight OPTIONS requests are handled
- Ensure credentials are configured if needed
</details>

---

## 📈 Performance Tips

### Database Optimization
- Create indexes on frequently queried columns
- Optimize stored procedures
- Use connection pooling (enabled by default)
- Monitor slow query logs
- Implement caching for frequently called procedures

### Application Optimization
- Enable response compression
- Use async/await patterns
- Implement request caching
- Monitor memory usage
- Profile slow endpoints

### Scaling Strategies
- Deploy multiple instances behind load balancer
- Use database read replicas
- Implement Redis caching
- Enable CDN for static assets
- Use container orchestration (Kubernetes)

---

## 🤝 Contributing

Contributions are welcome! When adding features:

1. Implement across all platforms for consistency
2. Maintain the unified API contract
3. Add comprehensive documentation
4. Include tests
5. Update this README if needed

---

## 📄 License

This project is licensed under the MIT License - see individual implementation folders for details.

---

## 📞 Support & Resources

### Getting Help
1. Check implementation-specific README files
2. Review Swagger documentation
3. Check logs directory for error details
4. Verify configuration files (.env, appsettings.json)

### Additional Resources
- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## 🎯 What's Next?

1. **Choose Your Stack**: Select the implementation that matches your team's expertise
2. **Follow Quick Start**: Get up and running in minutes
3. **Explore Documentation**: Deep dive into platform-specific features
4. **Test with Swagger**: Use interactive documentation to test endpoints
5. **Integrate Frontend**: Use provided examples for React, Angular, or Vue.js
6. **Deploy**: Follow deployment guides for production

---

<div align="center">

### 🌟 Ready to Get Started?

Choose your implementation above and follow the Quick Start guide!

**Made with ❤️ for developers who value flexibility and consistency**

[⬆ Back to Top](#-dynamic-api---multi-platform-implementation)

</div>
