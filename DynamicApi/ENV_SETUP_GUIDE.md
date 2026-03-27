# 🔐 Environment Variables Configuration Guide

## Overview

Your .NET API now uses **environment variables from `.env` file** instead of hardcoded credentials.

### File Structure

```
DynamicApi/
├── .env                          ← Local credentials (NOT in git)
├── .env.example                  ← Template (IN git)
├── appsettings.json              ← Uses ${VARIABLE} placeholders
├── appsettings.Development.json  ← Same (allows wildcard hosts)
├── Program.cs                    ← Loads .env file
└── .gitignore                    ← Excludes .env
```

---

## 🚀 Quick Start - Local Testing

### Step 1: Configure `.env` File

The `.env` file already exists with local defaults:

```bash
# Database Configuration (LOCAL TESTING)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=DynamicApiDb
DB_USER=root
DB_PASSWORD=123456
```

**Change `DB_PASSWORD` to match your local MySQL:**

```bash
# Edit the .env file
DB_PASSWORD=your_actual_local_password
```

### Step 2: Run the API

```powershell
cd C:\Users\EIPLPC038\Documents\backend\DynamicApi
dotnet run
```

**API will:**
- ✅ Load `.env` file automatically (Program.cs does this)
- ✅ Replace `${DB_HOST}`, `${DB_USER}`, etc. in connection string
- ✅ Connect to database without hardcoded passwords
- ✅ Start on http://localhost:5000

### Step 3: Test Swagger

Open browser: **http://localhost:5000/swagger/index.html**

---

## 📋 Configuration Conditions

### **Development (Local Testing)**
```
AllowedHosts: "*"                    ← Accept any hostname
DB_HOST: 127.0.0.1                  ← Local database
DB_PASSWORD: your_local_password     ← From .env
```

**File**: `appsettings.Development.json`

### **Production**
```
AllowedHosts: "yourdomain.com,api.yourdomain.com"  ← Specific domains only
DB_HOST: your-production-db.com                    ← Production database
DB_PASSWORD: ${DB_PASSWORD}                        ← From server environment
```

**File**: `appsettings.json` (uses placeholders)

---

## 🔄 How It Works

### 1️⃣ Program.cs Loads `.env`

```csharp
// Load environment variables from .env file
var envFilePath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envFilePath))
{
    var envLines = File.ReadAllLines(envFilePath);
    foreach (var line in envLines)
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
            continue;

        var parts = line.Split('=');
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
        }
    }
}
```

### 2️⃣ appsettings.json Uses Placeholders

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=${DB_HOST};Port=${DB_PORT};Database=${DB_NAME};User=${DB_USER};Password=${DB_PASSWORD};Charset=utf8mb4;"
  }
}
```

### 3️⃣ Program.cs Replaces Variables

```csharp
// Replace environment variables in connection string
connectionString = connectionString
    .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST") ?? "127.0.0.1")
    .Replace("${DB_PORT}", Environment.GetEnvironmentVariable("DB_PORT") ?? "3306")
    .Replace("${DB_NAME}", Environment.GetEnvironmentVariable("DB_NAME") ?? "DynamicApiDb")
    .Replace("${DB_USER}", Environment.GetEnvironmentVariable("DB_USER") ?? "root")
    .Replace("${DB_PASSWORD}", Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "");
