# Express API Implementation - Proper Architecture

## System Requirements

### Minimum Requirements
- **Node.js**: 14.0+ (Recommended: 16+)
- **npm**: 6.0+ or Yarn 1.22+
- **MySQL**: 5.7+ (Recommended: 8.0+)
- **2GB RAM** for development
- **500MB Disk** space

### Operating System Support
- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Ubuntu 18.04+
- ✅ Any Linux with Node.js support

### Required npm Packages
```
express@4.18.2
mysql2@3.6.2
cors@2.8.5
swagger-ui-express@4.6.3
swagger-jsdoc@6.2.5
dotenv@16.3.1
```

---

## Installation & Setup Guide

### Prerequisites

#### Windows
- Download Node.js from: https://nodejs.org/ (LTS version)
- Download MySQL from: https://dev.mysql.com/downloads/mysql/
- Verify installation with:
  - `node --version`
  - `npm --version`
  - `mysql --version`

#### macOS
- Install Homebrew (if not installed)
- Install Node.js using Homebrew
- Install MySQL using Homebrew
- Verify installation with:
  - `node --version`
  - `npm --version`
  - `mysql --version`

#### Linux (Ubuntu/Debian)
- Use package manager to install Node.js and npm
- Use package manager to install MySQL Server
- Verify installation with:
  - `node --version`
  - `npm --version`
  - `mysql --version`

---

### Step-by-Step Setup

#### Step 1: Install Node.js and npm

**Windows**:
- Download installer from nodejs.org
- Run installer with default settings
- Restart computer for PATH updates

**macOS**:
- Use installer from nodejs.org or
- Use Homebrew: will install both Node.js and npm

**Linux**:
- Using apt (Ubuntu/Debian): install node.js and npm packages
- Verify with `node --version` command

#### Step 2: Install MySQL

**Windows**:
- Download MySQL Community Server
- Run installer and follow setup wizard
- Default port is 3306

**macOS**:
- Use Homebrew to install MySQL
- Start MySQL service with Homebrew
- Default port is 3306

**Linux**:
- Use apt package manager to install mysql-server
- Start MySQL service with systemctl
- Default port is 3306

#### Step 3: Clone and Setup Project

Navigate to project directory and perform these steps across all platforms:
- Clone or extract the project
- Navigate into DynamicApi-Express directory
- Install dependencies with npm
- Dependencies will be downloaded and installed

#### Step 4: Configure Environment

Create `.env` file in project root with these settings:
- Server port (default: 3000)
- Database host (default: 127.0.0.1)
- Database port (default: 3306)
- Database name (default: DynamicApiDb)
- Database username (default: root)
- Database password

#### Step 5: Setup Database

Connect to MySQL and create database with:
- Database name: DynamicApiDb
- Character set: utf8mb4
- Collation: utf8mb4_unicode_ci

Import the SQL setup file to create required tables and procedures.

#### Step 6: Start Application

Run the development server with npm. The server will start on the configured port (default: 3000).

Access the application:
- Main server: http://localhost:3000
- Swagger UI: http://localhost:3000/api/v1.0/docs
- Health check: http://localhost:3000/health

---

### Platform-Specific Setup Summary

**Windows Setup**:
1. Download Node.js LTS installer
2. Download MySQL installer
3. Extract project
4. Run npm install
5. Create .env file
6. Create MySQL database
7. Run npm start

**macOS Setup**:
1. Install Homebrew if needed
2. Use Homebrew to install Node.js
3. Use Homebrew to install MySQL
4. Extract project
5. Run npm install
6. Create .env file
7. Create MySQL database
8. Run npm start

**Linux Setup**:
1. Update package manager
2. Install Node.js and npm
3. Install MySQL Server
4. Extract project
5. Run npm install
6. Create .env file
7. Create MySQL database
8. Run npm start

---

## Project Folder Structure

