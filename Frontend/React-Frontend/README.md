# Dynamic API - React Frontend

## 📋 Overview

React + Vite frontend application for the Dynamic API platform. Features email-based OTP authentication, dynamic backend selection, and support for multiple API implementations across .NET, Django, and Express.

## 🛠️ Technologies Used

- **Framework**: React 18+ with Vite
- **Styling**: CSS with responsive design
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Routing**: React Router v6+
- **Build Tool**: Vite
- **Icons**: lucide-react
- **Environment**: Dotenv (.env files)

## 🏗️ Project Structure

```
Frontend/React-Frontend/
├── public/                      # Static assets
├── src/
│   ├── components/             # Reusable components
│   │   ├── EmailBackendSelector.jsx    # Backend selection dropdown
│   │   ├── ProtectedRoute.jsx          # Route protection wrapper
│   │   └── layout/
│   │       └── Layout.jsx              # Main layout component
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx             # Authentication state
│   │   └── EmailBackendContext.jsx     # Email backend selection
│   ├── pages/                  # Page components
│   │   ├── Login.jsx                   # Login/OTP page
│   │   ├── OTPVerification.jsx         # OTP verification page
│   │   ├── Dashboard.jsx               # Main dashboard
│   │   ├── ApiTester.jsx               # API testing interface
│   │   ├── History.jsx                 # Request history
│   │   └── Analytics.jsx               # Analytics dashboard
│   ├── styles/                 # Global styles
│   │   ├── index.css                   # Global styles
│   │   └── EmailBackendSelector.css    # Backend selector styles
│   ├── App.jsx                 # Main App component
│   ├── main.jsx                # React entry point
│   └── index.css               # Global CSS
├── .env.example                # Environment variables template
├── .env.local                  # Local environment variables
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- One of the backend implementations running (port 3001-3003, 8000-8001, 5000-5001)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev

# Access application
open http://localhost:5173
```

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 📝 Environment Configuration

Create `.env.local` file in the project root:

```env
# Default Backend Selection (optional - can be changed via UI)
VITE_EMAIL_BACKEND_TYPE=express-mongodb

# Backend URLs (auto-detected, but can be overridden)
VITE_EXPRESS_MONGODB_URL=http://localhost:3001
VITE_EXPRESS_MSSQL_URL=http://localhost:3002
VITE_EXPRESS_MYSQL_URL=http://localhost:3003
VITE_DJANGO_MSSQL_URL=http://localhost:8000
VITE_DJANGO_MYSQL_URL=http://localhost:8001
VITE_DOTNET_MSSQL_URL=http://localhost:5000
VITE_DOTNET_MYSQL_URL=http://localhost:5001
```

## 🔐 Authentication Flow

### 1. Email & OTP Login

The application uses email-based One-Time Password (OTP) authentication:

```
User enters email
    ↓
Frontend sends: POST /api/v1.0/auth/send-otp
    ↓
Backend sends 6-digit OTP to user's email
    ↓
User receives email with OTP
    ↓
User enters OTP in frontend
    ↓
Frontend sends: POST /api/v1.0/auth/verify-otp
    ↓
Backend validates OTP, returns JWT token
    ↓
Token stored in localStorage
    ↓
User logged in ✅
```

### 2. Login Page Components

**Login.jsx** includes:
- Email input field
- OTP sending functionality
- Error/success messages
- **EmailBackendSelector dropdown** for choosing which backend to use

### 3. OTP Verification

**OTPVerification.jsx** handles:
- OTP input (6 digits)
- OTP validation
- JWT token storage
- Redirect to dashboard on success

## 🌐 Dynamic Backend Selection

### Features

✅ **No Restart Required**: Switch backends instantly  
✅ **UI Dropdown**: Purple gradient selector on login page  
✅ **Persistent Choice**: Selection saved to localStorage  
✅ **7 Backends Supported**: All combinations available  
✅ **Fallback**: Defaults to environment variable or express-mongodb  