```

**Result:**
```
Original:  "Server=${DB_HOST};Port=${DB_PORT};Database=${DB_NAME};User=${DB_USER};Password=${DB_PASSWORD};"
Replaced:  "Server=127.0.0.1;Port=3306;Database=DynamicApiDb;User=root;Password=123456;"
```

---

## 🛡️ Security

### ✅ Secure Practices

| What | Local | Git Tracking | Why |
|------|-------|--------------|-----|
| `.env` | ✅ Use | ❌ NO | Contains real passwords |
| `.env.example` | (template) | ✅ YES | Shows what vars are needed |
| `appsettings.json` | ✅ Use | ✅ YES | Only has placeholders |
| `Program.cs` | ✅ Use | ✅ YES | Only has loading logic |

### ❌ Never Do

- ❌ Commit `.env` to git (already in `.gitignore`)
- ❌ Hardcode passwords in `appsettings.json`
- ❌ Share `.env` file unencrypted
- ❌ Use same password for dev and production

---

## 🌍 AllowedHosts Configuration

### Local (Development)
```
AllowedHosts: "*"                           ← Accept all hostnames
```
✅ Good for local testing  
✅ Allows localhost, 127.0.0.1, any domain

### Production
```
AllowedHosts: "yourdomain.com,api.yourdomain.com"  ← Specific only
```
✅ Only accepts production domain  
✅ Protects against HOST header injection attacks

---

## 📝 CORS Origins Configuration

### Local (in `appsettings.json`)
```json
"CorsOrigins": "http://localhost:3000,http://localhost:8000,http://localhost:5000,https://yourdomain.com,https://api.yourdomain.com"
```

| Origin | Purpose |
|--------|---------|
| `http://localhost:3000` | Express API (if running) |
| `http://localhost:8000` | Django API (if running) |
| `http://localhost:5000` | This .NET API |
| `https://yourdomain.com` | Production frontend |

---

## 🔧 For Production Deployment

### Step 1: Don't Use `.env` File in Production

Instead, use **server environment variables**:

**Windows (IIS):**
```
Set environment variables in IIS Application Pool settings
```

**Docker:**
```yaml
environment:
  - DB_HOST=production-db.com
  - DB_PORT=3306
  - DB_NAME=prod_database
  - DB_USER=prod_user
  - DB_PASSWORD=strong_password
```

**Linux:**
```bash
export DB_HOST=production-db.com
export DB_PORT=3306
export DB_NAME=prod_database
export DB_USER=prod_user
export DB_PASSWORD=strong_password

dotnet run
```

### Step 2: Update `AllowedHosts`

Change in production `appsettings.json` or via environment:

```csharp
// In Program.cs for production
var allowedHosts = Environment.GetEnvironmentVariable("ALLOWED_HOSTS") 
    ?? "yourdomain.com,api.yourdomain.com";
```

---

## ✅ Testing Your Setup

### Test 1: Verify .env Is Loaded

Add a test endpoint to see what environment variables are loaded:

```csharp
[HttpGet("debug/env")]
public IActionResult GetEnv()
{
    return Ok(new
    {
        db_host = Environment.GetEnvironmentVariable("DB_HOST"),
        db_port = Environment.GetEnvironmentVariable("DB_PORT"),
        db_name = Environment.GetEnvironmentVariable("DB_NAME"),
        db_user = Environment.GetEnvironmentVariable("DB_USER")
        // Don't expose password!
    });
}
```

**Test:** `http://localhost:5000/debug/env`

### Test 2: Verify Database Connection

```bash
# If API starts without error → Database connection works
dotnet run

# Look for these logs:
# - "Successfully connected to database"
# - No connection errors
```

### Test 3: Verify Swagger Works

**Open:** `http://localhost:5000/swagger/index.html`

✅ Should load without "Bad Request - Invalid Hostname" error

---

## 🚨 Troubleshooting

### Issue: "Cannot connect to database"

**Check:**
1. MySQL is running: `mysql -u root -p`
2. .env has correct values
3. DB_PASSWORD matches your MySQL password

### Issue: "Bad Request - Invalid Hostname"

**Check:**
1. AllowedHosts is `"*"` in `appsettings.Development.json`
2. Delete `bin/` and `obj/` folders
3. Rebuild: `dotnet clean && dotnet build`

### Issue: .env Not Loading

**Check:**
1. .env file exists in project root
2. Run from correct directory: `cd DynamicApi/`
3. Check Program.cs has `.env` loading code

---

## 📚 Summary

| Item | Local | Production |
|------|-------|-----------|
| Config File | `appsettings.Development.json` | `appsettings.json` +env vars |
| .env File | ✅ Use | ❌ Don't use |
| AllowedHosts | `"*"` | `"yourdomain.com,..."` |
| Credentials | From `.env` | From server env vars |
| Database | localhost | production-db.com |

---

✅ **Your API is now secure and ready for local testing!**

Credentials are no longer visible in code. All sensitive data comes from `.env` (local) or server environment variables (production).