```
DynamicApi-Express/
├── src/
│   ├── index.js                           # Main application entry point
│   ├── config/
│   │   ├── database.js                    # Database configuration
│   │   ├── environment.js                 # Environment settings
│   │   └── swagger.js                     # Swagger/OpenAPI documentation
│   ├── routes/                            # API route definitions
│   │   └── apiRoutes.js                   # All route endpoints with JSDoc
│   ├── controllers/                       # HTTP request handlers
│   │   └── dynamicApiController.js        # Dynamic API controller
│   ├── services/                          # Business logic layer
│   │   ├── dynamicApiService.js           # Service orchestration
│   │   └── storedProcedureExecutor.js     # Database executor
│   ├── middleware/                        # Middleware components
│   │   └── errorHandler.js                # Error handling middleware
│   └── utils/                             # Utility functions
│       └── logger.js                      # Logging utility
├── database/
│   └── setup.sql                          # Database schema and procedures
├── .env.example                           # Environment variables template
├── .gitignore                             # Git ignore rules
├── package.json                           # npm dependencies
├── README.md                              # Project documentation
└── documentation.md                       # This file
```

### Architecture Layers

**HTTP Layer** (`src/index.js`)
- Express application setup
- Middleware configuration
- Database connection pools
- Service initialization
- Server startup

**Routes Layer** (`src/routes/apiRoutes.js`)
- Endpoint definitions
- Route registration
- JSDoc/Swagger documentation
- Maps routes to controllers

**Controllers Layer** (`src/controllers/dynamicApiController.js`)
- HTTP request/response handling
- Input validation
- Service invocation
- Response formatting

**Services Layer** (`src/services/dynamicApiService.js`)
- Business logic orchestration
- Custom parameter parsing
- Execution tracking
- Database logging

**Database Layer** (`src/services/storedProcedureExecutor.js`)
- MySQL connection management
- Parameterized query execution
- Stored procedure calls
- Result set extraction

**Middleware Layer** (`src/middleware/errorHandler.js`)
- Error handling
- 404 responses
- Response formatting

**Utilities** (`src/utils/logger.js`)
- Logging functions
- Info, error, debug, warn levels
- Consistent timestamp formatting

---

## Implementation Updates

The Express API implementation has been refactored to follow enterprise-grade architecture with proper separation of concerns:

### Entry Point Refactoring (`src/index.js`)
The main application file has been cleaned and reorganized:
- Imports all dependencies and modules
- Configures middleware (CORS, JSON parser)
- Creates database connection pools
- Initializes services and controllers
- Registers routes and error handlers
- Starts the server
- Code reduced from 197 to 119 lines
- Clear section comments for organization

### Routes Layer (`src/routes/apiRoutes.js`)
Dedicated routes file containing:
- Route definitions for all endpoints
- JSDoc/Swagger documentation for each endpoint
- Route-to-controller mapping
- API endpoint specifications:
  - `POST /api/v1.0/DynamicApi/DynamicApiExecute`
  - `GET /health`

### Controllers Layer (`src/controllers/dynamicApiController.js`)
Extracted request handlers into dedicated controller:
- `DynamicApiController` class
- `executeProcedure()` method for API execution
- `healthCheck()` method for health status
- Input validation
- Service invocation
- Response formatting

### Middleware Layer (`src/middleware/errorHandler.js`)
Centralized error handling:
- `notFoundHandler` for 404 responses
- `errorHandler` for uncaught exceptions
- Standardized error response format
- Development error stack traces
- Consistent error reporting

### Utilities Layer (`src/utils/logger.js`)
Extracted logging utility:
- `logger.info()` for informational messages
- `logger.error()` for error messages
- `logger.debug()` for debug messages
- `logger.warn()` for warning messages
- Consistent timestamp formatting
- Used across all modules

### Service Layer Architecture
Existing service layer enhanced:
- Business logic orchestration
- Custom parameter parsing and handling
- Execution time tracking
- Database logging of all operations
- Proper error handling and reporting

### Database Executor
Maintained database interaction layer:
- MySQL connection management
- Parameterized query execution for security
- Flexible parameter separators support
- Proper result set extraction
- Debug-level logging

---

## Code Organization Best Practices Applied

### Service Layer Architecture
A proper service layer was introduced to handle:
- Business logic orchestration
- Custom parameter parsing and handling
- Execution time tracking
- Database logging of all operations
- Proper error handling and reporting

### Database Executor
The database interaction layer was enhanced to:
- Use parameterized queries for security
- Support flexible parameter separators
- Execute stored procedures correctly
- Extract and process result sets properly
- Provide comprehensive debug logging

### Application Structure
The main application was restructured following industry standards with:
- Proper service initialization
- Request validation and response formatting
- Support for custom parameter separators
- Comprehensive error handling
- Health check monitoring capability

