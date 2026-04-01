# Industry-Standard Folder Structure

## System Requirements

### Minimum Requirements
- **Python**: 3.8+ (Recommended: 3.11+)
- **MySQL**: 5.7+ (Recommended: 8.0+)
- **pip**: Latest version
- **4GB RAM** minimum for development
- **2GB Disk** space for requirements

### Internet Connection
Required for:
- Installing pip packages
- Downloading dependencies
- Initial setup

### Operating System Support
- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Ubuntu 18.04+
- ✅ Any Linux with Python 3.8+

## Installation Requirements

### Required Python Packages
```
Django==4.2.8                      # Web framework
djangorestframework==3.14.0        # REST API
django-cors-headers==4.3.1         # CORS support
PyJWT==2.12.1                      # JWT authentication
python-decouple==3.8               # Environment config
PyMySQL==1.1.0                     # MySQL driver
python-dateutil==2.8.2             # Date utilities
requests==2.31.0                   # HTTP client
drf-spectacular==0.26.5            # Swagger generation
drf-spectacular-sidecar==2024.1.1  # Swagger assets
cryptography>=41.0.0               # Encryption
```

### Running on Different Systems

#### Windows Setup
```powershell
# 1. Install Python 3.11
# Download from: https://www.python.org/downloads/
# Check "Add Python to PATH" during installation

# Verify installation
python --version
pip --version

# 2. Install MySQL
# Download from: https://dev.mysql.com/downloads/mysql/
# Or use: choco install mysql
choco install mysql

# 3. Clone/Extract project
git clone <repo-url> DynamicApi-Django
cd DynamicApi-Django

# 4. Create virtual environment
python -m venv venv

# 5. Activate virtual environment
venv\Scripts\activate

# 6. Install dependencies
pip install -r requirements.txt
pip install cryptography

# 7. Create .env file
echo DEBUG=True > .env
echo DB_HOST=127.0.0.1 >> .env
echo DB_NAME=DynamicApiDb >> .env
echo DB_USER=root >> .env
echo DB_PASSWORD=your_password >> .env

# 8. Set up database
mysql -u root -p
CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4;
EXIT;

# 9. Run migrations
python manage.py migrate

# 10. Start server
python manage.py runserver
# Access: http://127.0.0.1:8000
```

#### macOS Setup
```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Python 3.11
brew install python@3.11
python3.11 --version

# 3. Install MySQL
brew install mysql
mysql --version

# Start MySQL
brew services start mysql

# 4. Clone/Extract project
git clone <repo-url> DynamicApi-Django
cd DynamicApi-Django

# 5. Create virtual environment
python3.11 -m venv venv

# 6. Activate virtual environment
source venv/bin/activate

# 7. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install cryptography

# 8. Create .env file
cat > .env << EOF
DEBUG=True
DB_HOST=127.0.0.1
DB_NAME=DynamicApiDb
DB_USER=root
DB_PASSWORD=
EOF

# 9. Set up database
mysql -u root
CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4;
EXIT;

# 10. Run migrations
python manage.py migrate

# 11. Start server
python manage.py runserver
# Access: http://127.0.0.1:8000
```

#### Linux (Ubuntu/Debian) Setup
```bash
# 1. Update system
sudo apt update
sudo apt upgrade

# 2. Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip
python3.11 --version

# 3. Install MySQL
sudo apt install mysql-server mysql-client
sudo mysql_secure_installation

# 4. Clone/Extract project
git clone <repo-url> DynamicApi-Django
cd DynamicApi-Django

# 5. Create virtual environment
python3.11 -m venv venv

# 6. Activate virtual environment
source venv/bin/activate

# 7. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install cryptography

# 8. Create .env file
cat > .env << EOF
DEBUG=True
DB_HOST=127.0.0.1
DB_NAME=DynamicApiDb
DB_USER=root
DB_PASSWORD=your_password
EOF

# 9. Set up database
sudo mysql -u root -p
CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4;
EXIT;

# 10. Run migrations
python manage.py migrate

# 11. Start server
python manage.py runserver
# Access: http://127.0.0.1:8000
```

#### Docker Setup (All Platforms)
```bash
# 1. Install Docker
# Windows/macOS: Download Docker Desktop from https://www.docker.com/products/docker-desktop
# Linux: sudo apt install docker.io docker-compose

# 2. Build containers
docker-compose build

# 3. Start containers
docker-compose up

# 4. In another terminal, run migrations
docker-compose exec web python manage.py migrate

# 5. Access application
# http://localhost:8000
# Swagger: http://localhost:8000/api/docs/swagger/
```

