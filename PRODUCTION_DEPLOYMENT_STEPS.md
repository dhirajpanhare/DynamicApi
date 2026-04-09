# Production Deployment Guide

Complete step-by-step guide for deploying the Dynamic API to production with all backends.

---

## Table of Contents
1. [Quick Start Checklist](#quick-start-checklist)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Express API Deployment (Cloudflare Workers)](#express-api-deployment-cloudflare-workers)
4. [Django API Deployment (Google Cloud Run)](#django-api-deployment-google-cloud-run)
5. [DotNet API Deployment (Google Cloud Run)](#dotnet-api-deployment-google-cloud-run)
6. [Environment Variables Setup](#environment-variables-setup)
7. [Testing Production Deployment](#testing-production-deployment)
8. [Monitoring & Logs](#monitoring--logs)

---

## Quick Start Checklist

- [ ] GitHub account with backend repo pushed
- [ ] Cloudflare account with Wrangler CLI installed
- [ ] Google Cloud Account with gcloud CLI
- [ ] Vercel account connected to GitHub
- [ ] MongoDB Atlas or PlanetScale database created
- [ ] Email service configured (Gmail, Mailgun, SendGrid)
- [ ] All environment variables prepared
- [ ] Domain/subdomain configured (optional)

---

## Frontend Deployment (Vercel)

### Step 1: Prepare GitHub Repository

```bash
# Navigate to project root
cd c:\Users\EIPLPC038\Documents\backend

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Production-ready Dynamic API"

# Create repo on GitHub (https://github.com/new)
# Name: backend

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend on Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com/signup
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your "backend" repository
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework: Vite
   Root Directory: Frontend/React-Frontend
   Build Command: npm run build
   Install Command: npm install
   Output Directory: dist
   ```

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add all variables from `.env.production`:
     ```
     VITE_EXPRESS_MONGODB_URL=https://dynamic-api-mongodb.YOUR_SUBDOMAIN.workers.dev
     VITE_EXPRESS_MSSQL_URL=https://dynamic-api-mssql.YOUR_SUBDOMAIN.workers.dev
     VITE_EXPRESS_MYSQL_URL=https://dynamic-api-mysql.YOUR_SUBDOMAIN.workers.dev
     VITE_DJANGO_MSSQL_URL=https://dynamic-api-django-mssql-PROJECT_ID.run.app
     VITE_DJANGO_MYSQL_URL=https://dynamic-api-django-mysql-PROJECT_ID.run.app
     VITE_DOTNET_MSSQL_URL=https://dynamic-api-dotnet-mssql-PROJECT_ID.run.app
     VITE_DOTNET_MYSQL_URL=https://dynamic-api-dotnet-mysql-PROJECT_ID.run.app
     VITE_API_TYPE=express-mongodb
     VITE_FRONTEND_URL=https://your-vercel-domain.vercel.app
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get deployment URL: `https://your-project-name.vercel.app`

### Step 3: Auto-Deployments

Vercel automatically redeploys on every push to `main`:

```bash
# Make changes locally
git add .
git commit -m "Update API configs"
git push origin main

# Automatic redeploy happens!
# View progress in Vercel Dashboard
```

---

## Express API Deployment (Cloudflare Workers)

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler

# Verify
wrangler --version

# Login to Cloudflare
wrangler login
# Opens browser, authorize, redirects back
```

### Step 2: Deploy Express-MongoDB

```bash
cd DynamicApi-Express-MongoDB

# Update wrangler.toml with your details:
# - account_id: From Cloudflare Dashboard → Account Settings → API Tokens
# - MONGODB_URI: From MongoDB Atlas connection string

# Test locally
wrangler dev

# Deploy to production
wrangler deploy

# Output: https://dynamic-api-mongodb.YOUR_SUBDOMAIN.workers.dev
```

Save this URL for later.

### Step 3: Deploy Express-MSSQL

```bash
cd ../DynamicApi-Express-MSSQL

# Update wrangler.toml MSSQL credentials

wrangler deploy

# Output: https://dynamic-api-mssql.YOUR_SUBDOMAIN.workers.dev
```

### Step 4: Deploy Express-MySQL

```bash
cd ../DynamicApi-Express-MySQL

# Update wrangler.toml MySQL credentials (PlanetScale)

wrangler deploy

# Output: https://dynamic-api-mysql.YOUR_SUBDOMAIN.workers.dev
```

### Step 5: Set Secrets

Store sensitive data securely:

```bash
# MongoDB secrets
cd DynamicApi-Express-MongoDB
wrangler secret put MONGODB_URI
# Paste: mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/...

wrangler secret put JWT_SECRET
# Paste: your-secure-random-secret-here

wrangler secret put SMTP_PASSWORD
# Paste: your-gmail-app-password

# Repeat for Express-MSSQL and Express-MySQL
```

Verify secrets:
```bash
wrangler secret list
```

---

## Django API Deployment (Google Cloud Run)

### Step 1: Install Google Cloud SDK

```bash
# Windows: Download from https://cloud.google.com/sdk/docs/install
# Or: choco install google-cloud-sdk

# Verify
gcloud --version

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Create Secret Manager Entries (if using Cloud SQL)

```bash
# Django MySQL secrets
echo -n "your-mysql-host" | gcloud secrets create django-mysql-host --data-file=-
echo -n "your-mysql-user" | gcloud secrets create django-mysql-user --data-file=-
echo -n "your-mysql-password" | gcloud secrets create django-mysql-password --data-file=-
echo -n "dynamicapi_db" | gcloud secrets create django-mysql-database --data-file=-

# Email secrets
echo -n "smtp.gmail.com" | gcloud secrets create email-smtp-host --data-file=-
echo -n "587" | gcloud secrets create email-smtp-port --data-file=-
echo -n "your-email@gmail.com" | gcloud secrets create email-smtp-user --data-file=-
echo -n "your-app-password" | gcloud secrets create email-smtp-password --data-file=-
echo -n "noreply@yourdomain.com" | gcloud secrets create email-otp-from --data-file=-

# JWT secret
echo -n "your-secure-random-secret" | gcloud secrets create jwt-secret --data-file=-
```

### Step 3: Deploy Django-MySQL

```bash
cd DynamicApi-Django-MYSQL

# Update app.yaml with your project ID and secret names

# Deploy
gcloud run deploy dynamic-api-django-mysql \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 90 \
  --set-env-vars="DJANGO_SETTINGS_MODULE=config.settings.production"

# Output: Service deployed at: https://dynamic-api-django-mysql-xxxxx.run.app
```

### Step 4: Deploy Django-MSSQL

```bash
cd ../DynamicApi-Django-MSSQL

# Create MSSQL secrets (if using Azure SQL)
echo -n "your-mssql-server.database.windows.net" | gcloud secrets create django-mssql-server --data-file=-
echo -n "admin@your-server" | gcloud secrets create django-mssql-user --data-file=-
echo -n "YourSecurePassword123!" | gcloud secrets create django-mssql-password --data-file=-
echo -n "dynamicapi_prod" | gcloud secrets create django-mssql-database --data-file=-

# Deploy
gcloud run deploy dynamic-api-django-mssql \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 90

# Output: https://dynamic-api-django-mssql-xxxxx.run.app
```

---

## DotNet API Deployment (Google Cloud Run)

### Step 1: Build Docker Image

```bash
cd DynamicApi-Dotnet-MYSQL

# Build image
docker build -t dynamic-api-dotnet-mysql:latest .

# Test locally
docker run -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e MySQLSettings__Server=localhost \
  -e MySQLSettings__UserId=root \
  -e MySQLSettings__Password=password \
  dynamic-api-dotnet-mysql:latest

# Test: curl http://localhost:8080/api/v1.0/DynamicApi/Health
```

### Step 2: Push to Google Container Registry

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Tag image
docker tag dynamic-api-dotnet-mysql:latest \
  gcr.io/YOUR_PROJECT_ID/dynamic-api-dotnet-mysql:latest

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/dynamic-api-dotnet-mysql:latest
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy dynamic-api-dotnet-mysql \
  --image gcr.io/YOUR_PROJECT_ID/dynamic-api-dotnet-mysql:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 90 \
  --set-env-vars="ASPNETCORE_ENVIRONMENT=Production"

# Output: https://dynamic-api-dotnet-mysql-xxxxx.run.app
```

### Step 4: Deploy DotNet-MSSQL

```bash
cd ../DynamicApi-Dotnet-MSSQL

# Build, tag, push, and deploy same as above
docker build -t dynamic-api-dotnet-mssql:latest .
docker tag dynamic-api-dotnet-mssql:latest \
  gcr.io/YOUR_PROJECT_ID/dynamic-api-dotnet-mssql:latest
docker push gcr.io/YOUR_PROJECT_ID/dynamic-api-dotnet-mssql:latest

gcloud run deploy dynamic-api-dotnet-mssql \
  --image gcr.io/YOUR_PROJECT_ID/dynamic-api-dotnet-mssql:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 90
```

---

## Environment Variables Setup

### Frontend (.env.production in Vercel)

```bash
VITE_EXPRESS_MONGODB_URL=https://dynamic-api-mongodb.YOUR_SUBDOMAIN.workers.dev
VITE_EXPRESS_MSSQL_URL=https://dynamic-api-mssql.YOUR_SUBDOMAIN.workers.dev
VITE_EXPRESS_MYSQL_URL=https://dynamic-api-mysql.YOUR_SUBDOMAIN.workers.dev
VITE_DJANGO_MSSQL_URL=https://dynamic-api-django-mssql-PROJECT_ID.run.app
VITE_DJANGO_MYSQL_URL=https://dynamic-api-django-mysql-PROJECT_ID.run.app
VITE_DOTNET_MSSQL_URL=https://dynamic-api-dotnet-mssql-PROJECT_ID.run.app
VITE_DOTNET_MYSQL_URL=https://dynamic-api-dotnet-mysql-PROJECT_ID.run.app
VITE_API_TYPE=express-mongodb
VITE_EMAIL_BACKEND_TYPE=express-mongodb
VITE_FRONTEND_URL=https://your-vercel-domain.vercel.app
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_HEALTH_CHECK=true
VITE_ENVIRONMENT=production
```

### Replace Placeholders

| Placeholder | Where to Find | Example |
|------------|--------------|---------|
| `YOUR_SUBDOMAIN` | Cloudflare Dashboard → Account Settings | `a1b2c3d4e5`  |
| `PROJECT_ID` | Google Cloud Console | `my-project-12345` |
| `your-vercel-domain.vercel.app` | Vercel Dashboard → Domains | `my-api-frontend.vercel.app` |
| `YOUR_USERNAME` | GitHub profile | `john-doe` |

---

## Testing Production Deployment

### Test Express APIs

```bash
# Health check
curl https://dynamic-api-mongodb.YOUR_SUBDOMAIN.workers.dev/api/v1.0/DynamicApi/Health

# Test API call
curl -X POST https://dynamic-api-mongodb.workers.dev/api/v1.0/DynamicApi/Execute \
  -H "Content-Type: application/json" \
  -d '{"procedureName":"GetAllProducts","parameters":[]}'
```

### Test Django APIs

```bash
# Health check
curl https://dynamic-api-django-mysql-PROJECT_ID.run.app/api/v1.0/DynamicApi/Health
```

### Test DotNet APIs

```bash
# Health check
curl https://dynamic-api-dotnet-mysql-PROJECT_ID.run.app/api/v1.0/DynamicApi/Health
```

### End-to-End Frontend Test

1. Open frontend: `https://your-vercel-domain.vercel.app`
2. Login with email
3. Verify OTP email received
4. Select backend (Express-MongoDB)
5. Execute test stored procedure
6. Verify results in Dashboard
7. Test History and Analytics pages
8. Test switching between backends

---

## Monitoring & Logs

### Cloudflare Workers Logs

```bash
# Real-time logs
wrangler tail

# Check specific worker
wrangler deploy --dry-run

# View at: https://dash.cloudflare.com → Workers
```

### Google Cloud Run Logs

```bash
# View logs for Django-MySQL
gcloud run logs read dynamic-api-django-mysql \
  --limit 100 \
  --region us-central1

# Stream logs
gcloud run logs read dynamic-api-django-mysql \
  --region us-central1 \
  --follow

# View in Cloud Console
# https://console.cloud.google.com/run
```

### Frontend Errors

```bash
# Vercel Analytics
# https://vercel.com/dashboard/YOUR_PROJECT/analytics

# View build logs
# Deployments tab → Click deployment → Logs
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution**:
- Cloudflare: Check MongoDB Atlas IP whitelist (set to 0.0.0.0/0)
- Google Cloud Run: Check Cloud SQL connections
- Verify environment variables are set correctly

### Issue: "CORS error"

**Solution**:
- Update `ALLOWED_ORIGINS` in all backend configs
- Ensure frontend URL matches Vercel deployment URL

### Issue: "OTP email not sending"

**Solution**:
```bash
# Verify SMTP credentials
wrangler secret list

# Check Gmail app password (not regular password)
# https://myaccount.google.com/apppasswords
```

### Issue: Cold start on Google Cloud Run

**Solution**: This is normal. Cloud Run takes ~1 minute to boot after idle.
- To prevent: Use Cloud Run Scheduler to ping health endpoint every 10 minutes

---

## Quick Reference URLs

Once deployed, your URLs are:

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | `https://your-vercel-domain.vercel.app` | Vercel |
| **Express MongoDB** | `https://dynamic-api-mongodb.workers.dev` | Cloudflare |
| **Express MSSQL** | `https://dynamic-api-mssql.workers.dev` | Cloudflare |
| **Express MySQL** | `https://dynamic-api-mysql.workers.dev` | Cloudflare |
| **Django MySQL** | `https://dynamic-api-django-mysql-xxxxx.run.app` | Google Cloud Run |
| **Django MSSQL** | `https://dynamic-api-django-mssql-xxxxx.run.app` | Google Cloud Run |
| **DotNet MySQL** | `https://dynamic-api-dotnet-mysql-xxxxx.run.app` | Google Cloud Run |
| **DotNet MSSQL** | `https://dynamic-api-dotnet-mssql-xxxxx.run.app` | Google Cloud Run |

---

## Cost Summary

Total monthly cost: **$0** (all free tiers)

| Service | Cost | Limit |
|---------|------|-------|
| Cloudflare Workers | Free | 100K req/day |
| Vercel | Free | Unlimited bandwidth (generous) |
| Google Cloud Run | Free | 2M requests/month |
| MongoDB Atlas | Free | 512MB |
| PlanetScale | Free | 5GB |
| **TOTAL** | **$0** | — |

---

## Next Steps

1. ✅ Configure all backends with environment variables
2. ✅ Deploy Express APIs to Cloudflare Workers
3. ✅ Deploy Django/DotNet to Google Cloud Run
4. ✅ Deploy Frontend to Vercel
5. ✅ Test each API with curl
6. ✅ Test complete frontend flow
7. ✅ Monitor logs for errors
8. ✅ Set up custom domain (optional)

---

## Support

- **Cloudflare**: https://developers.cloudflare.com/workers/
- **Google Cloud Run**: https://cloud.google.com/run/docs
- **Vercel**: https://vercel.com/docs
- **MongoDB**: https://docs.atlas.mongodb.com/
- **PlanetScale**: https://planetscale.com/docs

Good luck! 🚀