### API Documentation
Swagger documentation provides:
- Complete request and response schemas
- Parameter descriptions and examples
- Error response definitions
- API endpoint specifications

---

## Key Improvements vs Original Implementation

The updated implementation provides:
- **Custom Separator Support**: Flexible parameter parsing with configurable separators
- **Execution Logging**: All procedure executions logged to database for audit trails
- **Performance Tracking**: Execution duration measured and recorded
- **Service Layer**: Proper separation of concerns with dedicated business logic layer
- **Security**: Parameterized queries prevent SQL injection attacks
- **Error Handling**: Comprehensive error handling with proper status codes
- **Production Ready**: Enterprise architecture following best practices

---

## Architecture Overview

### 1. Service Layer
Handles business logic and orchestration of database operations with:
- Execution logic for stored procedures
- Custom separator support for flexible parameter handling  
- Execution tracking and measurement in milliseconds
- Automatic logging to database
- Comprehensive error handling
- Non-blocking operations

### 2. Database Executor
Manages all database interactions with:
- MySQL connection management
- Parameterized query execution for security
- Flexible parameter parsing with custom separators
- Proper result set extraction
- Debug-level logging

### 3. Main Application
Coordinates HTTP handling with:
- Service initialization
- Request validation and parsing
- Response formatting
- Custom separator handling
- Comprehensive error handling
- Health check monitoring
- 404 error responses
- Global error handling

### 4. Swagger Documentation
Provides API specification with:
- Complete request schemas
- Response format definitions
- Error response specifications
- Parameter documentation

---

---

## Key Components & Responsibilities

### Application Entry Point (`src/index.js`)
Responsible for:
- Loading environment variables
- Creating Express app instance
- Setting up middleware (CORS, JSON)
- Creating database connection pools
- Initializing services
- Initializing controllers
- Registering routes
- Registering error handlers
- Starting the server

### Routes Definition (`src/routes/apiRoutes.js`)
Responsible for:
- Defining API endpoints
- Mapping routes to controllers
- Documenting endpoints with JSDoc/Swagger
- Centralizing route definitions

### Request Handlers (`src/controllers/dynamicApiController.js`)
Responsible for:
- Validating HTTP request data
- Extracting request parameters
- Invoking services
- Formatting HTTP responses
- Error handling for HTTP layer

### Business Logic (`src/services/dynamicApiService.js`)
Responsible for:
- Orchestrating service operations
- Parsing custom parameters
- Tracking execution metrics
- Logging executions to database
- Handling service-level errors

### Database Interaction (`src/services/storedProcedureExecutor.js`)
Responsible for:
- Managing MySQL connections
- Building parameterized queries
- Executing stored procedures
- Extracting result sets
- Providing detailed logging

### Error Handling (`src/middleware/errorHandler.js`)
Responsible for:
- Catching 404 errors
- Catching unhandled exceptions
- Formatting error responses
- Logging errors
- Providing stack traces (dev mode)

### Logging (`src/utils/logger.js`)
Responsible for:
- Providing logging methods
- Formatting log messages with timestamps
- Supporting multiple log levels
- Being reusable across modules

---

## Key Components & Architecture

### Service Layer
The application uses a proper service layer architecture that separates concerns:
- Handles business logic and orchestration
- Manages database interactions
- Processes HTTP requests and responses separately

### Database Interaction
Database operations are abstracted into a dedicated executor component that:
- Manages MySQL connections
- Handles parameter binding for security
- Executes stored procedures
- Provides result set processing
- Enables comprehensive logging

### API Endpoints
The application exposes REST endpoints for:
- Dynamic API execution with custom parameters
- Health checks for monitoring
- Swagger documentation

---

## Key Features

### Custom Parameter Handling
The application supports flexible parameter configuration:
- Custom parameter separators (default: pipe character)
- Custom key-value separators (default: equals sign)
- Dynamic parameter parsing from request

### Execution Tracking
All procedure executions are tracked with:
- Execution status (success or failure)
- Execution timestamps
- Execution duration measurement
- Error messages and details
- User identification for audit trails

### Security Features
The application implements security best practices including:
- Parameterized queries to prevent SQL injection
- Input validation
- Error handling without exposing sensitive information
- Configuration management through environment variables
- Secure database credential handling

### API Consistency
The Express implementation maintains consistency with other implementations:
- Same request/response format
- Same parameter structure
- Same error handling approach
- Same execution logging mechanism