---

## Architecture Overview

```
DYNAMIC API
│
├── 🔧 CONFIGURATION LAYER (config/)
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py           ← Shared settings
│   │   ├── development.py    ← Dev overrides
│   │   └── production.py     ← Prod overrides
│   ├── urls.py               ← Main routing
│   └── wsgi.py               ← WSGI app
│
├── 📱 APPS LAYER (apps/)
│   ├── procedures/           ← API endpoints
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── services.py
│   │   ├── admin.py
│   │   ├── tests.py
│   │   └── migrations/
│   │
│   └── common/               ← Shared code
│       ├── exceptions.py
│       └── permissions.py
│
├── 💼 CORE LAYER (core/)
│   ├── services.py           ← Business logic
│   ├── executor/
│   │   └── executor.py       ← Database abstraction
│   └── exceptions.py
│
├── 🛠️  UTILITIES LAYER (utils/)
│   ├── logger.py
│   ├── decorators.py
│   └── helpers.py
│
├── ✅ TESTS (tests/)
│   ├── conftest.py
│   ├── test_api.py
│   └── test_procedures.py
│
├── 📚 DOCS (docs/)
│   ├── STRUCTURE.md
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── 🐳 DOCKER (docker/)
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── 📊 ROOT FILES
│   ├── manage.py              ← Django CLI
│   ├── requirements.txt       ← Dependencies
│   ├── .env                   ← Configuration
│   ├── .gitignore
│   └── README.md
│
└── 📁 GENERATED FOLDERS
    ├── logs/                 ← Application logs
    ├── staticfiles/          ← Static files
    └── db.sqlite3            ← SQLite (dev)
```

## Layer Responsibilities

### 1️⃣ Configuration Layer (`config/`)
**Responsibility**: Project setup and routing
- Settings by environment
- URL patterns
- WSGI configuration

**Philosophy**: 
- "All configuration in one place"
- Environment separation
- No business logic

### 2️⃣ Apps Layer (`apps/`)
**Responsibility**: Feature modules
- REST API endpoints (views)
- Data models
- Serialization

**Philosophy**:
- "Django conventions"
- Keep apps self-contained
- Thin controllers

### 3️⃣ Core Layer (`core/`)
**Responsibility**: Business logic
- Service classes
- Database abstraction
- Reusable logic

**Philosophy**:
- "Decoupled from framework"
- Testable
- Database-agnostic

### 4️⃣ Utils Layer (`utils/`)
**Responsibility**: Shared helpers
- Logging
- Decorators
- Common functions

**Philosophy**:
- "Don't repeat yourself"
- Reusable across apps
- No dependencies on apps

## Data Flow

```
HTTP Request
    ↓
[config/urls.py] → Route to endpoint
    ↓
[apps/procedures/views.py] → Handle request
    ↓
[apps/procedures/serializers.py] → Validate input
    ↓
[core/services.py] → Execute business logic
    ↓
[core/executor/executor.py] → Access database
    ↓
[MySQL Database] → Execute procedure
    ↓
[core/executor/executor.py] → Return results
    ↓
[core/services.py] → Process results
    ↓
[apps/procedures/serializers.py] → Format response
    ↓
[apps/procedures/views.py] → Return response
    ↓
HTTP Response
```

## Why This Structure?

### ✅ Scalability
- Add new apps without modifying existing code
- Apps are independent modules
- Clear extension points
- Services layer handles growth

### ✅ Maintainability
- Files are where you expect them
- Clear separation of concerns
- Easy to find code
- Standard organization

### ✅ Testability
- Layers can be tested independently
- Mock dependencies easily
- Service layer is framework-agnostic
- Unit, integration, and E2E testing clear

### ✅ Reliability
- Multi-database support
- Consistent error handling
- Comprehensive logging
- Audit trails for procedures

### ✅ Security
- Environment-specific settings
- Sensitive data in .env
- Development != production
- Clear security boundaries

## Example: Adding a New Feature

### Scenario: Add new procedure "GetUserById"

### 1. Add endpoint in `apps/procedures/views.py`
```python
@api_view(['POST'])
def get_user_by_id(request):
    serializer = UserRequestSerializer(data=request.data)
    if serializer.is_valid():
        success, msg, data = ProcedureService.execute(
            'GetUserById',
            f"userId={request.data['userId']}"
        )
        # Return response
```

### 2. Register URL in `apps/procedures/urls.py`
```python
path('GetUserById', views.get_user_by_id)
```

