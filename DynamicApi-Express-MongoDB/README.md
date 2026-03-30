# MongoDB Dynamic API - Express.js

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start MongoDB
mongod

# 4. Start the server
npm run dev

# 5. Access Swagger UI
open http://localhost:3000/api/docs
```

---

## 📋 Overview

🚀 **Express.js + MongoDB** universal operations API  
📚 Based on **DynamicApi-Django** architecture  
✨ Execute dynamic CRUD, aggregations, and transactions on MongoDB collections  
⚡ Full parameter validation and security  

---

## ✨ Key Features

✅ **CRUD Operations** - Create, Read, Update, Delete with flexible filtering  
✅ **Aggregation Pipelines** - Execute complex MongoDB aggregations  
✅ **Bulk Operations** - Batch insert/update/delete  
✅ **Multi-Document Transactions** - ACID transactions across collections  
✅ **Collection Discovery** - Automatic schema detection  
✅ **Comprehensive Logging** - Full audit trail of all operations  
✅ **Swagger Documentation** - Auto-generated API docs  
✅ **Backward Compatible** - Legacy string-delimited parameter format supported  

---

## 🔌 Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1.0/DynamicApi/Operations` | Execute operation (JSON format) |
| `POST` | `/api/v1.0/DynamicApi/DynamicApiExecute` | Execute operation (legacy format) |
| `GET` | `/api/v1.0/DynamicApi/Collections` | List all collections |
| `GET` | `/api/v1.0/DynamicApi/Collections/:name/Schema` | Get collection schema |
| `POST` | `/api/v1.0/DynamicApi/ValidateOperation` | Validate operation |
| `GET` | `/health` | Health check |
| `GET` | `/api/docs` | Swagger UI |

---

## 🎯 Operation Types

- **create** - Insert one or multiple documents
- **read** - Query documents with filtering, sorting, pagination
- **update** - Update one or multiple documents
- **delete** - Delete one or multiple documents
- **aggregate** - Execute aggregation pipeline
- **bulk** - Batch write operations
- **transaction** - Multi-document transaction

---

## 📝 Example: Create User

**Request**:
```json
POST /api/v1.0/DynamicApi/Operations

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

**Legacy String-Delimited Format** (for `/api/v1.0/DynamicApi/DynamicApiExecute`):
```json
POST /api/v1.0/DynamicApi/DynamicApiExecute

{
  "operationType": "create",
  "collectionName": "users",
  "parameters": "name=John Doe|email=john@example.com|age=30|city=New York",
  "fieldDelimiter": "|",
  "keyValueDelimiter": "="
}
```

This format allows you to send parameters as a single string, using custom delimiters. The example above uses `|` to separate fields and `=` to separate keys and values. You can change these delimiters as needed.

Both formats are supported. Use the JSON format for modern clients and the string-delimited format for legacy compatibility or simple integrations.

**Response**:
```json
{
  "status": true,
  "message": "create operation completed successfully",
  "data": {
    "insertedCount": 1,
    "insertedId": "664a8f1c52e8c1a2b3c4d5e6",
    "document": {
      "_id": "664a8f1c52e8c1a2b3c4d5e6",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active"
    }
  }
}
```

---

## 📂 File Structure

```
DynamicApi-Express-MongoDB/
├── src/
│   ├── index.js                           # Main server file
│   ├── controllers/
│   │   └── dynamicApiController.js        # API request handlers
│   ├── services/
│   │   ├── dynamicApiService.js           # Service layer & parameter parsing
│   │   └── mongodbOperationExecutor.js    # MongoDB operations executor
│   ├── models/
│   │   └── operationLog.js                # Mongoose schema for logging
│   ├── routes/
│   │   └── apiRoutes.js                   # API route definitions
│   ├── middleware/
│   │   ├── errorHandler.js                # Error handling middleware
│   │   └── loggingMiddleware.js           # Request logging middleware
│   └── utils/
│       └── logger.js                      # Logging utility
├── logs/                                   # Application logs
├── package.json                            # Dependencies
├── .env.example                           # Environment template
├── README.md                              # This file
└── MONGODB_IMPLEMENTATION.md              # Comprehensive documentation
```

---

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/dynamicapi

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:8000
```

### CORS Origins

By default, the following origins are allowed:
- `http://localhost:3000`
- `http://localhost:5000`
- `http://localhost:8000`

To configure custom origins, update `CORS_ORIGINS` in `.env`:
```bash
CORS_ORIGINS=http://example.com,http://api.example.com,https://app.example.com
```

---

## 🔐 Security

✅ **Parameter Validation**
- Collection names: `^[a-zA-Z_][a-zA-Z0-9_-]*$`
- Parameter names: `^[a-zA-Z_@][a-zA-Z0-9_]*$`
- Parameter values: max 50KB each
- No duplicate parameters

