# DynamicApi (.NET) Quick Start

## Prerequisites
- .NET 8.0 SDK installed
- MySQL 8.0+ running
- Visual Studio or VS Code

## Setup

### 1. Configure Database
Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=127.0.0.1;Port=3306;Database=DynamicApiDb;User=root;Password=123456;"
  }
}
```

### 2. Install Dependencies
```bash
cd DynamicApi
dotnet restore
```

### 3. Run Application
```bash
dotnet run
```

### 4. Access API
- Swagger UI: http://localhost:5000/swagger
- API Endpoint: POST http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute

## Test API

### cURL Example
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

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check connection string
- Verify credentials

### Port Already in Use
```bash
dotnet run --urls "https://localhost:5001"
```

## Documentation
See DEPLOYMENT_GUIDE.md for production deployment.
