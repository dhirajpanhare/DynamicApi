# DynamicApi-Express - Node.js Implementation

## Overview
This is a Node.js Express implementation of the Dynamic API that executes stored procedures dynamically with MSSQL. Includes email-based OTP authentication for secure access.

## Technologies Used
- **Framework**: Express.js 4.18+
- **Database**: MSSQL 2019+
- **Database Driver**: tedious (mssql package)
- **Authentication**: JWT + Email OTP
- **Email**: Nodemailer (Gmail, SMTP support)
- **Documentation**: Swagger/OpenAPI
- **CORS**: Cross-Origin Resource Sharing enabled
- **Environment**: Dotenv for configuration

## Project Architecture

### Layered Architecture
- **HTTP Layer**: Express.js application setup and middleware
- **Routes Layer**: API endpoint definitions with Swagger documentation
- **Controllers Layer**: HTTP request/response handling
- **Services Layer**: Business logic and orchestration
- **Database Layer**: Stored procedure execution with parameterized queries
- **Middleware Layer**: Error handling and cross-cutting concerns
- **Utilities Layer**: Logging and helper functions

### Project Structure
```
DynamicApi-Express/
├── src/
│   ├── index.js                          # Application entry point
│   ├── config/
│   │   ├── database.js                   # Database configuration
│   │   ├── environment.js                # Environment settings
│   │   └── swagger.js                    # Swagger/OpenAPI spec
│   ├── routes/
│   │   └── apiRoutes.js                  # API endpoint definitions
│   ├── controllers/
│   │   └── dynamicApiController.js       # Request handlers
│   ├── services/
│   │   ├── dynamicApiService.js          # Business logic
│   │   └── storedProcedureExecutor.js    # Database executor
│   ├── middleware/
│   │   └── errorHandler.js               # Error handling
│   └── utils/
│       └── logger.js                     # Logging utility
├── database/
│   └── setup.sql                         # Database schema
├── package.json                          # Dependencies
├── .env.example                          # Environment template
├── .gitignore                            # Git ignore rules
├── README.md                             # This file
└── documentation.md                      # Detailed documentation
```

## Getting Started

## CORS Configuration

Add the following to your `.env` or as default in code:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8000
```

## Frontend Redirection Example

To redirect from an Express route to a frontend app:

```js
res.redirect('http://localhost:3000'); // or http://localhost:4200 for Angular
```

### Prerequisites
- **Node.js**: 14.0+ (Recommended: 16+)
- **MySQL**: 5.7+ (Recommended: 8.0+)
- **npm**: 6.0+

### Installation

1. **Extract project**
   ```bash
   cd DynamicApi-Express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file (.env)**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=DynamicApiDb
   DB_USER=root
   DB_PASSWORD=your_password
   PORT=3000
   NODE_ENV=development
   ```

4. **Create MySQL database**
   ```bash
   mysql -u root -p
   CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4;
   EXIT;
   ```

5. **Import database schema** (optional - for ExecutionLogs table)
   ```bash
   mysql -u root -p DynamicApiDb < database/setup.sql
   ```

6. **Start development server**
   ```bash
   npm start
   ```
   Server runs at: http://localhost:3000

## Running the Application

### Development
```bash
npm start
```

### Development with auto-reload
```bash
npm run dev
```
*(Requires nodemon - install with: npm install --save-dev nodemon)*

## API Endpoints

### Execute Stored Procedure
- **URL**: `POST /api/v1.0/DynamicApi/DynamicApiExecute`
- **Parameters**:
  - `stringOne`: Parameter values (key=value format)
  - `stringTwo`: Parameter separator (default: `|`)
  - `stringThree`: Key-value separator (default: `=`)
  - `stringFour`: Stored procedure name (required)

### Generate Payload from Procedure Definition
- **URL**: `POST /api/v1.0/DynamicApi/GeneratePayload`
- **Description**: Paste a CREATE PROCEDURE SQL definition and receive a ready-to-use payload
- **Request Body**:
  ```json
  {
    "procedureDefinition": "CREATE PROCEDURE GetProductById(@ProductId INT, @Category VARCHAR(100)) AS BEGIN SELECT * FROM Products WHERE ProductId = @ProductId; END"
  }
  ```
- **Response**:
  ```json
  {
    "stringOne": "@ProductId=1|@Category=SampleText",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "GetProductById"
  }
  ```

### Health Check
- **URL**: `GET /health`
- **Description**: Returns server health status

## Email Authentication Setup

### Gmail SMTP Configuration

Update `.env` with Gmail credentials:

```env
# Email Configuration
EMAIL_PROVIDER=GMAIL
SENDER_EMAIL=your-email@gmail.com
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

