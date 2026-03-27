# Dynamic API - Multi-Platform Implementation

A comprehensive Dynamic API implementation across three major platforms: .NET, Node.js (Express), and Python (Django). Execute any stored procedure dynamically with flexible parameters without authentication.

---

## 📋 Project Overview

This repository contains three complete implementations of a Dynamic API system designed to execute stored procedures with custom parameters across different technology stacks:

1. **DynamicApi** - C# .NET 8.0
2. **DynamicApi-Express** - Node.js Express
3. **DynamicApi-Django** - Python Django

All three implementations share the same API contract, parameter handling mechanism, and response format, allowing seamless switching between platforms.

---

## 🏗️ Repository Structure

```
backend/
├── DynamicApi/                     # .NET implementation (C#)
│   ├── Program.cs
│   ├── DynamicApi.csproj
│   ├── Controllers/
│   ├── Services/
│   ├── Data/
│   └── README.md
│
├── DynamicApi-Express/             # Node.js implementation
│   ├── src/
│   ├── package.json
│   ├── database/
│   └── README.md
│
├── DynamicApi-Django/              # Python implementation
│   ├── manage.py
│   ├── config/
│   ├── dynamic_api_app/
│   ├── requirements.txt
│   └── README.md
│
└── README.md                        # This file
```

---

## 🚀 Quick Start Guide

### Choose Your Platform

#### Option 1: .NET (C#) Implementation

**Requirements**: .NET 8.0+, MySQL 5.7+

**Quick Setup**:
```bash
cd DynamicApi
# Edit appsettings.json with database credentials
# Set environment variable: ASPNETCORE_ENVIRONMENT=Development
dotnet run
```

**Access**:
- API: http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute
- Swagger: http://localhost:5000/swagger

---

#### Option 2: Express (Node.js) Implementation

**Requirements**: Node.js 14+, MySQL 5.7+

**Quick Setup**:
```bash
cd DynamicApi-Express
npm install
cp .env.example .env
# Edit .env with database credentials
npm start
```

**Access**:
- API: http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute
- Swagger: http://localhost:3000/api/v1.0/docs

---

#### Option 3: Django (Python) Implementation

**Requirements**: Python 3.8+, MySQL 5.7+

**Quick Setup**:
```bash
cd DynamicApi-Django
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with database credentials
python manage.py runserver
```

**Access**:
- API: http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute
- Swagger: http://localhost:8000/api/docs/swagger/

---

## 📊 Implementation Comparison

| Feature | .NET | Express | Django |
|---------|------|---------|--------|
| **Language** | C# | JavaScript | Python |
| **Framework** | ASP.NET Core 8 | Express.js | Django 4.2 |
| **Database** | MySQL | MySQL | MySQL |
| **Authentication** | None | None | None |
| **Swagger** | Swashbuckle | swagger-ui-express | drf-spectacular |
| **Port** | 5000 | 3000 | 8000 |
| **Performance** | Excellent | Very Good | Good |
| **Setup Time** | Fast | Very Fast | Fast |
| **Production Ready** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 💾 System Requirements

### Common Requirements
- **MySQL**: 5.7 or 8.0+
- **Internet Connection**: For package installation

### Platform-Specific

#### .NET
- **Operating System**: Windows, macOS, Linux
- **Runtime**: .NET 8.0+
- **RAM**: 2GB minimum
- **Disk**: 1GB

#### Express
- **Operating System**: Windows, macOS, Linux
- **Runtime**: Node.js 14.0+
- **npm**: 6.0+
- **RAM**: 512MB minimum
- **Disk**: 500MB

#### Django
- **Operating System**: Windows, macOS, Linux
- **Runtime**: Python 3.8+
- **pip**: Latest version
- **RAM**: 512MB minimum
- **Disk**: 500MB

---

## 🔧 Database Setup

### Create Database

All three implementations use the same database schema:

