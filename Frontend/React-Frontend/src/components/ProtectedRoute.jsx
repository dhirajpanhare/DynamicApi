import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * ProtectedRoute Component
 * Redirects unauthenticated users to login page
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            ⏳
          </div>
          <p style={{ margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
