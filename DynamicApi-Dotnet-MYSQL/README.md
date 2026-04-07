# DynamicApi - C# .NET Implementation

## Overview
This is a C# .NET Core implementation of the Dynamic API that executes stored procedures dynamically. It now includes two powerful endpoints:

1. **Dynamic API** - Fast execution of stored procedures without transaction overhead
2. **Dynamic Transaction API** - Execute stored procedures with full transaction support (automatic commit/rollback)

## Technologies Used
- **Framework**: .NET 8.0
- **Database**: MySQL 8.0+
- **ORM**: Entity Framework Core
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI

## Project Structure
```
DynamicApi/
├── Controllers/         # API endpoints
├── Services/           # Business logic
├── Repository/         # Data access
├── Models/            # Data models
├── Data/              # DbContext
├── Auth/              # Authentication
├── Utilities/         # Helper functions
├── Middleware/        # Custom middleware
├── SQL/               # Database scripts
└── Properties/        # Project configuration
```

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- MySQL 8.0+
- Visual Studio or VS Code

### Installation
1. Clone the repository
2. Configure connection string in `appsettings.json`
3. Run migrations: `dotnet ef database update`
4. Build: `dotnet build`
5. Run: `dotnet run`

## API Endpoints

### Dynamic API (No Transaction)
- **POST** `/api/v1.0/DynamicApi/DynamicApiExecute` - Execute stored procedure (fast, no transaction)
- **POST** `/api/v1.0/DynamicApi/GeneratePayload` - Generate payload from CREATE PROCEDURE definition
- **GET** `/api/v1.0/DynamicApi/GetProcedureMetadata/{procedureName}` - Get procedure metadata
- **GET** `/api/v1.0/DynamicApi/ListProcedures` - List all available procedures

### Dynamic Transaction API (With Transaction Support)
- **POST** `/api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute` - Execute stored procedure with transaction
- **GET** `/api/v1.0/DynamicTransactionApi/health` - Health check

### Generate Payload Endpoint

The GeneratePayload endpoint helps you quickly create test payloads from stored procedure definitions:

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1.0/DynamicApi/GeneratePayload \
  -H "Content-Type: application/json" \
  -d '{
    "procedureDefinition": "CREATE PROCEDURE GetProductById(IN p_ProductId INT, IN p_Category VARCHAR(100)) BEGIN SELECT * FROM Products WHERE ProductId = p_ProductId AND Category = p_Category; END"
  }'
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

### Quick Comparison

| Feature | Dynamic API | Dynamic Transaction API |
|---------|-------------|------------------------|
| Transaction Support | ❌ No | ✅ Yes (automatic) |
| Rollback on Error | ❌ No | ✅ Automatic |
| Output Parameters | ❌ No | ✅ Yes |
| Best For | Simple reads | Atomic operations |
| Performance | ⚡ Fastest | ⚡ Fast |

**See [API_COMPARISON.md](./API_COMPARISON.md) for detailed comparison**

## Database Connection

Update `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=DynamicApiDb;User=root;Password=123456;"
  },
  "CorsOrigins": "http://localhost:3000,http://localhost:4200,http://localhost:8000,https://yourdomain.com"
}
```

---

## CORS Configuration

Ensure the following origins are allowed for frontend testing:

- http://localhost:3000 (React)
- http://localhost:4200 (Angular)
- http://localhost:8000

---

## Dynamic Transaction API - Quick Start

### Example: Insert with Transaction

```bash
curl -X POST http://localhost:5000/api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute \
  -H "Content-Type: application/json" \
  -d '{
    "stringOne": "p_Name=Product A|p_Price=99.99",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "Product_Insert"
  }'
```

**Response:**
```json
{
  "status": true,
  "message": "Transaction completed successfully",
  "data": [],
  "transactionId": 42,
  "executionTimeMs": 125
}
```

### Key Features
- ✅ **Automatic Commit/Rollback** - Transaction safety built-in
- ✅ **Output Parameters** - Get auto-generated IDs back
- ✅ **No Code Needed** - Just call the endpoint
- ✅ **Comprehensive Logging** - All executions tracked
- ✅ **Error Handling** - Graceful rollback on failures

### When to Use
- Header + Detail inserts (Orders, Invoices)
- Operations requiring atomicity
- Multi-step workflows
- Any operation needing rollback capability

**See [DYNAMIC_TRANSACTION_README.md](./DYNAMIC_TRANSACTION_README.md) for complete guide**

---

## Frontend Redirection Example

To redirect from a .NET controller to a frontend app:

```csharp
return Redirect("http://localhost:3000"); // or http://localhost:4200 for Angular
```

---

## Frontend API Call Templates

### React Example (axios)

```jsx
// src/apiCall.js
import axios from 'axios';

export async function callDynamicApi() {
  const response = await axios.post('http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute', {
    stringOne: 'p_ContactId=5|p_Status=Active',
    stringTwo: '|',
    stringThree: '=',
    stringFour: 'SP_GetContactData'
  });
  return response.data;
}
```

### Angular Example (HttpClient)

```typescript
// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  callDynamicApi(): Observable<any> {
    return this.http.post('http://localhost:5000/api/v1.0/DynamicApi/DynamicApiExecute', {
      stringOne: 'p_ContactId=5|p_Status=Active',
      stringTwo: '|',
      stringThree: '=',
      stringFour: 'SP_GetContactData'
    });
  }
}
```

## Documentation
- **API Documentation**: `http://localhost:5000/swagger`
- **Dynamic Transaction API Guide**: [DYNAMIC_TRANSACTION_API_GUIDE.md](./DYNAMIC_TRANSACTION_API_GUIDE.md)
- **Quick Reference**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **API Comparison**: [API_COMPARISON.md](./API_COMPARISON.md)
- **Implementation Summary**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Database Schema**: See `SQL/` folder
- **HTTP Examples**: [DynamicTransactionApi.http](./DynamicTransactionApi.http)

## License
MIT