```bash
mysql -u root -p

CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE DynamicApiDb;

# Optional: Import setup.sql from any implementation
SOURCE path/to/database/setup.sql;
```

### Environment Variables

#### .NET
Set in `appsettings.json` or environment variables:
```
ConnectionStrings:DefaultConnection=Server=127.0.0.1;Port=3306;Database=DynamicApiDb;Uid=root;Pwd=password;
ASPNETCORE_ENVIRONMENT=Development
```

#### Express
Set in `.env`:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=DynamicApiDb
DB_USER=root
DB_PASSWORD=password
PORT=3000
```

#### Django
Set in `.env`:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=DynamicApiDb
DB_USER=root
DB_PASSWORD=password
DEBUG=True
DJANGO_SETTINGS_MODULE=config.settings.development
```

---

## 🔄 Unified API Contract

### Request Format

All three implementations accept the same request format:

```json
POST /api/v1.0/DynamicApi/DynamicApiExecute
{
  "stringOne": "p_ProductId=1|p_Category=Electronics",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "GetProductById"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stringOne` | string | No | Parameter values (key=value format) |
| `stringTwo` | string | No | Parameter separator (default: `\|`) |
| `stringThree` | string | No | Key-value separator (default: `=`) |
| `stringFour` | string | Yes | Stored procedure name |

### Response Format

All three implementations return the same response format:

**Success Response**:
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "Column1": "Value1",
      "Column2": "Value2"
    }
  ]
}
```

**Error Response**:
```json
{
  "status": false,
  "message": "Error description",
  "data": null
}
```

---

## 🧪 Testing Endpoints

### Using curl

```bash
curl -X POST http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute \
  -H "Content-Type: application/json" \
  -d '{
    "stringOne": "p_ProductId=1",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "GetProductById"
  }'
```

### Using Postman

1. Create POST request
2. URL: `http://localhost:PORT/api/v1.0/DynamicApi/DynamicApiExecute`
3. Header: `Content-Type: application/json`
4. Body (JSON): Parameters shown above

### Using Swagger UI

1. Open Swagger documentation:
   - .NET: http://localhost:5000/swagger
   - Express: http://localhost:3000/api/v1.0/docs
   - Django: http://localhost:8000/api/docs/swagger/
2. Find endpoint: `/api/v1.0/DynamicApi/DynamicApiExecute`
3. Click "Try it out"
4. Enter parameters and click Execute

### Using Python

```python
import requests
import json

url = "http://localhost:PORT/api/v1.0/DynamicApi/DynamicApiExecute"
payload = {
    "stringOne": "p_ProductId=1",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "GetProductById"
}

response = requests.post(url, json=payload)
print(json.dumps(response.json(), indent=2))
```

### Using JavaScript