### How It Works

```jsx
// EmailBackendSelector.jsx - Shows dropdown with 7 backends
<EmailBackendSelector />

// EmailBackendContext.jsx - Stores selected backend
const { getCurrentBackendUrl } = useContext(EmailBackendContext);

// AuthContext.jsx - Uses selected backend for OTP
const backendUrl = emailBackendContext.getCurrentBackendUrl();
// Sends OTP request to selected backend
```

### Available Backends

```
Express + MongoDB         Port 3001
Express + MSSQL           Port 3002
Express + MySQL           Port 3003
Django + MSSQL            Port 8000
Django + MySQL            Port 8001
.NET + MSSQL              Port 5000
.NET + MySQL              Port 5001
```

### Selecting a Backend

1. Navigate to Login page: `http://localhost:5173/login`
2. Click the **purple dropdown** near the top
3. Select your preferred backend (see Grouped Categories)
4. Dropdown shows "Using: [Backend Name]"
5. Send OTP - request goes to selected backend
6. Selection persists across page reloads

## 🔑 API Integration

### Send OTP Email

```javascript
// In AuthContext - automatically uses selected backend
const backendUrl = emailBackendContext.getCurrentBackendUrl();
const response = await fetch(`${backendUrl}/api/v1.0/auth/send-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail })
});
```

### Verify OTP

```javascript
// Returns JWT token on success
const response = await fetch(`${backendUrl}/api/v1.0/auth/verify-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: userEmail, otp: otpCode })
});
```

### Using JWT Token

All authenticated requests include the token:

```javascript
const response = await fetch(`${backendUrl}/api/v1.0/DynamicApi/DynamicApiExecute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`  // Include token
  },
  body: JSON.stringify({
    stringOne: 'param1=value1|param2=value2',
    stringTwo: '|',
    stringThree: '=',
    stringFour: 'ProcedureName'
  })
});
```

## 🎨 Component Architecture

### Context Providers

**EmailBackendContext** - Global backend selection state
```javascript
{
  backends: { /* 7 backend configs */ },
  setEmailBackend(backendId),
  getCurrentBackendUrl(),
  getCurrentBackendName()
}
```

**AuthContext** - Authentication state
```javascript
{
  user,
  isAuthenticated,
  sendOTP(email),
  verifyOTP(email, otp),
  logout()
}
```

### Key Components

**EmailBackendSelector** - Dropdown UI for backend selection
- Shows current backend
- Groups options by type (Express, Django, .NET)
- Saves to localStorage
- Updates in real-time

**ProtectedRoute** - Wraps authenticated pages
- Checks if user is logged in
- Redirects to login if not authenticated
- Prevents unauthorized access

**Layout** - Main application layout
- Header with navigation
- Sidebar menu
- Footer
- Content area

## 🧪 Testing with Different Backends

### Test Scenario: Switch Backends

```
1. Start Express-MongoDB backend (port 3001)
2. Open http://localhost:5173/login
3. Select "Express + MongoDB (3001)" from dropdown
4. Enter email: test@example.com
5. Click "Send OTP"
   → Check email for OTP code
6. Enter OTP and verify
7. Logged in ✅

8. Go back to login page
9. Select "Django + MSSQL (8000)" from dropdown
10. Enter different email: test2@example.com
11. Click "Send OTP"
    → OTP sent via Django backend at port 8000
12. Verify OTP
13. Logged in ✅
```

### Verifying Requests in Browser

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Network** tab
3. Send OTP
4. Check request URL shows correct backend:
   - Should be `http://localhost:XXXX/api/v1.0/auth/send-otp`
   - Port depends on selected backend

## 💾 State Management

### localStorage Keys

```javascript
// Email Backend Selection
localStorage.getItem('emailBackend')
// Returns: "express-mongodb", "django-mssql", etc.

// Current User
localStorage.getItem('currentUser')
// Returns: { id, email, ... }

// JWT Token
localStorage.getItem('currentToken')
// Returns: "eyJhbGciOiJIUzI1NiIs..."

// OTP Data (per email)
localStorage.getItem('otp_user@example.com')
// Returns: { code, timestamp, expiresAt, ... }
```

## 🎯 Pages & Routes

| Route | Component | Auth Required | Purpose |
|-------|-----------|---------------|---------|
| `/` | Redirect to `/dashboard` | Yes | Root path |
| `/login` | Login.jsx | No | Email + OTP login |
| `/verify-otp` | OTPVerification.jsx | No | OTP verification |
| `/dashboard` | Dashboard.jsx | Yes | Main dashboard |
| `/tester` | ApiTester.jsx | Yes | API testing interface |
| `/history` | History.jsx | Yes | Request history |
| `/analytics` | Analytics.jsx | Yes | Analytics dashboard |
| `/*` | 404 redirect | - | Fallback route |

## 📱 Responsive Design

The application is fully responsive:

- **Desktop** (1024px+): Full layout with sidebar
- **Tablet** (768px-1023px): Optimized sidebar and buttons
- **Mobile** (< 768px): Stacked layout with hamburger menu

### Key Responsive Elements

- EmailBackendSelector: Responsive dropdown styling
- Login form: Mobile-optimized input fields
- Navigation: Collapsible menu on mobile
- Tables: Horizontal scroll on small screens

## 🔒 Security Features

✅ **JWT Tokens**: Securely stored in localStorage  
✅ **HTTPS Ready**: Works with HTTPS in production  
✅ **CORS**: Configured per backend  
✅ **Parameterized Requests**: Prevents SQL injection  
✅ **OTP Expiry**: 10-minute validity by default  

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The build output goes to `dist/` directory.

### Deploy to Static Host

```bash
# Build
npm run build

# Upload dist/ folder to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3
# - Azure Static Web Apps
```

### Environment Variables in Production

Update `.env.local` with your production backend URLs:

```env
VITE_EXPRESS_MONGODB_URL=https://api1.yourdomain.com
VITE_DJANGO_MSSQL_URL=https://api2.yourdomain.com
# ... etc
```

## 🐛 Troubleshooting

### OTP Not Received

1. ✅ Check backend is running (correct port)
2. ✅ Check email spam/promotions folder
3. ✅ Verify email credentials in backend .env
4. ✅ Check browser console for error messages
5. ✅ Verify backend logs for email sending errors

### "Backend not available" Error

1. ✅ Verify selected backend is running
2. ✅ Check Network tab in DevTools
3. ✅ Verify port numbers match `.env`
4. ✅ Check CORS configuration in backend
5. ✅ Try selecting a different backend

### Login Page Shows Wrong Backend

1. ✅ Check `localStorage` for 'emailBackend' key
2. ✅ Clear browser cache and localStorage
3. ✅ Check `.env.local` values
4. ✅ Hard refresh page (Ctrl+Shift+R)

### Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf .vite

# Rebuild
npm run build
```

## 📚 API Examples

### Raw Fetch - Send OTP

```javascript
const response = await fetch(
  'http://localhost:5000/api/v1.0/auth/send-otp',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
  }
);
const data = await response.json();
console.log(data);
```

### Raw Fetch - Verify OTP

```javascript
const response = await fetch(
  'http://localhost:5000/api/v1.0/auth/verify-otp',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      otp: '123456'
    })
  }
);
const data = await response.json();
if (data.status) {
  localStorage.setItem('currentToken', data.data.token);
}
```

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vite.dev/guide/)
- [React Router](https://reactrouter.com)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## 📄 License

MIT - See parent README for details

## 🤝 Contributing

When making changes:

1. Test with all 7 backends
2. Verify responsive design on mobile
3. Update documentation if adding features
4. Test with localStorage cleared
5. Check browser console for errors

---

**Made with ❤️ for seamless API interaction**
