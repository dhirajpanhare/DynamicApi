import { createContext, useState, useCallback } from "react";

/**
 * Email Backend Configuration Context
 * Allows dynamic selection of which backend to use for OTP email service
 * Default: express-mongodb (port 3001)
 */
export const EmailBackendContext = createContext();

export const EmailBackendProvider = ({ children }) => {
  // Get initial backend from localStorage or default
  const getInitialBackend = () => {
    const saved = localStorage.getItem("emailBackend");
    if (saved) return saved;
    
    // Try to read from import.meta.env if available
    const envBackend = import.meta.env.VITE_EMAIL_BACKEND_TYPE;
    if (envBackend) return envBackend;
    
    return "express-mongodb"; // Default fallback
  };

  const [emailBackend, setEmailBackendState] = useState(getInitialBackend());

  // Define available backends
  const backends = {
    "express-mongodb": { name: "Express + MongoDB", port: 3001, url: "http://localhost:3001" },
    "express-mssql": { name: "Express + MSSQL", port: 3002, url: "http://localhost:3002" },
    "express-mysql": { name: "Express + MySQL", port: 3003, url: "http://localhost:3003" },
    "django-mssql": { name: "Django + MSSQL", port: 8000, url: "http://localhost:8000" },
    "django-mysql": { name: "Django + MySQL", port: 8001, url: "http://localhost:8001" },
    "dotnet-mssql": { name: ".NET + MSSQL", port: 5000, url: "http://localhost:5000" },
    "dotnet-mysql": { name: ".NET + MySQL", port: 5001, url: "http://localhost:5001" },
  };

  const setEmailBackend = useCallback((backendId) => {
    if (backends[backendId]) {
      setEmailBackendState(backendId);
      localStorage.setItem("emailBackend", backendId);
      console.log(`📧 Email backend switched to: ${backends[backendId].name} (${backendId})`);
    }
  }, [backends]);

  const getCurrentBackendUrl = useCallback(() => {
    return backends[emailBackend]?.url || "http://localhost:3001";
  }, [emailBackend, backends]);

  const getCurrentBackendName = useCallback(() => {
    return backends[emailBackend]?.name || "Express + MongoDB";
  }, [emailBackend, backends]);

  return (
    <EmailBackendContext.Provider
      value={{
        emailBackend,
        setEmailBackend,
        backends,
        getCurrentBackendUrl,
        getCurrentBackendName,
      }}
    >
      {children}
    </EmailBackendContext.Provider>
  );
};
