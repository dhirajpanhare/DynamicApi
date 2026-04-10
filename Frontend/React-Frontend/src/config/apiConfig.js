/**
 * API Configuration
 * Centralized configuration for all available backend APIs
 * Supports environment variable overrides for flexibility
 * Supports: Django (MSSQL/MySQL), Express (MongoDB/MSSQL/MySQL), .NET (MSSQL/MySQL)
 */

/**
 * Helper function to get environment variable or fallback value
 */
const getEnv = (key, fallback) => {
  return import.meta.env[`VITE_${key}`] || fallback;
};

export const API_CONFIGS = {
  // .NET Backends
  "dotnet-mssql": {
    name: ".NET + MSSQL",
    type: "dotnet",
    database: "mssql",
    baseURL: getEnv("DOTNET_MSSQL_URL", "http://localhost:5000"),
    port: 5000,
    description: "C# .NET with SQL Server",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  },

  "dotnet-mysql": {
    name: ".NET + MySQL",
    type: "dotnet",
    database: "mysql",
    baseURL: getEnv("DOTNET_MYSQL_URL", "http://localhost:5001"),
    port: 5000,
    description: "C# .NET with MySQL",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  },

  // Django Backends
  "django-mssql": {
    name: "Django + MSSQL",
    type: "django",
    database: "mssql",
    baseURL: getEnv("DJANGO_MSSQL_URL", "http://localhost:8000"),
    port: 8000,
    description: "Python Django with SQL Server",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  },

  "django-mysql": {
    name: "Django + MySQL",
    type: "django",
    database: "mysql",
    baseURL: getEnv("DJANGO_MYSQL_URL", "http://localhost:8001"),
    port: 8001,
    description: "Python Django with MySQL",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  },

  // Express Backends
  "express-mongodb": {
    name: "Express + MongoDB",
    type: "express",
    database: "mongodb",
    baseURL: getEnv("EXPRESS_MONGODB_URL", "http://localhost:3001"),
    port: 3001,
    description: "Node.js Express with MongoDB",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  },

  "express-mssql": {
    name: "Express + MSSQL",
    type: "express",
    database: "mssql",
    baseURL: getEnv("EXPRESS_MSSQL_URL", "http://localhost:3002"),
    port: 3002,
    description: "Node.js Express with SQL Server",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  },

  "express-mysql": {
    name: "Express + MySQL",
    type: "express",
    database: "mysql",
    baseURL: getEnv("EXPRESS_MYSQL_URL", "http://localhost:3003"),
    port: 3003,
    description: "Node.js Express with MySQL",
    endpoints: {
      execute: "/api/v1.0/DynamicApi/DynamicApiExecute",
      procedures: "/api/v1.0/DynamicApi/ListProcedures",
      metadata: "/api/v1.0/DynamicApi/GetProcedureMetadata",
      generatePayload: "/api/v1.0/DynamicApi/GeneratePayload",
      health: "/api/v1.0/DynamicApi/Health"
    }
  }
};

/**
 * Get default API configuration
 * Tries environment variable first, then falls back to .NET MSSQL
 */
export const getDefaultAPI = () => {
  const envAPI = import.meta.env.VITE_API_TYPE || "dotnet-mssql";
  return API_CONFIGS[envAPI] || API_CONFIGS["dotnet-mssql"];
};

/**
 * Get API configuration by ID
 */
export const getAPIConfig = (apiId) => {
  return API_CONFIGS[apiId] || getDefaultAPI();
};

/**
 * Get all available APIs grouped by type
 */
export const getGroupedAPIs = () => {
  const grouped = {
    dotnet: [],
    django: [],
    express: []
  };

  Object.entries(API_CONFIGS).forEach(([id, config]) => {
    grouped[config.type].push({ id, ...config });
  });

  return grouped;
};

/**
 * Get selected API from localStorage or default
 */
export const getSelectedAPI = () => {
  const stored = localStorage.getItem("selectedAPI");
  return stored || "dotnet-mssql";
};

/**
 * Set selected API in localStorage
 */
export const setSelectedAPI = (apiId) => {
  localStorage.setItem("selectedAPI", apiId);
};

/**
 * Get current API config (stored selection or default)
 */
export const getCurrentAPIConfig = () => {
  const selectedId = getSelectedAPI();
  return getAPIConfig(selectedId);
};

/**
 * Check health status of a specific API or current API
 * @param {string} apiId - Optional API ID to check. If not provided, checks current selected API
 */
export const healthCheck = async (apiId = null) => {
  const config = apiId ? getAPIConfig(apiId) : getCurrentAPIConfig();
  const healthURL = `${config.baseURL}${config.endpoints.health}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(healthURL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return { status: true, message: "API is healthy" };
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(`Health check failed: ${error.message}`);
  }
};

/**
 * Convert API_CONFIGS object to array format for easy iteration
 */
export const apiConfigs = Object.entries(API_CONFIGS).map(([id, config]) => ({
  id,
  ...config
}));

export default API_CONFIGS;