---

## Technology Stack

### Core Framework
- Node.js runtime environment
- Express.js web framework
- MySQL2 database driver with promise support

### Additional Libraries
- CORS middleware for cross-origin requests
- Swagger tools for API documentation
- Environment configuration management
- JWT support for authentication

---

## Maintenance & Updates

### Regular Maintenance Tasks
Keep the application running smoothly by:
- Monitoring application logs
- Checking database connectivity
- Verifying stored procedure execution
- Managing dependencies updates
- Monitoring error rates

### Database Management
Maintain database health through:
- Regular backups
- Monitoring table sizes
- Archiving old execution logs
- Optimizing slow queries
- Managing indexes

### Performance Optimization
Improve application performance by:
- Connection pooling configuration
- Query optimization
- Logging level adjustment
- Caching strategies (future)
- Load testing before deployment

---

---

## Request Flow Through Architecture

```
HTTP Request
    ↓
[src/index.js] - Express app receives request
    ↓
[src/routes/apiRoutes.js] - Route matched to handler
    ↓
[src/controllers/dynamicApiController.js] - Request validation & response formatting
    ↓
[src/services/dynamicApiService.js] - Business logic & orchestration
    ↓
[src/services/storedProcedureExecutor.js] - Database interaction
    ↓
[MySQL Database] - Execute stored procedure
    ↓
[Result back through layers]
    ↓
[src/middleware/errorHandler.js] - Error handling (if needed)
    ↓
HTTP Response
```

---

## Architecture & Design Pattern

The application follows a layered architecture pattern:
- **HTTP Layer**: Express.js handles incoming requests
- **Routes Layer**: Defines endpoints and maps to controllers
- **Controllers Layer**: Handles HTTP request/response
- **Service Layer**: Business logic and orchestration
- **Database Layer**: Stored procedure execution
- **Middleware Layer**: Cross-cutting concerns
- **Utilities Layer**: Reusable functions
- **Configuration Layer**: Environment settings and credentials

This separation allows for:
- Easy testing of individual components
- Clear separation of concerns
- Reusable service logic
- Scalable architecture
- Maintainable codebase
- Framework-agnostic business logic

---

## Comparison with Original Implementation

The current implementation provides:
- ✅ Proper folder structure with clear separation
- ✅ Routes layer for endpoint definitions
- ✅ Controllers layer for request handling  
- ✅ Middleware layer for error handling
- ✅ Utilities layer for logging
- ✅ Service layer structure
- ✅ Custom separator support for flexible parameter handling
- ✅ Execution logging to database
- ✅ Execution time tracking
- ✅ Parameterized queries for security
- ✅ Comprehensive error handling
- ✅ Framework-agnostic business logic
- ✅ Production-ready code quality
- ✅ Testable architecture
- ✅ Maintainable codebase

### Before vs After Refactoring

| Aspect | Before | After |
|--------|--------|-------|
| **Entry Point Lines** | 197 | 119 |
| **Routes Organization** | Inline in index.js | Separate routes/ folder |
| **Controllers** | None (logic inline) | Dedicated controllers/ folder |
| **Middleware** | Inline error handling | Organized middleware/ folder |
| **Logging** | Inline logger | Utilities layer utils/logger.js |
| **Folder Structure** | Minimal | Complete layered architecture |
| **Testability** | Difficult | Easy - layers separated |
| **Maintainability** | Hard to navigate | Clear file organization |
| **Code Reusability** | Low | High |
| **Scalability** | Limited | Excellent |

---

## Related Implementations

