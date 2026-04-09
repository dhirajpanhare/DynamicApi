import axios from "axios";
import { getCurrentAPIConfig } from "../config/apiConfig";

/**
 * Get the current API client with configured base URL
 */
const getApiClient = () => {
  const apiConfig = getCurrentAPIConfig();
  console.log("[API] Using API:", apiConfig.name, "URL:", apiConfig.baseURL);

  return axios.create({
    baseURL: apiConfig.baseURL,
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 30000
  });
};

// Add response interceptor for better error handling
const setupInterceptors = (client) => {
  client.interceptors.response.use(
    response => response,
    error => {
      if (error.message === 'Network Error' || !error.response) {
        const apiConfig = getCurrentAPIConfig();
        console.error("[API ERROR] Network connectivity issue:", {
          message: error.message,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          code: error.code
        });
        throw new Error(`Network Error: Cannot reach ${apiConfig.name} at ${apiConfig.baseURL}. Ensure the backend is running.`);
      }
      return Promise.reject(error);
    }
  );
};

// Execute Dynamic API
export const executeDynamicApi = async (procedureName, stringOne = "", stringTwo = "|", stringThree = "=") => {
  try {
    const apiClient = getApiClient();
    setupInterceptors(apiClient);

    const apiConfig = getCurrentAPIConfig();
    const response = await apiClient.post(apiConfig.endpoints.execute, {
      stringOne,
      stringTwo,
      stringThree,
      stringFour: procedureName
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "API execution failed");
  }
};

// Generate Payload from Procedure Definition
export const generatePayload = async (procedureDefinition) => {
  try {
    const apiClient = getApiClient();
    setupInterceptors(apiClient);

    const apiConfig = getCurrentAPIConfig();
    const response = await apiClient.post(apiConfig.endpoints.generatePayload, {
      procedureDefinition
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Payload generation failed");
  }
};

// Get Procedure Metadata
export const getProcedureMetadata = async (procedureName) => {
  try {
    const apiClient = getApiClient();
    setupInterceptors(apiClient);

    const apiConfig = getCurrentAPIConfig();
    const response = await apiClient.get(`${apiConfig.endpoints.metadata}/${procedureName}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch metadata");
  }
};

// List All Procedures
export const listProcedures = async () => {
  try {
    const apiClient = getApiClient();
    setupInterceptors(apiClient);

    const apiConfig = getCurrentAPIConfig();
    const response = await apiClient.get(apiConfig.endpoints.procedures);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to list procedures");
  }
};

// Health Check
export const healthCheck = async () => {
  try {
    const apiClient = getApiClient();
    setupInterceptors(apiClient);

    const apiConfig = getCurrentAPIConfig();
    const response = await apiClient.get(apiConfig.endpoints.health);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Health check failed");
  }
};
