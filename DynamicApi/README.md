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

## Database Connection
Update `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=DynamicApiDb;User=root;Password=123456;"
  }
}
```

## Documentation
- API Documentation: `http://localhost:5000/swagger`
- Database Schema: See `SQL/` folder

## License
MIT
