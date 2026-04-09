# Frontend Setup & Configuration Guide

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Port Configuration

The frontend is configured to work with all 7 backend implementations. Each backend runs on a different port to avoid conflicts:

### .NET Backends
- **MSSQL**: Port **5000** (`http://localhost:5000`)
- **MySQL**: Port **5001** (`http://localhost:5001`)

### Django Backends
- **MSSQL**: Port **8000** (`http://localhost:8000`)
  - Start with: `python run.py` (from DynamicApi-Django-MSSQL directory)
- **MySQL**: Port **8001** (`http://localhost:8001`)
  - Start with: `set DJANGO_PORT=8001 && python run.py` (from DynamicApi-Django-MySQL directory)

### Express Backends
- **MongoDB**: Port **3001** (`http://localhost:3001`)
  - Configured via `.env` file
- **MSSQL**: Port **3002** (`http://localhost:3002`)
  - Configured via `.env` file
- **MySQL**: Port **3003** (`http://localhost:3003`)
  - Configured via `.env` file

## Environment Configuration

### Development (.env.local)

```env
# Select default API when app starts
VITE_API_TYPE=dotnet-mssql

# Frontend URL (for CORS, redirects)
VITE_FRONTEND_URL=http://localhost:5173

# Backend endpoints
VITE_DOTNET_MSSQL_URL=http://localhost:5000
VITE_DOTNET_MYSQL_URL=http://localhost:5001
VITE_DJANGO_MSSQL_URL=http://localhost:8000
VITE_DJANGO_MYSQL_URL=http://localhost:8001
VITE_EXPRESS_MONGODB_URL=http://localhost:3001
VITE_EXPRESS_MSSQL_URL=http://localhost:3002
VITE_EXPRESS_MYSQL_URL=http://localhost:3003

# Debug mode (disable in production!)
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Production (.env.production)

```env
# Select default API when app starts
VITE_API_TYPE=dotnet-mssql

# Frontend URL (your deployed domain)
VITE_FRONTEND_URL=https://yourdomain.com

# Backend endpoints (use your production URLs)
VITE_DOTNET_MSSQL_URL=https://api1.yourdomain.com
VITE_DOTNET_MYSQL_URL=https://api2.yourdomain.com
VITE_DJANGO_MSSQL_URL=https://api3.yourdomain.com
VITE_DJANGO_MYSQL_URL=https://api4.yourdomain.com
VITE_EXPRESS_MONGODB_URL=https://api5.yourdomain.com
VITE_EXPRESS_MSSQL_URL=https://api6.yourdomain.com
VITE_EXPRESS_MYSQL_URL=https://api7.yourdomain.com

# Disable debug in production!
VITE_DEBUG=false
VITE_LOG_LEVEL=warn
VITE_HTTPS_ONLY=true
```

## Switching Backend APIs

### Option 1: Via UI
1. Click the "API Selector" button in the sidebar
2. Choose from the list of available backends
3. The selection is saved in localStorage

### Option 2: Via Environment Variable
1. Edit `.env.local` and change `VITE_API_TYPE`
2. Restart the dev server

## Production Deployment

### Build Steps
```bash
# Install dependencies
npm install

# Build optimized production bundle
npm run build
# Output: dist/ directory ready for deployment

# Preview production build locally (optional)
npm run preview
```

### Deployment to Server
```bash
# Copy dist/ directory to your web server
cp -r dist/* /path/to/web/root/

# Configure web server (Nginx example)
# Serve dist/ as root, all 404s redirect to index.html
location / {
    try_files $uri /index.html;
}
```

### Environment Setup
1. Create `.env.production` in the root directory
2. Set all API endpoints to your production URLs
3. Set `VITE_DEBUG=false` and `VITE_HTTPS_ONLY=true`
4. Build and deploy: `npm run build`

## Features

### enabled by Default:
- ✅ **Multi-API Selector**: Choose between 7 different backend implementations
- ✅ **Health Checks**: Automatically check if backends are online
- ✅ **Analytics Dashboard**: View API metrics and performance data
- ✅ **API History**: Track all API calls made during the session
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices

### Customizable via Environment:
```env
VITE_FEATURE_HEALTH_CHECK=true
VITE_FEATURE_MULTI_API_SELECTOR=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_API_HISTORY=true
```

## Troubleshooting

### "Unable to check health for all APIs"
**Solution:**
1. Ensure all backend services are running on correct ports
2. Check that `VITE_*_URL` environment variables match backend URLs
3. Verify CORS is enabled on backends
4. Check browser console for specific error messages

### "API requests failing with Network Error"
**Solutions:**
1. Verify backend is running: `curl http://localhost:PORT/health`
2. Check CORS configuration on backend
3. Ensure firewall isn't blocking ports
4. Check browser console for actual error

### Port Already in Use
**For .NET:**
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F
```

**For Python/Django:**
```bash
# Kill Django server and restart with different port
# From DynamicApi-Django-MySQL directory:
set DJANGO_PORT=8001 && python run.py
```

**For Node/Express:**
```bash
# Express respects PORT environment variable
# Set before starting:
set PORT=3001 && npm start

# Or modified in .env file
# PORT=3001
```

## Security Best Practices

1. **Never commit `.env.local` to git** - It contains sensitive configuration
2. **Use `.env.production` for production** - Different from development
3. **Enable `VITE_HTTPS_ONLY=true`** in production - Enforces secure connections
4. **Set `VITE_DEBUG=false`** in production - Reduces exposed information
5. **Rotate JWT secrets regularly** across environments
6. **Update VITE_ALLOWED_ORIGINS** to only trusted domains

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_TYPE` | string | `dotnet-mssql` | Default API backend to load |
| `VITE_FRONTEND_URL` | string | `http://localhost:5173` | Frontend application URL |
| `VITE_API_TIMEOUT` | number | `30000` | API request timeout in ms |
| `VITE_DEBUG` | boolean | `true` | Enable debug logging |
| `VITE_LOG_LEVEL` | string | `debug` | Logging level: error,warn,info,debug |
| `VITE_HTTPS_ONLY` | boolean | `false` | Enforce HTTPS only |
| `VITE_FEATURE_HEALTH_CHECK` | boolean | `true` | Enable health checks |
| `VITE_FEATURE_MULTI_API_SELECTOR` | boolean | `true` | Enable API selector |
| `VITE_FEATURE_ANALYTICS` | boolean | `true` | Enable analytics |
| `VITE_FEATURE_API_HISTORY` | boolean | `true` | Enable call history |

## Support & Documentation

- **Frontend README**: See [README.md](./README.md)
- **API Documentation**: Available at `/api/docs` on each backend
- **Quick Start**: See [QUICK_START.md](./QUICK_START.md) for first-time setup
- **Responsive Design**: See [RESPONSIVE_DESIGN_GUIDE.md](./RESPONSIVE_DESIGN_GUIDE.md)