```javascript
fetch('http://localhost:PORT/api/v1.0/DynamicApi/DynamicApiExecute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stringOne: 'p_ProductId=1',
    stringTwo: '|',
    stringThree: '=',
    stringFour: 'GetProductById'
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## 📚 Architecture

### Layered Architecture (All Three Implementations)

```
┌─────────────────────────────────────┐
│      HTTP Layer (Request/Response)   │
│  Express / ASP.NET / Django Views    │
├─────────────────────────────────────┤
│     Routes Layer (Endpoints)         │
│  Routes / Controllers / URL Config   │
├─────────────────────────────────────┤
│    Services Layer (Business Logic)   │
│  Service Classes / Orchestration     │
├─────────────────────────────────────┤
│    Database Layer (Data Access)      │
│  Executor / Connection Management    │
├─────────────────────────────────────┤
│    Utilities & Middleware            │
│  Logging / Error Handling / Config   │
├─────────────────────────────────────┤
│      MySQL Database                  │
│  Stored Procedures Execution         │
└─────────────────────────────────────┘
```

### Key Architecture Features

- ✅ **Separation of Concerns**: Each layer has single responsibility
- ✅ **Service Layer**: Business logic abstracted from framework
- ✅ **Error Handling**: Centralized error management
- ✅ **Logging**: Comprehensive logging throughout
- ✅ **Parameterized Queries**: SQL injection prevention
- ✅ **Consistent API**: Same contract across all platforms
- ✅ **No Authentication**: Designed for internal APIs
- ✅ **Flexible Parameters**: Custom separators support

---

## 🔌 Key Technologies

### .NET Implementation
- **Framework**: ASP.NET Core 8.0
- **Database Driver**: MySqlConnector
- **ORM**: Entity Framework Core
- **Documentation**: Swashbuckle Swagger
- **Language**: C# 12

### Express Implementation
- **Framework**: Express.js 4.18+
- **Database Driver**: mysql2/promise
- **Documentation**: swagger-ui-express
- **Language**: JavaScript (Node.js)
- **Architecture**: Layered with proper separation

### Django Implementation
- **Framework**: Django 4.2
- **Database**: PyMySQL
- **REST**: Django REST Framework
- **Documentation**: drf-spectacular
- **Language**: Python 3.8+

---

## 📖 Documentation

Each implementation has comprehensive documentation:

- **DynamicApi (NET)**: [DynamicApi/README.md](./DynamicApi/README.md)
  - Setup instructions
  - Configuration guide
  - Troubleshooting

- **DynamicApi-Express**: 
  - [DynamicApi-Express/README.md](./DynamicApi-Express/README.md) - Quick reference
  - [DynamicApi-Express/documentation.md](./DynamicApi-Express/documentation.md) - Detailed guide

- **DynamicApi-Django**: [DynamicApi-Django/README.md](./DynamicApi-Django/README.md)
  - Comprehensive setup guide
  - Architecture documentation
  - Troubleshooting tips

---

## 🚢 Production Deployment

### .NET Deployment

**IIS Deployment**:
```powershell
# Publish release build
dotnet publish -c Release -o publish
# Copy publish folder to IIS directory
# Configure IIS application pool and website
```

**Docker Deployment**:
```bash
docker build -t dynamicapi-net .
docker run -e ConnectionStrings__DefaultConnection="..." -p 5000:80 dynamicapi-net
```

### Express Deployment

**Using PM2**:
```bash
npm install -g pm2
pm2 start src/index.js --name "dynamicapi-express"
pm2 startup
pm2 save
```

**Docker Deployment**:
```bash
docker build -t dynamicapi-express .
docker run -e DB_HOST=host.docker.internal -p 3000:3000 dynamicapi-express
```

### Django Deployment

**Using Gunicorn**:
```bash
pip install gunicorn
gunicorn config.wsgi --bind 0.0.0.0:8000 --workers 4
```

**Docker Deployment**:
```bash
docker build -t dynamicapi-django .
docker run -e DB_HOST=host.docker.internal -p 8000:8000 dynamicapi-django
```

---

## 🔍 Monitoring & Logging

### Health Check Endpoints

All implementations provide health endpoints:

- **.NET**: `GET http://localhost:5000/health`
- **Express**: `GET http://localhost:3000/health`
- **Django**: `GET http://localhost:8000/health`

### Logging

All implementations provide comprehensive logging:

- **File Logging**: Check logs/ directories
- **Console Logging**: Monitor startup output
- **Database Logging**: Execution logs stored in ExecutionLogs table

### Monitoring Strategy

1. **Health Check**: Monitor `/health` endpoint
2. **Application Logs**: Check log files regularly
3. **Database Health**: Monitor MySQL connectivity and backups
4. **Execution Logs**: Review procedure execution logs
5. **Error Rates**: Track error response rates
6. **Performance**: Monitor execution times

---

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed
- Verify MySQL is running
- Check connection credentials in configuration
- Ensure database and tables exist
- Check firewall rules

#### Port Already in Use
- Change PORT environment variable
- Or kill process using the port
- .NET: 5000, Express: 3000, Django: 8000