✅ **MongoDB Injection Prevention**
- Mongoose schema validation
- Parameterized queries
- No dynamic collection names

✅ **Error Handling**
- Generic error messages to clients
- Detailed logs server-side only
- Unique error codes

✅ **Recommended Security Additions**
- API Key authentication
- JWT token-based authentication
- Rate limiting
- HTTPS/SSL enforcement
- Request/IP whitelisting
- Security headers (HSTS, CSP, X-Frame-Options)

---

## 📊 Logging

All operations are logged to `logs/` directory:
- **Format**: Daily files (`app-YYYY-MM-DD.log`)
- **Levels**: `INFO`, `ERROR`, `WARN`, `DEBUG`
- **Auto-Cleanup**: Logs older than 90 days are automatically deleted

**Logged Information**:
- Operation type and collection
- User email (if JWT available)
- Success/failure status
- Execution duration
- Result count
- Error codes
- IP address

---

## 🚀 Development

### Start with Hot Reload
```bash
npm run dev
```

### Production Start
```bash
npm start
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

---

## 🧪 Testing

### Using cURL

**Create Document**:
```bash
curl -X POST http://localhost:3000/api/v1.0/DynamicApi/Operations \
  -H "Content-Type: application/json" \
  -d '{
    "operationType": "create",
    "collectionName": "users",
    "parameters": {
      "documents": { "name": "John", "email": "john@ex.com" },
      "isMultiple": false
    }
  }'
```

**Query Documents**:
```bash
curl -X POST http://localhost:3000/api/v1.0/DynamicApi/Operations \
  -H "Content-Type: application/json" \
  -d '{
    "operationType": "read",
    "collectionName": "users",
    "parameters": {
      "filter": { "status": "active" },
      "skip": 0,
      "limit": 10
    }
  }'
```

### Using Swagger UI

Interactive API documentation at: `http://localhost:3000/api/docs`

Features:
- Live request/response examples
- Parameter descriptions
- Error codes and messages
- Try-it-out functionality

---

## 📚 Comprehensive Documentation

For full documentation including all operation types, examples, and advanced usage:
→ See [MONGODB_IMPLEMENTATION.md](./MONGODB_IMPLEMENTATION.md)

---

## 🆚 Comparison with SQL Versions

| Aspect | MongoDB | SQL (.NET/Django/Express) |
|--------|---------|--------------------------|
| **Database** | MongoDB (NoSQL) | MySQL (SQL) |
| **Operation** | Dynamic operations | Stored procedures |
| **Parameters** | JSON objects | String-delimited |
| **Query** | Aggregation pipelines | SQL queries |
| **Transactions** | Multi-document | Single procedure |
| **Schema** | Flexible | Fixed |

All implementations follow the same architecture pattern:
- **DynamicApi-dotnet-v1** - ASP.NET Core + MySQL
- **DynamicApi-express-v1** - Express.js + MySQL
- **DynamicApi-django-v1** - Django + MySQL
- **DynamicApi-Express-MongoDB** - Express.js + MongoDB (this)

---

## ❓ Troubleshooting

### MongoDB Connection Error
```
MongoDB connection error: connect ECONNREFUSED
```
- Verify MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env`
- Ensure connection string format

### Collection Not Found
- Verify collection exists in MongoDB
- Check spelling in requests
- Create collection if missing

### CORS Errors
- Update `CORS_ORIGINS` in `.env`
- Restart server: `npm run dev`

---

## 📦 Technologies

- **Framework**: Express.js 4.18+
- **Database**: MongoDB 4.0+
- **ODM**: Mongoose 7.6+
- **Documentation**: Swagger/OpenAPI
- **Logging**: Custom file-based logger
- **Runtime**: Node.js 14+

---

## 📄 License

MIT - See LICENSE file

---

## 📧 Support

For more information:
- 📚 See [MONGODB_IMPLEMENTATION.md](./MONGODB_IMPLEMENTATION.md)
- 📖 Access Swagger UI at `http://localhost:3000/api/docs`
- 📊 Check logs in `/logs` for operation history

**Version**: 2.0.0  
**Last Updated**: March 27, 2026  
**Reference Implementation**: DynamicApi-Django
- **POST** `/api/v1.0/DynamicApi/DynamicApiExecute` - Execute procedure
- **GET** `/api/v1.0/DynamicApi/GetEntities` - Get all entities
- **POST** `/api/v1.0/DynamicApi/CreateEntity` - Create entity

## Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/dynamicapi
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## Documentation
- API Documentation: `http://localhost:3000/api-docs`
- MongoDB Schema: See `src/models/` folder

## License
MIT
