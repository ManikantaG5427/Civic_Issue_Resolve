const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get stored tokens
 */
export const getStoredToken = () => localStorage.getItem('civic_access_token');
export const getStoredRefreshToken = () => localStorage.getItem('civic_refresh_token');

export const setStoredTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('civic_access_token', accessToken);
  if (refreshToken) localStorage.setItem('civic_refresh_token', refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem('civic_access_token');
  localStorage.removeItem('civic_refresh_token');
  localStorage.removeItem('civic_user');
};

/**
 * Utility wrapper for standard API fetch requests with token injection and auto-refresh
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // If access token expired and we have a refresh token, attempt one-time refresh
    if (response.status === 401 && getStoredRefreshToken() && !options._isRetry) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getStoredRefreshToken() }),
        });

        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && refreshData.data?.accessToken) {
          setStoredTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

          // Retry original request with new token
          return apiRequest(endpoint, {
            ...options,
            _isRetry: true,
            headers: {
              ...headers,
              Authorization: `Bearer ${refreshData.data.accessToken}`,
            },
          });
        }
      } catch {
        clearStoredTokens();
        window.dispatchEvent(new Event('auth:expired'));
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      error.errors = data.errors || null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] Request to ${url} failed:`, error);
    throw error;
  }
}

/**
 * Check backend system health
 */
export async function checkBackendHealth() {
  return apiRequest('/health');
}

/**
 * Auth API Endpoints
 */
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  refresh: (refreshToken) => apiRequest('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

/**
 * System Configuration API Endpoints
 */
export const configAPI = {
  getCategories: () => apiRequest('/categories'),
  getDepartments: () => apiRequest('/departments'),
  getServiceAreas: () => apiRequest('/service-areas'),
  getConfigSummary: () => apiRequest('/config/summary'),
};

/**
 * Civic Issue Management API Endpoints
 */
export const issueAPI = {
  createIssue: (data) => apiRequest('/issues', { method: 'POST', body: JSON.stringify(data) }),
  getIssueById: (id) => apiRequest(`/issues/${id}`),
  getMyReports: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/issues/my-reports${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Evidence & Media Upload API Endpoints
 */
export const uploadAPI = {
  uploadEvidence: async (files, stage = 'initial') => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    formData.append('stage', stage);

    const token = getStoredToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/uploads/evidence`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'File upload failed');
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data;
  },
};
