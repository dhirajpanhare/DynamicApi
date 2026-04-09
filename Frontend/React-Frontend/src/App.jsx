import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context
import { AuthProvider } from "./context/AuthContext";
import { EmailBackendProvider } from "./context/EmailBackendContext";

// Layout
import Layout from "./components/layout/Layout";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Dashboard from "./pages/Dashboard";
import ApiTester from "./pages/ApiTester";
import History from "./pages/History";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <EmailBackendProvider>
        <AuthProvider>
          <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<OTPVerification />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Default Route */}
                    <Route path="/" element={<Dashboard />} />

                    {/* Main Pages */}
                    <Route path="/tester" element={<ApiTester />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/analytics" element={<Analytics />} />

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </AuthProvider>
      </EmailBackendProvider>
    </BrowserRouter>
  );
}

export default App;