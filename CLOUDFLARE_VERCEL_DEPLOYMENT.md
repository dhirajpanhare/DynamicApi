# Deploying Dynamic API & Frontend on Cloudflare + Vercel (Free Tier)

Complete step-by-step guide to deploy all 7 backend APIs on Cloudflare and the React frontend on Vercel—completely free.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Cloudflare Setup](#cloudflare-setup)
3. [Database Setup (Free Options)](#database-setup-free-options)
4. [Backend Deployment Strategy](#backend-deployment-strategy)
5. [Deploying to Cloudflare](#deploying-to-cloudflare)
   - [Express APIs (MongoDB, MSSQL, MySQL)](#express-apis-mongodb-mssql-mysql)
   - [Django APIs (MSSQL, MySQL)](#django-apis-mssql-mysql)
   - [DotNet APIs (MSSQL, MySQL)](#dotnet-apis-mssql-mysql)
6. [Frontend Deployment on Vercel](#frontend-deployment-on-vercel)
7. [Environment Variables Configuration](#environment-variables-configuration)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts (All Free)
- ✅ **Cloudflare Account** (free tier)
  - Sign up at https://dash.cloudflare.com/sign-up
  - Includes: Workers (free), R2 Storage (50GB free), Email routing
  
- ✅ **Vercel Account** (free tier)
  - Sign up at https://vercel.com/signup
  - Includes: Unlimited projects, serverless functions

- ✅ **GitHub Account** (free tier - required for deployment automation)
  - Sign up at https://github.com/signup
  - Your repos will be pushed here for auto-deployment

### Development Tools
- Node.js 18+ (for Express and Frontend build)
- Python 3.8+ (for Django)
- .NET 6 or 7 SDK (for DotNet)
- Git installed locally
- Command-line tools: curl, npm/pip/dotnet

---

## Cloudflare Setup

### Step 1: Create Cloudflare Account
```bash
# 1. Go to https://dash.cloudflare.com/sign-up
# 2. Create account with email
# 3. Verify email
# 4. Set up free plan (no credit card needed)
```

### Step 2: Install Wrangler CLI (Cloudflare's Deployment Tool)
```bash
npm install -g wrangler

# Verify installation
wrangler --version

# Login to Cloudflare
wrangler login
# Opens browser to authorize, then redirects back
```

### Step 3: Create Cloudflare Workers Namespace
```bash
# Workers are serverless functions on Cloudflare's edge network
# Free tier: 100,000 requests/day

# This will be done per project during deployment
# Wrangler will create the namespace automatically
```

---

## Database Setup (Free Options)

### Option A: MongoDB Atlas (Recommended for Express)
**Free: 512MB storage, perfect for API testing**

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up with email or GitHub

2. **Create Free Cluster**
   - Click "Create" → Select "Shared" (free tier)
   - Choose region: US East (lowest latency)
   - Create cluster (takes ~5 minutes)

3. **Configure Network Access**
   - Go to "Network Access" tab
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for free tier

4. **Create Database User**
   - Go to "Database Access" tab
   - Click "Add Database User"
   - Username: `admin`
   - Auto-generated password (save this!)
   - Built-in role: `readWriteAnyDatabase`

5. **Get Connection String**
   - Click "Connect" on cluster
   - Choose "Drivers"
   - Select Node.js 4.x or later
   - Copy connection string:
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your saved password
   - Add database name: `/dynamicapi_prod` → `...dynamicapi_prod?retryWrites...`

### Option B: PlanetScale MySQL (Free 5GB)
**Good for DotNet & Django with MySQL**

1. **Create Account**
   - Go to https://planetscale.com
   - Sign up with GitHub (faster)

2. **Create Database**
   - Dashboard → "Create new database"
   - Name: `dynamicapi_db`
   - Region: US East (Virginia)
   - Click "Create database"

3. **Get Connection Details**
   - Once created, click the database
   - Click "Connect"
   - Select "Password" authentication
   - Click "New password" → name it "prod"
   - Copy credentials:
     ```
     Host: [host].ap-southeast.psdb.cloud
     User: [username]
     Password: [password]
     Database: dynamicapi_db
     Port: 3306
     ```

4. **Create Tables**
   - In PlanetScale dashboard, click "Console"
   - Run your schema SQL file or use Django/EF migrations

### Option C: Azure SQL Database (14 days free trial)
**For MSSQL backends requiring MSSQL specifically**

1. Create Azure account (requires credit card for trial, but no charges)
2. Create SQL Database with free tier (if available in your region)
3. Or use local MSSQL + Cloudflare Workers for API proxy (see Express option)

**For production free MSSQL, use Option A/B instead.**

---

## Backend Deployment Strategy

### Why Cloudflare Workers?
- **Free tier**: 100,000 requests/day, very generous
- **Zero cold start**: Requests execute instantly
- **Global distribution**: Deployed to 250+ data centers
- **No server management**: No uptime concerns

### Architecture Pattern

```
┌─────────────────────────────────────────┐
│          Cloudflare Workers             │
│  (Node.js runtime environment)          │
│                                         │
│  ┌─── Express API ──────────────────┐  │
│  │ GET /api/v1.0/DynamicApi/Health │  │
│  │ POST /api/v1.0/DynamicApi/Execute│  │
│  │ (handles requests, routes to DB) │  │
│  └──────────────────────────────────┘  │
└──────────────────────────────────────────┘
           ↓ connects to
      ┌─────────────────┐
      │  MongoDB Atlas  │ (or PlanetScale MySQL)
      │   (free tier)   │
      └─────────────────┘
```

---

## Deploying to Cloudflare

### Express APIs (MongoDB, MSSQL, MySQL)

#### For Express-MongoDB to Cloudflare

**Step 1: Modify Express App for Cloudflare Workers**

Navigate to `DynamicApi-Express-MongoDB/`:

```bash
cd DynamicApi-Express-MongoDB
```

Create/Update `wrangler.toml` (Cloudflare configuration):

```toml
name = "dynamic-api-mongodb"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"  # Get from Cloudflare dashboard
workers_dev = true
main = "server.js"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "api.dynamicapi.workers.dev/*", zone_name = "example.com" }
]

[build]
command = "npm install && npm run build"
cwd = "."

[env.production.vars]
NODE_ENV = "production"
MONGODB_URI = "mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/dynamicapi_prod?retryWrites=true&w=majority"
JWT_SECRET = "your-secure-secret-key-here"
OTP_EMAIL_FROM = "your-email@gmail.com"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = "587"
SMTP_USER = "your-email@gmail.com"
SMTP_PASSWORD = "your-app-password"
```

**Step 2: Wrap Express App for Cloudflare Workers**

Create `worker.js` in project root:

```javascript
import app from './src/index.js';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const response = await app(request);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  },
};
```

**Step 3: Update `package.json` for Cloudflare**

Add build script:
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "node -e \"console.log('Building...')\""
  }
}
```

**Step 4: Deploy to Cloudflare**

```bash
# Install dependencies
npm install

# Deploy to Cloudflare
wrangler deploy

# Output will show:
# ✓ Uploaded dynamic-api-mongodb
# ✓ Published dynamic-api-mongodb to https://dynamic-api-mongodb.YOUR_SUBDOMAIN.workers.dev/
```

Save the URL provided.

---

#### For Express-MSSQL to Cloudflare

**Step 1: Modify for Cloudflare**

Navigate to `DynamicApi-Express-MSSQL/`:

```bash
cd DynamicApi-Express-MSSQL
```

Create `wrangler.toml`:

```toml
name = "dynamic-api-mssql"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true
main = "server.js"
compatibility_date = "2024-01-01"

[env.production.vars]
NODE_ENV = "production"
MSSQL_SERVER = "your-sql-server.database.windows.net"
MSSQL_DATABASE = "dynamicapi_db"
MSSQL_USER = "admin@your-sql-server"
MSSQL_PASSWORD = "YourSecurePassword123!"
MSSQL_ENCRYPT = "true"
MSSQL_TRUST_SERVER_CERTIFICATE = "false"
JWT_SECRET = "your-secure-secret-key-here"
```

**Step 2: Install mssql package**

```bash
npm install mssql
npm install wrangler --save-dev
```

**Step 3: Create connection pool (critical for Cloudflare)**

Modify `src/index.js` to use connection pooling:

```javascript
import sql from 'mssql';

let pool = null;

async function getConnection() {
  if (!pool || !pool.connected) {
    const config = {
      server: process.env.MSSQL_SERVER,
      database: process.env.MSSQL_DATABASE,
      authentication: {
        type: 'default',
        options: {
          userName: process.env.MSSQL_USER,
          password: process.env.MSSQL_PASSWORD,
        },
      },
      options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== 'false',
        requestTimeout: 5000,
      },
    };
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
}

export default {
  async fetch(request, env, ctx) {
    const conn = await getConnection();
    // Route requests...
  },
};
```

**Step 4: Deploy**

```bash
wrangler deploy
```

---

#### For Express-MySQL to Cloudflare

Navigate to `DynamicApi-Express-MySQL/`:

```bash
cd DynamicApi-Express-MySQL
```

Create `wrangler.toml`:

```toml
name = "dynamic-api-mysql"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true
main = "server.js"
compatibility_date = "2024-01-01"

[env.production.vars]
NODE_ENV = "production"
MYSQL_HOST = "xxxxx.ap-southeast.psdb.cloud"
MYSQL_USER = "your_username"
MYSQL_PASSWORD = "your_password"
MYSQL_DATABASE = "dynamicapi_db"
MYSQL_PORT = "3306"
JWT_SECRET = "your-secure-secret-key-here"
```

Install mysql2:
```bash
npm install mysql2
npm install wrangler --save-dev
```

Create connection pool in `src/index.js`:

```javascript
import mysql from 'mysql2/promise';

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}
```

Deploy:
```bash
wrangler deploy
```

---

### Django APIs (MSSQL, MySQL)

**Note**: Django is more difficult to deploy on Cloudflare Workers due to its synchronous nature. Multiple free options below:

#### Option A: Google Cloud Run (BEST - Completely Free ⭐)
**Free: 2 million requests/month, 360,000 vCPU-seconds/month, 1GB RAM**

1. **Create Google Cloud Account**
   ```bash
   # https://cloud.google.com/run
   # Click "Get started free" (no credit card for 90 days)
   ```

2. **Install Google Cloud SDK**
   ```bash
   # Windows: Download installer from https://cloud.google.com/sdk/docs/install
   # Or: choco install google-cloud-sdk
   
   gcloud init
   gcloud auth login
   ```

3. **Create Dockerfile**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   ENV PORT=8080
   CMD ["gunicorn", "--bind", "0.0.0.0:8080", "config.wsgi:application"]
   ```

4. **Deploy to Cloud Run**
   ```bash
   # Navigate to Django project
   cd DynamicApi-Django-MYSQL
   
   # Build and deploy
   gcloud run deploy dynamic-api-django \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="MYSQL_HOST=your-host,MYSQL_USER=your-user,MYSQL_PASSWORD=your-pass,MYSQL_DATABASE=your-db"
   
   # Output: Service deployed at: https://dynamic-api-django-xxxxx.run.app
   ```

5. **Update Environment Variables**
   ```bash
   # In Cloud Run console or via CLI:
   gcloud run deploy dynamic-api-django \
     --update-env-vars MYSQL_HOST=xxxxx,DEBUG=False,ALLOWED_HOSTS=dynamic-api-django-xxxxx.run.app
   ```

**Pros**: 
- Completely free tier doesn't expire
- Good for production use
- Auto-scaling included
- 2M requests/month is substantial

**Cons**: 
- Takes ~1 minute to start up after idle (cold start)
- Requires Google Cloud SDK setup

---

#### Option B: Fly.io (Free Tier - Good for Testing)
**Free: 3 shared-cpu-1x VMs, 3GB storage total**

1. **Create Fly Account**
   ```bash
   # https://fly.io
   # Sign up (no credit card required)
   ```

2. **Install Fly CLI**
   ```bash
   # Windows: choco install flyctl
   # Or: Download from https://fly.io/docs/hands-on/install-flyctl/
   
   flyctl auth login
   ```

3. **Create `fly.toml`** in project root:
   ```toml
   app = "dynamic-api-django"
   primary_region = "ord"
   
   [build]
   dockerfile = "Dockerfile"
   
   [env]
   DJANGO_SETTINGS_MODULE = "config.settings"
   PORT = "8080"
   
   [http_service]
   internal_port = 8080
   force_https = true
   auto_stop_machines = true
   auto_start_machines = true
   ```

4. **Deploy**
   ```bash
   flyctl deploy
   # Output: https://dynamic-api-django.fly.dev
   ```

**Pros**:
- Good free tier
- Fast deployment
- Built-in HTTPS
- Auto-sleep when idle

**Cons**:
- Limited to 3 free machines
- Each app needs separate VM
- Would need 2 apps (MSSQL + MySQL) = uses up free quota

---

#### Option C: Railway.app (Free Trial)
**Free: $5 credit/month = ~5-10 hours of compute**

1. **Create Railway Account**
   ```bash
   # https://railway.app
   # Sign up with GitHub
   ```

2. **Create New Project**
   - Dashboard → New Project → Deploy from GitHub
   - Select your repo
   - Select `DynamicApi-Django-MYSQL` folder

3. **Add Services**
   - Add MySQL service (free tier)
   - Configure environment variables
   - Deploy

**Pros**:
- Simple deployment
- Integrated database

**Cons**:
- Free tier only $5/month = limited usage
- Would need separate credits for each app

---

#### Option D: PythonAnywhere (Free - Django Specific)
**Free: 512MB DB, shared CPU, one Web app**

1. **Create Account**
   ```bash
   # https://www.pythonanywhere.com
   # Sign up free
   ```

2. **Upload Code**
   - Go to "Web" tab
   - Create new Django web app
   - Upload code via Git or ZIP
   - Configure settings

3. **Configure Database**
   - PythonAnywhere MySQL included in free tier
   - Run migrations

**Pros**:
- Built specifically for Django
- Includes MySQL database
- Easy setup

**Cons**:
- Very limited resources (shared CPU)
- Can't use custom MSSQL
- Slow for production

---

#### Option E: Render.com (Free Tier - Original Option)
**Free: 750 hours/month = ~1 active web app continuously**

```bash
# 1. Push repo to GitHub
# 2. Go to https://render.com
# 3. New → Web Service
# 4. Connect GitHub repo
# 5. Environment: Python 3.11
# 6. Build command: pip install -r requirements.txt
# 7. Start command: gunicorn config.wsgi:application
# 8. Add environment variables
# 9. Deploy
```

**Pros**:
- Straightforward setup
- Good for testing

**Cons**:
- Spins down after 15 minutes of inactivity (free tier)
- 750 hours/month = can run ONE app continuously OR multiple apps part-time

---

### DotNet APIs (MSSQL, MySQL)

DotNet has fewer free deployment options. Best alternatives:

#### Option A: Google Cloud Run (BEST - Completely Free ⭐)
**Free: 2 million requests/month, 360,000 vCPU-seconds/month**

1. **Create `Dockerfile`**
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   WORKDIR /src
   COPY ["DynamicApi.csproj", "./"]
   RUN dotnet restore "DynamicApi.csproj"
   COPY . .
   RUN dotnet build "DynamicApi.csproj" -c Release -o /app/build
   
   FROM mcr.microsoft.com/dotnet/aspnet:8.0
   WORKDIR /app
   COPY --from=build /app/build .
   EXPOSE 8080
   ENV ASPNETCORE_URLS=http://+:8080
   ENTRYPOINT ["dotnet", "DynamicApi.dll"]
   ```

2. **Deploy**
   ```bash
   cd DynamicApi-Dotnet-MYSQL
   
   gcloud run deploy dynamic-api-dotnet \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 512Mi \
     --cpu 1 \
     --set-env-vars="MYSQL_HOST=your-host,MYSQL_USER=user,MYSQL_PASSWORD=pass"
   
   # Output: https://dynamic-api-dotnet-xxxxx.run.app
   ```

**Pros**:
- Native .NET support
- Good free limits
- Production-ready

**Cons**:
- Cold start after idle (~1 minute)

---

#### Option B: Fly.io (Free Tier)
```bash
# Create fly.toml
flyctl launch

# Create Dockerfile (see above)
flyctl deploy
```

**Pros**: 
- Good free tier
- Fast deployment

**Cons**:
- Limited free machines

---

#### Option C: Azure Container Instances (Free Trial)
**Free: $200 credit (use in 30 days)**

```bash
# Create Azure account (requires credit card for trial)
# Completely free for 30 days worth of usage

az containerapp up --name dynamic-api-dotnet \
  --resource-group my-group \
  --image-uri your-image \
  --environment myenv
```

---

### Comparison Summary

| Platform | Django | DotNet | Free Tier | Cold Start | Best For |
|----------|--------|--------|-----------|-----------|----------|
| **Google Cloud Run** | ✅✅ | ✅✅ | 2M req/mo | ~1 min | **BEST OPTION** |
| **Fly.io** | ✅ | ✅ | 3 shared VMs | Fast | Testing/Demo |
| **Railway** | ✅ | ✅ | $5/mo credit | Fast | Small projects |
| **PythonAnywhere** | ✅✅ | ❌ | Limited | None | Django-only |
| **Render.com** | ✅ | ✅ | 750 hrs | None | Simple apps |
| **Azure Trial** | ✅ | ✅✅ | $200/30d | Instant | Full features |

---

### Recommendation

**For Completely Free Indefinitely:**
- **Google Cloud Run** (Both Django & DotNet) ← **BEST**
- **Fly.io** (Both, but limited free quota)
- **Railway** (Both, but quota limited)

**For Django Only:**
- **Google Cloud Run** (Better limits)
- **PythonAnywhere** (Simpler, but slower)

**For DotNet Only:**
- **Google Cloud Run** (Best support)
- **Azure Trial** (If you want full features for 30 days)

#### Option B: Use Vercel Python Support (Next.js API Routes)
- Convert Django endpoints to Vercel serverless functions
- Requires code refactoring

---

## Cost Summary (Total: $0/month Forever)

| Service | Free Tier | Limit | Notes |
|---------|-----------|-------|-------|
| **Cloudflare Workers** | 100K req/day | 1M req/month | All 7 APIs |
| **Vercel Frontend** | Unlimited | Bandwidth capped | React frontend |
| **Google Cloud Run Django** | 2M req/month | 360K vCPU-sec/mo | **BEST for Django** |
| **Google Cloud Run DotNet** | 2M req/month | 360K vCPU-sec/mo | **BEST for DotNet** |
| **MongoDB Atlas** | 512MB | 3 clusters | Testing |
| **PlanetScale MySQL** | 5GB | 1M row reads/day | Production |
| **GitHub** | Unlimited | Unlimited | Repos |
| **Total Monthly Cost** | **$0** | Forever | No charges ever |

---

## Quick Deployment Decision Tree

```
Do you want Django/DotNet COMPLETELY FREE?
│
├─→ YES (Google Cloud Run)
│   ├─→ Django: gcloud run deploy (2M req/month free forever)
│   └─→ DotNet: gcloud run deploy (2M req/month free forever)
│
├─→ YES (Other free options)
│   ├─→ Fly.io (3 free machines - good for testing)
│   ├─→ Railway ($5/mo credit effective free)
│   ├─→ PythonAnywhere (Django only, limited)
│   └─→ Render.com (750 hrs/mo - partial free)
│
└─→ YES but willing to use trial
    └─→ Azure (DotNet) - $200 credit for 30 days
```

---

## Frontend Deployment on Vercel

### Step 1: Connect GitHub Repository

```bash
# Ensure your repo is on GitHub
# 1. Go to https://github.com/new
# 2. Create repo named "backend"
# 3. In your local backup:

git remote add origin https://github.com/YOUR_USERNAME/backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Import Project**
   - Click "New Project"
   - Connect your GitHub account
   - Select "backend" repo
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: `Frontend/React-Frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: `dist`

4. **Set Environment Variables**
   ```
   VITE_API_URL = https://dynamic-api-mongodb.YOUR_SUBDOMAIN.workers.dev
   VITE_API_BACKEND = mongodb
   ```

5. **Click "Deploy"**
   - Vercel builds and deploys automatically
   - URL: `https://YOUR-PROJECT-NAME.vercel.app`

### Step 3: Enable Auto-Deployments

Vercel automatically deploys on every push to `main` branch:

```bash
# Make changes locally
git add .
git commit -m "Fix text overflow in Dashboard"
git push origin main

# Vercel automatically rebuilds and redeploys!
# Check status: https://vercel.com/dashboard
```

### Step 4: Configure Custom Domain (Optional)

```bash
# In Vercel:
# 1. Project Settings → Domains
# 2. Add your custom domain (requires domain ownership)
# 3. Update DNS records pointing to Vercel
# 4. Vercel auto-generates SSL certificate
```

---

## Environment Variables Configuration

### Cloudflare Workers Environment Variables

Store sensitive data using Cloudflare's secret management:

```bash
# For Express-MongoDB:
wrangler secret put MONGODB_URI
# Paste: mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/dynamicapi_prod?retryWrites=true&w=majority

wrangler secret put JWT_SECRET
# Paste: your-secure-random-secret-here

wrangler secret put SMTP_PASSWORD
# Paste: your-gmail-app-password
```

View secrets:
```bash
wrangler secret list
```

### Vercel Environment Variables

**Frontend (.env.production)**

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://dynamic-api-mongodb.workers.dev
   VITE_API_BACKEND=mongodb
   VITE_OTP_EXPIRY=600
   VITE_MAX_OTP_ATTEMPTS=5
   ```

3. Redeploy: Go to Deployments → Latest → Redeploy

---

## Testing & Verification

### Step 1: Test Individual APIs

**Express-MongoDB Health Check:**
```bash
curl https://dynamic-api-mongodb.workers.dev/api/v1.0/DynamicApi/Health
# Expected: { "status": "healthy", "timestamp": "2024-04-09T..." }
```

**Execute Query:**
```bash
curl -X POST https://dynamic-api-mongodb.workers.dev/api/v1.0/DynamicApi/Execute \
  -H "Content-Type: application/json" \
  -d '{
    "procedureName": "GetAllProducts",
    "parameters": [],
    "tableName": "Products"
  }'
```

### Step 2: Test Frontend on Vercel

```bash
# In browser:
https://YOUR-PROJECT-NAME.vercel.app

# Test flow:
# 1. Enter email
# 2. Receive OTP
# 3. Verify OTP
# 4. Select backend (should be pre-selected)
# 5. Execute test API call
# 6. Verify results show in Dashboard
```

### Step 3: End-to-End Test

1. **Login on Vercel Front-end**
   - Email: test@example.com
   
2. **Verify OTP Email**
   - Check spam folder if not received
   
3. **Execute Sample Query**
   - Go to Dashboard
   - Select Framework (MongoDB, MSSQL, MySQL)
   - Execute stored procedure
   - Verify response in Analytics

4. **Check Data Isolation**
   - Login with different email
   - Verify previous user's data NOT visible
   - Create new query
   - Switch back to first user
   - Verify first user's data restored

### Step 4: Monitor Logs

**Cloudflare Worker Logs:**
```bash
wrangler tail
# Shows real-time requests and errors
```

**Vercel Deployment Logs:**
- Dashboard → Deployments → Click deployment → Logs tab

---

## Troubleshooting

### Issue 1: "Module not found" on Cloudflare Workers

**Cause**: Missing npm modules in Workers runtime

**Solution**:
```bash
wrangler deploy --minify
# Bundles all dependencies into worker
```

### Issue 2: Database Connection Timeout

**Cause**: Cloudflare IP not whitelisted in database

**Solution**:
- MongoDB Atlas: Network Access → Add 0.0.0.0/0 (all IPs)
- PlanetScale: Automatically allows Cloudflare

### Issue 3: CORS Errors on Frontend

**Cause**: API not returning CORS headers

**Solution**: In your API, add:
```javascript
// Express
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.send(200);
  next();
});
```

### Issue 4: OTP Emails Not Sending

**Cause**: SMTP credentials incorrect or email marked as spam

**Solution**:
```bash
# Verify credentials in wrangler.toml:
wrangler secret list

# For Gmail, use app password (not regular password):
# https://myaccount.google.com/apppasswords
```

### Issue 5: Vercel Deployment Failed

**Check logs**:
1. Go to Vercel Dashboard
2. Deployments tab
3. Click failed deployment
4. Expand error message
5. Common causes:
   - Missing environment variables
   - Wrong root directory
   - Node version incompatibility

**Solution**:
```bash
# Rebuild locally, commit, push
npm run build
git add .
git commit -m "Fix build issue"
git push origin main
```

---

## Quick Reference: Final URLs

Once deployed:

| Component | URL | Type |
|-----------|-----|------|
| Frontend | `https://YOUR-PROJECT-NAME.vercel.app` | Production |
| Express-MongoDB API | `https://dynamic-api-mongodb.workers.dev` | Cloudflare |
| Express-MSSQL API | `https://dynamic-api-mssql.workers.dev` | Cloudflare |
| Express-MySQL API | `https://dynamic-api-mysql.workers.dev` | Cloudflare |
| Django APIs | Deploy on Render.com | (Separate links) |
| DotNet APIs | Deploy on Render.com | (Separate links) |

---



---

## Next Steps

1. **Create all accounts** (Cloudflare, Vercel, MongoDB/PlanetScale) — 10 min
2. **Configure databases** (MongoDB Atlas or PlanetScale) — 15 min
3. **Deploy Express APIs to Cloudflare** (3 APIs) — 30 min
4. **Deploy Django/DotNet to Render** (if needed) — 20 min
5. **Deploy Frontend to Vercel** — 5 min
6. **Test end-to-end** — 10 min

**Total Time: ~90 minutes for complete production setup**

---

## Support & Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **PlanetScale Docs**: https://planetscale.com/docs
- **Render Docs**: https://render.com/docs

Good luck! 🚀
