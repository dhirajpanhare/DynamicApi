# Dynamic API Documentation

## Project Overview

The Dynamic API is a flexible, scalable API solution that executes stored procedures dynamically across multiple database systems. It supports three implementations:

1. **DynamicApi** - C# .NET Core
2. **DynamicApi-Express** - Node.js with MySQL
3. **DynamicApi-Express-MongoDB** - Node.js with MongoDB

## Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│         HTTP Request                     │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │  Controller │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ Middleware  │
        └──────┬──────┘
               │
        ┌──────▼──────────┐
        │   Service Layer │
        └──────┬──────────┘
               │
        ┌──────▼────────────┐
        │ Database Executor │
        └──────┬────────────┘
               │
        ┌──────▼──────────┐
        │   Database      │
        │ (MySQL/MongoDB) │
        └─────────────────┘
```

## API Specification

### Base URL
```
/api/v1.0/DynamicApi
```

### Execute Stored Procedure
**Endpoint**: `POST /DynamicApiExecute`

**Request Body**:
```json
{
  "stringOne": "p_ProductId=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "GetProductById"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ProductId": 1,
      "ProductName": "Sample Product",
      "Price": 99.99
    }
  ]
}
```

## Database Schema

### Execution Log Table
```sql
CREATE TABLE execution_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  procedure_name VARCHAR(255),
  parameters LONGTEXT,
  status BOOLEAN,
  message VARCHAR(500),
  execution_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Authentication

JWTToken-based authentication for secure endpoints.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

## Error Handling

All endpoints follow this error response format:

```json
{
  "status": false,
  "message": "Error description",
  "data": null
}
```

## Features

- ✅ Dynamic stored procedure execution
- ✅ Multi-database support (MySQL, MongoDB, MSSQL)
- ✅ JWT authentication
- ✅ Comprehensive logging
- ✅ Swagger/OpenAPI documentation
- ✅ CORS support
- ✅ Input validation
- ✅ Error handling

## Development

Each implementation follows the same API contract but uses different tech stacks:

| Feature | DynamicApi (.NET) | DynamicApi-Express (SQL) | DynamicApi-Express (MongoDB) |
|---------|-------------------|-------------------------|----------------------------|
| Framework | .NET 8 | Express.js | Express.js |
| Database | MySQL | MySQL | MongoDB |
| ORM | EF Core | Sequelize | Mongoose |
| Auth | JWT | JWT | JWT |
| Port | 5000 | 3000 | 3000 |

## Deployment

### Docker Deployment
All projects support Docker containerization for easy deployment.

### Production Settings
- Enable HTTPS
- Set environment variables for credentials
- Configure database connections
- Enable CORS only for trusted origins

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL/MongoDB is running
   - Check connection string in configuration
   - Verify user credentials

2. **JWT Authentication Failed**
   - Check token expiration
   - Verify JWT secret key
   - Check Authorization header format

3. **Stored Procedure Not Found**
   - Verify procedure exists in database
   - Check procedure name in request
   - Verify user has execute permissions

## Support

For issues and questions, refer to individual project READMEs.

## License

MIT License - All projects
