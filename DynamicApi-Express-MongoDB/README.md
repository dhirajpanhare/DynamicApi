# DynamicApi-Express-MongoDB - Node.js + MongoDB Implementation

## Overview
This is a Node.js Express implementation of the Dynamic API with MongoDB for flexible data storage.

## Technologies Used
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT
- **Documentation**: Swagger
- **Containerization**: Docker

## Project Structure
```
DynamicApi-Express-MongoDB/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   └── index.js        # Entry point
├── docker/             # Docker configuration
├── package.json        # Dependencies
└── .env               # Environment variables
```

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.0+
- Docker (optional)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with MongoDB connection
4. Start server: `npm run dev`

### Docker Setup
```bash
docker-compose up -d
```

## API Endpoints
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