This Express.js implementation mirrors the architecture of:
- .NET DynamicApi (C#)
- Django DynamicApi (Python)

All three implementations share:
- Same API contract and response format
- Same parameter handling mechanism
- Same execution logging approach
- Same error handling strategy
- Layered architecture pattern

---

## API Usage

### Endpoint Purpose
The primary endpoint handles dynamic stored procedure execution with flexible parameter configuration.

### Request Parameters
Four parameters are required for API requests:
- Parameter list and values
- Parameter separator specification
- Key-value separator specification
- Stored procedure name

### Response Format
Responses include execution status, messages, and result data in a standardized format.

### HTTP Methods
The API accepts POST requests with JSON payload.

---

## Testing & Verification

### Swagger Documentation
API documentation is automatically generated from JSDoc comments in `src/routes/apiRoutes.js`:
- Available at: http://localhost:3000/api/v1.0/docs
- Complete request and response schemas
- Ready for testing via swagger UI
- Parameter descriptions and examples

### Health Checks
Health endpoint available for monitoring:
- Endpoint: GET http://localhost:3000/health
- Returns status, timestamp, and environment
- Quick verification that server is running

### Manual Testing

**Using Swagger UI** (Recommended):
1. Navigate to http://localhost:3000/api/v1.0/docs
2. Click on `POST /api/v1.0/DynamicApi/DynamicApiExecute`
3. Click "Try it out"
4. Enter request parameters
5. Click Execute

**Using curl Command Line**:
```
curl -X POST http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute \
  -H "Content-Type: application/json" \
  -d '{"stringOne":"p_ProductId=1","stringTwo":"|","stringThree":"=","stringFour":"GetProductById"}'
```

**Using Postman**:
1. Create new POST request
2. URL: http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute
3. Headers: Content-Type: application/json
4. Body (JSON): parameters as shown above
5. Send request

**Using JavaScript/Node.js**:
```javascript
fetch('http://localhost:3000/api/v1.0/DynamicApi/DynamicApiExecute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stringOne: 'p_ProductId=1',
    stringTwo: '|',
    stringThree: '=',
    stringFour: 'GetProductById'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Database Setup

The setup script creates required tables and infrastructure for:
- Execution log storage
- Audit trail maintenance
- Sample data and procedures for testing

The script should be executed during initial setup to prepare the database.

---

## How to Extend the Application

### Adding a New API Endpoint

**Step 1: Add Route** (`src/routes/apiRoutes.js`)
- Add JSDoc/Swagger documentation for the endpoint
- Register route with controller method call

**Step 2: Add Controller Method** (`src/controllers/dynamicApiController.js`)
- Create new method to handle the endpoint
- Validate request data
- Call appropriate service method
- Format and return response

**Step 3: Add Service Method** (`src/services/dynamicApiService.js`)
- Implement business logic for the new endpoint
- Use database executor if needed
- Handle errors appropriately

**Step 4: Test**
- Access Swagger UI to test new endpoint
- Verify request/response format
- Check error handling

### Adding New Middleware

**Create new middleware file** in `src/middleware/` folder:
- Implement middleware function
- Export from file
- Register in `src/index.js` with `app.use()`

### Adding Utility Functions

**Create new utility file** in `src/utils/` folder:
- Implement helper functions
- Export functions
- Import in needed modules
- Use across application

### Adding Configuration

**Add to `.env` file**:
- Define new environment variable
- Set default value in config file
- Reference in applicable modules

---

## Operational Considerations

### Logging
Application logs provide visibility into:
- Request processing (via controller logging)
- Service execution (via service logging)
- Database operations (via executor logging)
- Error conditions (via middleware error handler)
- Performance metrics (execution time tracking)

Log levels available:
- **INFO**: Important application events
- **ERROR**: Error conditions and exceptions  
- **DEBUG**: Detailed execution information
- **WARN**: Warning conditions

### Monitoring
Application health can be monitored through:
- Health check endpoint: GET `/health`
- Application console logs
- Database execution logs (in ExecutionLogs table)
- Error monitoring via middleware
- Execution performance metrics

### Error Handling
Errors are handled at multiple levels:
- **HTTP Layer** (middleware): 404 and unhandled exceptions
- **Controller Layer**: Request validation errors
- **Service Layer**: Business logic errors
- **Database Layer**: Query execution errors

All errors return standardized response format:
```json
{
  "status": false,
  "message": "Error description",
  "data": null
}
```

### Maintenance
Regular maintenance includes:
- Monitoring application logs
- Checking database connectivity
- Verifying stored procedure execution
- Managing dependencies updates
- Monitoring error rates
- Database backup and cleanup
- Performance analysis
- Security updates

### Performance Optimization
Improve application performance by:
- Connection pooling (configured in index.js)
- Query optimization
- Result caching (future enhancement)
- Load testing before deployment
- Database indexing
- Log rotation strategy
- Memory usage monitoring

### Production Checklist

Before deploying to production:
- [ ] Set NODE_ENV=production
- [ ] Disable debug logging
- [ ] Set strong database passwords
- [ ] Configure CORS appropriately
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Test all endpoints
- [ ] Load test the application

