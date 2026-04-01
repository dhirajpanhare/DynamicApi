# Project Structure

This document describes the folder structure and organization of the Dynamic API project.

## System Requirements

### Prerequisites
- **Python**: 3.8+ (tested with 3.14.3)
- **MySQL**: 5.7+ or 8.0+
- **Git**: For version control
- **pip**: Python package manager (comes with Python)

### Python Packages
```
Django==4.2.8
djangorestframework==3.14.0
django-cors-headers==4.3.1
PyJWT==2.12.1
python-decouple==3.8
pyodbc==5.1.0
PyMySQL==1.1.0
cryptography>=41.0.0
python-dateutil==2.8.2
requests==2.31.0
drf-spectacular==0.26.5
drf-spectacular-sidecar==2024.1.1
```

## Installation & Setup

### Step 1: Prerequisites Installation

#### Windows
```powershell
# Download Python 3.8+ from https://www.python.org/downloads/

# Verify installation
python --version
pip --version

# Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/

# Verify MySQL
mysql --version
```

#### macOS
```bash
# Install Python using Homebrew
brew install python@3.11

# Install MySQL
brew install mysql

# Verify installations
python3 --version
mysql --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update

# Install Python and MySQL
sudo apt install python3.11 python3.11-venv python3-pip
sudo apt install mysql-server mysql-client

# Verify installations
python3 --version
mysql --version
```

### Step 2: Clone & Setup Project

#### All Operating Systems
```bash
# Navigate to your workspace
cd C:\Users\YourUsername\Documents\backend  # Windows
cd ~/Documents/backend  # macOS
cd ~/Documents/backend  # Linux

# Clone or extract the project
cd DynamicApi-Django

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install cryptography for MySQL
pip install cryptography
```

### Step 3: Configure Environment

#### Create .env file
Create `.env` in project root:
```env
# Django Settings
DEBUG=True
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=your-secret-key-change-in-production

# Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=DynamicApiDb
DB_USER=root
DB_PASSWORD=your_password

# Allowed Hosts
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
```

### Step 4: Database Setup

#### Create MySQL Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE DynamicApiDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Show created database
SHOW DATABASES;

# Exit MySQL
EXIT;
```

#### Import Sample Procedures (Optional)
```bash
# Navigate to SQL folder
cd DynamicApi-Django

# Import setup.sql (if available)
mysql -u root -p DynamicApiDb < path/to/setup.sql
```

### Step 5: Run Migrations

```bash
# Navigate to project directory
cd DynamicApi-Django

# Activate virtual environment (if not already active)
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Apply migrations
python manage.py migrate
```

### Step 6: Start Development Server

```bash
# Start server (uses development settings automatically)
python manage.py runserver

# Server runs on http://127.0.0.1:8000/

# Access Swagger UI
http://127.0.0.1:8000/api/docs/swagger/

# Test API endpoint
curl -X POST http://127.0.0.1:8000/api/v1.0/DynamicApi/DynamicApiExecute \
  -H "Content-Type: application/json" \
  -d '{
    "stringOne": "p_sample=value",
    "stringTwo": "|",
    "stringThree": "=",
    "stringFour": "YourProcedureName"
  }'
```

### Troubleshooting Setup

#### "Module not found" errors
```bash
# Reinstall requirements
pip install --upgrade -r requirements.txt
```

#### Database connection errors
```bash
# Verify MySQL is running
# Windows: Check Services or: mysql --version
# macOS: brew services list | grep mysql
# Linux: systemctl status mysql