### 3. Add tests in `apps/procedures/tests.py`
```python
def test_get_user_by_id(self):
    # Test logic
```

**No changes needed to**: config, core, utils, other apps

## Production Deployment

### Environment: Production
```
DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py migrate
gunicorn config.wsgi --workers 4
```

### Environment: Development
```python
python manage.py runserver  # Uses config.settings.development
```

## Key Metrics

| Aspect | Value |
|--------|-------|
| **Apps** | 2 (procedures, common) |
| **Services** | 1 (ProcedureService) |
| **Models** | 1 (ExecutionLog) |
| **Endpoints** | 1 (/DynamicApiExecute) |
| **Database Support** | 3 (MySQL, MSSQL, Oracle) |
| **Test Coverage** | Testable design |
| **Documentation** | Comprehensive |

## Best Practices Implemented

✅ **DRY** (Don't Repeat Yourself)
- Shared code in utils and core

✅ **SOLID Principles**
- Single Responsibility (clear layers)
- Open/Closed (extend without modify)
- Dependency Inversion (abstract executors)

✅ **12-Factor App**
- Configuration in environment
- Explicit dependencies in requirements.txt
- Stateless processes

✅ **Django Conventions**
- manage.py at root
- Apps in apps/ folder
- Settings in config/
- Tests alongside code

✅ **Enterprise Patterns**
- Service Layer pattern
- Repository pattern (executor)
- Dependency Injection (database executor)
- Audit logging (ExecutionLog)

## Migration Path (if needed)

If you need to move from old to new structure:

1. **Copy old code** to new locations
2. **Update imports** (from dynamic_api_app → from apps.procedures)
3. **Update settings** in manage.py and config/wsgi.py
4. **Run migrations** (no DB changes for now)
5. **Test thoroughly** (API smoke tests)

All functionality preserved, just reorganized.

## Next Level Improvements

Ready for future enhancements:
- ✅ Add async tasks (Celery)
- ✅ Add caching layer (Redis)
- ✅ Add GraphQL API
- ✅ Add WebSocket support
- ✅ Add permission system
- ✅ Add API versioning
- ✅ Add monitoring/APM
- ✅ Add advanced logging

All would integrate cleanly with this structure.

## Production Deployment

### Deploy on Windows Server

```powershell
# 1. Install IIS and Python 3.11
# 2. Create application directory
mkdir C:\inetpub\wwwroot\DynamicApi

# 3. Clone project
cd C:\inetpub\wwwroot\DynamicApi
git clone <repo-url> .

# 4. Create virtual environment
python -m venv venv
venv\Scripts\activate

# 5. Install dependencies
pip install -r requirements.txt
pip install gunicorn

# 6. Create .env with production settings
# DEBUG=False
# ALLOWED_HOSTS=yourdomain.com

# 7. Collect static files
python manage.py collectstatic --noinput

# 8. Run migrations
python manage.py migrate

# 9. Start Gunicorn
gunicorn --workers 4 --bind 0.0.0.0:8000 config.wsgi
```

### Deploy on Linux Server

```bash
# 1. SSH into server
ssh user@server-ip

# 2. Install Python, MySQL, Nginx
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip nginx
sudo apt install mysql-server mysql-client

# 3. Create application directory
mkdir /var/www/DynamicApi
cd /var/www/DynamicApi

# 4. Clone project
git clone <repo-url> .

# 5. Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# 6. Install dependencies
pip install -r requirements.txt
pip install gunicorn

# 7. Create .env with production settings
cat > .env << EOF
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=yourdomain.com
DB_HOST=localhost
DB_NAME=DynamicApiDb
DB_USER=django_user
DB_PASSWORD=strong_password
EOF

# 8. Run migrations
python manage.py migrate

# 9. Create Gunicorn service
sudo systemctl enable gunicorn
sudo systemctl start gunicorn

# 10. Configure Nginx
sudo systemctl restart nginx

# Application available at: http://yourdomain.com
```

## Troubleshooting & Common Errors

### Error: "No module named 'django'"
```bash
# Solution: Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
```

### Error: "MySQL connection refused"
```bash
# Solution: Check MySQL is running
# Windows: net start MySQL80
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql
```

### Error: "Cryptography not installed"
```bash
# Solution: Install cryptography
pip install cryptography
```

### Error: "Port 8000 already in use"
```bash
# Solution: Use different port
python manage.py runserver 8001
```

### Error: "Database does not exist"
```bash
# Solution: Create database
mysql -u root -p
CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4;
python manage.py migrate
```
