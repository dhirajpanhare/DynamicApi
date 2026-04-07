# DynamicApi - C# .NET Implementation

## Overview
This is a C# .NET Core implementation of the Dynamic API that executes stored procedures dynamically.

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
- **POST** `/api/v1.0/DynamicApi/DynamicApiExecute` - Execute stored procedure
- **POST** `/api/v1.0/DynamicApi/GeneratePayload` - Generate payload from CREATE PROCEDURE definition
- **GET** `/api/v1.0/DynamicApi/GetProcedureMetadata/{procedureName}` - Get procedure metadata
- **GET** `/api/v1.0/DynamicApi/ListProcedures` - List all available procedures

### Generate Payload Endpoint

The GeneratePayload endpoint helps you quickly create test payloads from stored procedure definitions:

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1.0/DynamicApi/GeneratePayload \
  -H "Content-Type: application/json" \
  -d '{
    "procedureDefinition": "CREATE PROCEDURE GetProductById(@ProductId INT, @Category VARCHAR(100)) AS BEGIN SELECT * FROM Products WHERE ProductId = @ProductId AND Category = @Category; END"
  }'
```

**Response:**
```json
{
  "stringOne": "@ProductId=1|@Category=SampleText",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "GetProductById"
}
```

You can then use this response directly in the DynamicApiExecute endpoint!

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
- API Documentation: `http://localhost:5000/swagger`
- Database Schema: See `SQL/` folder

## License
MIT