# Test connection
mysql -u root -p -h 127.0.0.1
```

#### Port 8000 already in use
```bash
# Use different port
python manage.py runserver 8001
```

#### Cryptography installation fails
```bash
# Windows (install C++ build tools first)
# Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# macOS/Linux
brew install openssl  # macOS
sudo apt install libssl-dev  # Linux
pip install --upgrade cryptography
```

---

## Directory Organization

```
project_root/
├── manage.py                  # Django management CLI
├── requirements.txt           # Python dependencies
├── .env                       # Environment configuration
│
├── config/                    # Project configuration
│   ├── __init__.py
│   ├── settings/             # Environment-specific settings
│   │   ├── __init__.py
│   │   ├── base.py           # Shared configuration
│   │   ├── development.py    # Development overrides
│   │   └── production.py     # Production overrides
│   ├── urls.py               # Main URL routing
│   └── wsgi.py               # WSGI application
│
├── apps/                      # Django applications
│   ├── __init__.py
│   ├── procedures/           # Main API app (stored procedure execution)
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── admin.py          # Django admin configuration
│   │   ├── apps.py           # App configuration
│   │   ├── models.py         # Database models (ExecutionLog)
│   │   ├── views.py          # API endpoints
│   │   ├── urls.py           # URL routing
│   │   ├── serializers.py    # DRF serializers
│   │   └── tests.py          # Unit tests
│   └── common/               # Shared utilities
│       ├── __init__.py
│       └── exceptions.py     # Custom exceptions
│
├── core/                      # Business logic layer
│   ├── __init__.py
│   ├── services.py           # Core business logic
│   ├── executor/             # Database execution
│   │   ├── __init__.py
│   │   └── executor.py       # Database-agnostic executor
│   └── exceptions.py         # Core exceptions (optional)
│
├── utils/                     # Utilities and helpers
│   ├── __init__.py
│   ├── logger.py             # Logging utilities
│   └── decorators.py         # Custom decorators
│
├── tests/                     # Test suite
│   ├── __init__.py
│   ├── conftest.py           # Pytest configuration
│   └── test_*.py             # Test cases
│
├── docs/                      # Documentation
│   ├── API.md                # API documentation
│   ├── SETUP.md              # Setup guide
│   └── DEPLOYMENT.md         # Deployment guide
│
├── docker/                    # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── logs/                      # Application logs (generated)
├── staticfiles/               # Static files (generated)
└── db.sqlite3                 # SQLite database (dev mode)
```

## Architecture Layers

### 1. **Config Layer** (`config/`)
- **Purpose**: Project configuration and URL routing
- **Separation**: Environment-specific settings (dev/prod)
- **Files**:
  - `settings/base.py`: Common configuration
  - `settings/development.py`: Development overrides
  - `settings/production.py`: Production overrides
  - `urls.py`: Main URL routing

### 2. **Apps Layer** (`apps/`)
- **Purpose**: Django applications (feature modules)
- **Principles**: Each app is self-contained
- **Apps**:
  - `procedures/`: Main API for stored procedure execution
  - `common/`: Shared utilities and exceptions

### 3. **Core Layer** (`core/`)
- **Purpose**: Business logic and database interaction
- **Principles**: Database-agnostic, reusable
- **Components**:
  - `services.py`: Business logic orchestration
  - `executor/`: Database abstraction layer

### 4. **Utils Layer** (`utils/`)
- **Purpose**: Shared utilities and helpers
- **Usage**: Logging, decorators, common functions

### 5. **Tests Layer** (`tests/`)
- **Purpose**: Test suite
- **Structure**: Mirrors app structure

## Key Design Principles

### Scalability
- **Apps Independence**: Each Django app is isolated and reusable
- **Separation of Concerns**: Clear boundaries between layers
- **Settings Management**: Environment-specific configuration

### Maintainability
- **Clear Naming**: Files and directories have clear purposes
- **Documentation**: Each module is documented
- **Consistent Structure**: Predictable organization

### Reliability
- **Error Handling**: Custom exceptions for better debugging
- **Logging**: Comprehensive logging throughout
- **Audit Trails**: Execution logs for all procedures

### Database Compatibility
- **Multi-Database Support**: MySQL, MSSQL, Oracle
- **Database Abstraction**: DatabaseExecutor handles differences
- **Connection Management**: Django handles pooling and timeouts

## Settings Management

### Base Settings (`settings/base.py`)
Contains shared configuration for all environments:
- Django apps (REST Framework, CORS, drf-spectacular)
- Database connection options
- Logging configuration
- API settings (pagination, throttling)

### Development Settings (`settings/development.py`)
Extends base with:
- DEBUG = True
- MySQL database configuration
- Extended logging
- All hosts allowed

### Production Settings (`settings/production.py`)
Extends base with:
- DEBUG = False
- Security headers enabled
- SSL/TLS configuration
- Performance optimizations

## Running the Application

### Development
```bash
python manage.py runserver
```
Uses `config.settings.development`

### Production
```bash
DJANGO_SETTINGS_MODULE=config.settings.production gunicorn config.wsgi
```
Uses `config.settings.production`

## Adding New Features

### Adding an App
1. Create new folder under `apps/`
2. Run `python manage.py startapp new_app apps/new_app`
3. Add to `INSTALLED_APPS` in `config/settings/base.py`

### Adding Business Logic
1. Create service in `core/services.py`
2. Use DatabaseExecutor for database access
3. Use custom exceptions from `apps.common.exceptions`

### Adding Utilities
1. Create module in `utils/`
2. Document with docstrings
3. Use decorators from `utils/decorators.py`

## Environment Variables

Configuration via `.env` file:
- `DJANGO_SETTINGS_MODULE`: Settings file to use
- `DEBUG`: Debug mode (True/False)
- `ALLOWED_HOSTS`: Allowed host list
- `DB_*`: Database configuration
- `JWT_*`: JWT authentication settings

See `.env` file for complete list.