**Note**: To generate an app password:
1. Enable 2-Step Verification on your Gmail account
2. Visit https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy the generated 16-character password

### Send OTP Email

**Endpoint**: `POST /api/v1.0/auth/send-otp`

**Request:**
```bash
curl -X POST http://localhost:3002/api/v1.0/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{\"email\": \"user@example.com\"}'
```

**Response:**
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

### Verify OTP and Get Token

**Endpoint**: `POST /api/v1.0/auth/verify-otp`

**Request:**
```bash
curl -X POST http://localhost:3002/api/v1.0/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{\"email\": \"user@example.com\", \"otp\": \"123456\"}'
```

**Response:**
```json
{
  "status": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-id",
      "email": "user@example.com"
    }
  }
}
```

### API Documentation
- **Swagger UI**: http://localhost:3000/api/v1.0/docs
- **Swagger JSON**: http://localhost:3000/swagger.json

## Request Example

## Frontend API Call Templates

### React Example (axios)

```jsx
// src/apiCall.js
import axios from 'axios';

export async function callDynamicApi() {
  const response = await axios.post('http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute', {
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
    return this.http.post('http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute', {
      stringOne: 'p_ContactId=5|p_Status=Active',
      stringTwo: '|',
      stringThree: '=',
      stringFour: 'SP_GetContactData'
    });
  }
}
```

### Using curl
```bash
curl -X POST http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute \
  -H "Content-Type: application/json" \
  -d '{
    "stringOne": "p_ProductId=1|p_Category=Electronics",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "GetProductById"
  }'
```

### Response Example
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ProductId": 1,
      "ProductName": "Laptop",
      "Price": 50000
    }
  ]
}
```

## Environment Variables

### Required
```
DB_HOST=127.0.0.1          # MySQL host
DB_PORT=3306               # MySQL port
DB_NAME=DynamicApiDb       # Database name
DB_USER=root               # MySQL user
DB_PASSWORD=123456         # MySQL password
```

### Optional
```
PORT=3000                  # Server port (default: 3000)
NODE_ENV=development       # Environment (development/production)
```

## Key Features

- ✅ Dynamic stored procedure execution
- ✅ Custom parameter separators
- ✅ Parameterized queries (SQL injection safe)
- ✅ Execution logging to database
- ✅ Execution time tracking
- ✅ Comprehensive error handling
- ✅ Swagger/OpenAPI documentation
- ✅ Health check endpoint
- ✅ CORS enabled
- ✅ Layered architecture
- ✅ No authentication required

## Documentation

For detailed information, see [documentation.md](./documentation.md) which includes:
- Complete setup instructions for Windows, macOS, Linux
- Architecture overview
- How to extend the application
- Production deployment guide
- Troubleshooting guide
- Operational considerations

## Security Notes

- ⚠️ No authentication is enforced (designed for internal APIs only)
- ✅ Parameterized queries prevent SQL injection
- ✅ Input validation on procedure names
- ✅ CORS configured
- ⚠️ Not recommended for public-facing APIs without adding authentication

## Architecture Benefits

- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Components can be tested independently
- **Maintainability**: Clear code organization
- **Scalability**: Easy to add new features
- **Reusability**: Utilities and services are reusable
- **Error Handling**: Centralized error management

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`
- Verify npm packages installed: `npm list`

### Database connection error
- Verify MySQL is running
- Check .env credentials match your MySQL setup
- Ensure database exists: `SHOW DATABASES;`

### Swagger endpoints not showing
- Restart server after code changes
- Check src/routes/apiRoutes.js has Swagger comments
- Verify swagger.js points to correct files

## License
MIT

## Contact
For support or questions, contact: support@example.com

DB_PASSWORD=123456
DB_NAME=DynamicApiDb
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## Documentation
- API Documentation: `http://localhost:3000/api-docs`
- Database Schema: See `database/` folder

## License
MIT
