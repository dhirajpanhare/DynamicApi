/**
 * localStorage Utilities
 * Manages user-specific data storage without database
 * Supports: profile, API history, and analytics per user and framework
 */

/**
 * Get the current user's storage key
 */
export const getUserStorageKey = (email) => {
  return `user_${email}`;
};

/**
 * Get user storage object
 */
export const getUserStorage = (email) => {
  try {
    const key = getUserStorageKey(email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading user storage:", error);
    return null;
  }
};

/**
 * Save user storage object
 */
export const saveUserStorage = (email, data) => {
  try {
    const key = getUserStorageKey(email);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving user storage:", error);
    return false;
  }
};

/**
 * Add API call to user's history for a specific framework
 */
export const addApiHistory = (email, framework, historyItem) => {
  const storage = getUserStorage(email);
  if (!storage) return false;

  if (!storage.apiHistory) {
    storage.apiHistory = {};
  }

  if (!storage.apiHistory[framework]) {
    storage.apiHistory[framework] = [];
  }

  const item = {
    id: `history_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...historyItem,
  };

  storage.apiHistory[framework].unshift(item); // Add to beginning

  // Keep only last 100 items per framework
  if (storage.apiHistory[framework].length > 100) {
    storage.apiHistory[framework] = storage.apiHistory[framework].slice(
      0,
      100
    );
  }

  return saveUserStorage(email, storage);
};

/**
 * Get API history for a specific framework
 */
export const getApiHistory = (email, framework) => {
  const storage = getUserStorage(email);
  if (!storage || !storage.apiHistory) return [];
  return storage.apiHistory[framework] || [];
};

/**
 * Get all API history for all frameworks
 */
export const getAllApiHistory = (email) => {
  const storage = getUserStorage(email);
  if (!storage || !storage.apiHistory) return {};
  return storage.apiHistory;
};

/**
 * Clear API history for a specific framework
 */
export const clearApiHistory = (email, framework) => {
  const storage = getUserStorage(email);
  if (!storage) return false;

  if (storage.apiHistory && storage.apiHistory[framework]) {
    delete storage.apiHistory[framework];
  }

  return saveUserStorage(email, storage);
};

/**
 * Update API analytics for a framework
 */
export const updateAnalytics = (email, framework, stats) => {
  const storage = getUserStorage(email);
  if (!storage) return false;

  if (!storage.analytics) {
    storage.analytics = {};
  }

  if (!storage.analytics[framework]) {
    storage.analytics[framework] = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      avgResponseTime: 0,
      lastUpdated: null,
      frameworks: {},
    };
  }

  // Update stats
  const analytics = storage.analytics[framework];
  analytics.totalCalls = (analytics.totalCalls || 0) + (stats.totalCalls || 0);
  analytics.successCalls =
    (analytics.successCalls || 0) + (stats.successCalls || 0);
  analytics.failedCalls =
    (analytics.failedCalls || 0) + (stats.failedCalls || 0);

  if (stats.avgResponseTime !== undefined) {
    const total =
      (analytics.avgResponseTime || 0) * analytics.totalCalls +
      stats.avgResponseTime;
    analytics.avgResponseTime = total / analytics.totalCalls;
  }

  analytics.lastUpdated = new Date().toISOString();

  return saveUserStorage(email, storage);
};

/**
 * Get analytics for a specific framework
 */
export const getAnalytics = (email, framework) => {
  const storage = getUserStorage(email);
  if (!storage || !storage.analytics) return null;
  return storage.analytics[framework] || null;
};

/**
 * Get all analytics
 */
export const getAllAnalytics = (email) => {
  const storage = getUserStorage(email);
  if (!storage || !storage.analytics) return {};
  return storage.analytics;
};

/**
 * Get user profile
 */
export const getUserProfile = (email) => {
  const storage = getUserStorage(email);
  if (!storage || !storage.profile) return null;
  return storage.profile;
};

/**
 * Update user profile
 */
export const updateUserProfile = (email, profileData) => {
  const storage = getUserStorage(email);
  if (!storage) return false;

  storage.profile = {
    ...storage.profile,
    ...profileData,
    lastUpdated: new Date().toISOString(),
  };

  return saveUserStorage(email, storage);
};

/**
 * Delete all user data
 */
export const deleteUserData = (email) => {
  try {
    const key = getUserStorageKey(email);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("Error deleting user data:", error);
    return false;
  }
};

/**
 * Get summary statistics for all frameworks
 */
export const getSummaryStats = (email) => {
  const allHistory = getAllApiHistory(email);
  const allAnalytics = getAllAnalytics(email);

  const summary = {
    totalFrameworks: Object.keys(allAnalytics || {}).length,
    totalApiCalls: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    frameworks: {},
  };

  Object.entries(allAnalytics || {}).forEach(([framework, stats]) => {
    summary.totalApiCalls += stats.totalCalls || 0;
    summary.totalSuccessful += stats.successCalls || 0;
    summary.totalFailed += stats.failedCalls || 0;

    summary.frameworks[framework] = {
      totalCalls: stats.totalCalls || 0,
      successRate:
        stats.totalCalls > 0
          ? ((stats.successCalls || 0) / stats.totalCalls) * 100
          : 0,
      avgResponseTime: stats.avgResponseTime || 0,
      historyCount: (allHistory[framework] || []).length,
    };
  });

  return summary;
};

/**
 * Export user data as JSON
 */
export const exportUserData = (email) => {
  const storage = getUserStorage(email);
  if (!storage) return null;

  return {
    exported: new Date().toISOString(),
    email: email,
    data: storage,
  };
};

/**
 * Import user data from JSON
 */
export const importUserData = (email, importedData) => {
  try {
    if (!importedData || !importedData.data) {
      throw new Error("Invalid import data format");
    }

    return saveUserStorage(email, importedData.data);
  } catch (error) {
    console.error("Error importing user data:", error);
    return false;
  }
};