#### Swagger Not Loading
- Restart application after code changes
- Check JSDoc/decorators in route files
- Verify swagger configuration points to correct files

#### Procedure Not Found
- Verify procedure exists in database
- Check procedure name spelling (case-sensitive)
- Ensure database is selected

#### Parameter Parsing Error
- Verify parameter separators match request
- Check parameter format: key=value
- Ensure no trailing spaces in parameters

---

## 📋 Implementation Checklist

### Before Production Deployment

- [ ] Database backup configured
- [ ] SSL/TLS certificates installed
- [ ] Authentication layer added (if needed)
- [ ] Rate limiting configured
- [ ] CORS configured for allowed origins
- [ ] Logging configured properly
- [ ] Monitoring/alerting setup
- [ ] Load testing completed
- [ ] Security review completed
- [ ] Disaster recovery plan documented

---

## 🔐 Security Notes

### Current Implementation
- ⚠️ **No Authentication**: Designed for internal APIs only
- ✅ **SQL Injection Protection**: All queries parameterized
- ✅ **Input Validation**: Procedure names validated
- ✅ **CORS**: Configured
- ✅ **Error Handling**: Errors don't expose sensitive info

### Before Public Deployment
- [ ] Add authentication (JWT, API keys, OAuth)
- [ ] Add rate limiting
- [ ] Add input sanitization
- [ ] Enable HTTPS/TLS
- [ ] Configure security headers
- [ ] Add request logging
- [ ] Implement request signing

---

## 📞 Support

### Getting Help

1. **Check Implementation Documentation**: Each folder has detailed README
2. **Review Examples**: Swagger UI has request/response examples
3. **Check Logs**: Look in logs/ folder for error details
4. **Verify Configuration**: Ensure .env or appsettings are correct

### Common Questions

**Q: Can I use with non-MySQL databases?**
A: .NET supports multiple databases via EF Core. Express/Django can be modified with different drivers.

**Q: How do I add authentication?**
A: See authentication sections in each implementation's documentation.

**Q: Can I modify the API contract?**
A: Yes, but maintain consistency across all three implementations.

**Q: Is real-time data supported?**
A: No, these are request-response APIs. WebSocket support can be added.

---

## 📈 Performance Considerations

### Optimization Tips

1. **Connection Pooling**: All implementations use connection pooling
2. **Query Optimization**: Ensure stored procedures are optimized
3. **Indexing**: Create indexes on frequently queried columns
4. **Caching**: Consider caching frequently called procedures
5. **Load Balancing**: Deploy multiple instances behind load balancer

### Performance Benchmarks

Typical response times:
- **Simple procedures**: 10-50ms
- **Medium procedures**: 50-200ms
- **Complex procedures**: 200-1000ms+

---

## 🤝 Contributing

When adding features to one implementation:
1. Implement in all three platforms
2. Maintain API contract consistency
3. Add comprehensive documentation
4. Update this README if needed
5. Test across all platforms

---

## 📄 License

All implementations are provided under the MIT License.

---

## 🎯 Next Steps

1. **Choose a Platform**: Select which implementation suits your needs
2. **Follow Setup Guide**: Use Quick Start or detailed README
3. **Test Endpoints**: Use Swagger UI or curl to verify
4. **Review Architecture**: Understand the layered design
5. **Deploy**: Follow production deployment guidelines

---

## 📝 Version Information

- **Project Version**: 1.0.0
- **Last Updated**: March 27, 2026
- **.NET Version**: 8.0
- **Node.js Version**: 14.0+
- **Python Version**: 3.8+
- **MySQL Version**: 5.7+

---

For detailed setup instructions for your chosen platform, open the corresponding README:
- [DynamicApi](./DynamicApi/README.md)
- [DynamicApi-Express](./DynamicApi-Express/README.md)
- [DynamicApi-Django](./DynamicApi-Django/README.md)
