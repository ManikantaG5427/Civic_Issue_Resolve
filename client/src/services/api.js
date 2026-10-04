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
 * Helper to resolve relative uploads/cloud image paths to fully qualified accessible URLs
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  // If already absolute (Cloudinary CDN, data URL, blob, http/https), return directly
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  // Extract backend base origin from VITE_API_BASE_URL (removing /api)
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const serverOrigin = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${serverOrigin}${cleanPath}`;
}

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
  verifyEmail: (data) => apiRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  resendVerification: (data) => apiRequest('/auth/resend-verification', { method: 'POST', body: JSON.stringify(data) }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  googleAuth: (googleData) => apiRequest('/auth/google', { method: 'POST', body: JSON.stringify(googleData) }),
  forgotPassword: (data) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (token, data) => apiRequest(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  refresh: (refreshToken) => apiRequest('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

/**
 * System Configuration API Endpoints
 */
export const configAPI = {
  getCategories: () => apiRequest('/categories'),
  createCategory: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
  getDepartments: () => apiRequest('/departments'),
  createDepartment: (data) => apiRequest('/departments', { method: 'POST', body: JSON.stringify(data) }),
  getServiceAreas: () => apiRequest('/service-areas'),
  createServiceArea: (data) => apiRequest('/service-areas', { method: 'POST', body: JSON.stringify(data) }),
  getConfigSummary: () => apiRequest('/config/summary'),
};

/**
 * Civic Issue Management API Endpoints
 */
export const issueAPI = {
  getIssues: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/issues/public-map${queryString ? `?${queryString}` : ''}`);
  },
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
  provideInfo: (id, data) =>
    apiRequest(`/issues/${id}/provide-info`, { method: 'POST', body: JSON.stringify(data) }),
  confirmResolution: (id, data) =>
    apiRequest(`/issues/${id}/confirm-resolution`, { method: 'POST', body: JSON.stringify(data) }),
  reopenIssue: (id, data) =>
    apiRequest(`/issues/${id}/reopen`, { method: 'POST', body: JSON.stringify(data) }),
  withdrawIssue: (id, data = {}) =>
    apiRequest(`/issues/${id}/withdraw`, { method: 'POST', body: JSON.stringify(data) }),
  deleteIssue: (id) =>
    apiRequest(`/issues/${id}`, { method: 'DELETE' }),
  addComment: (id, data) =>
    apiRequest(`/issues/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  getComments: (id) => apiRequest(`/issues/${id}/comments`),
  getNearbyDuplicates: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/issues/nearby-duplicates${queryString ? `?${queryString}` : ''}`);
  },
  toggleUpvote: (id) => apiRequest(`/issues/${id}/upvote`, { method: 'POST' }),
  toggleFollow: (id) => apiRequest(`/issues/${id}/follow`, { method: 'POST' }),
  getPublicMap: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/issues/public-map${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Administrator & Operational Review API Endpoints
 */
export const adminAPI = {
  getReviewQueue: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/review-queue${queryString ? `?${queryString}` : ''}`);
  },
  getWorkers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/workers${queryString ? `?${queryString}` : ''}`);
  },
  verifyIssue: (id, data) =>
    apiRequest(`/admin/issues/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),
  rejectIssue: (id, data) =>
    apiRequest(`/admin/issues/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  requestInfo: (id, data) =>
    apiRequest(`/admin/issues/${id}/request-info`, { method: 'POST', body: JSON.stringify(data) }),
  assignIssue: (id, data) =>
    apiRequest(`/admin/issues/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  addWorkerToRoster: (id, data) =>
    apiRequest(`/admin/issues/${id}/workers`, { method: 'POST', body: JSON.stringify(data) }),
  removeWorkerFromRoster: (id, workerId) =>
    apiRequest(`/admin/issues/${id}/workers/${workerId}`, { method: 'DELETE' }),
  submitPhaseProof: (id, data) =>
    apiRequest(`/admin/issues/${id}/phase-proof`, { method: 'POST', body: JSON.stringify(data) }),
  triggerSlaCheck: () =>
    apiRequest('/admin/sla/check-escalations', { method: 'POST' }),
  getOverdueIssues: () => apiRequest('/admin/sla/overdue'),
  getPendingApprovals: () => apiRequest('/admin/users/pending-approvals'),
  approveUserRole: (id, data) =>
    apiRequest(`/admin/users/${id}/approve-role`, { method: 'POST', body: JSON.stringify(data) }),
  rejectUserRole: (id) =>
    apiRequest(`/admin/users/${id}/reject-role`, { method: 'POST' }),
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/admin/analytics${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Field Worker Operational API Endpoints
 */
export const workerAPI = {
  getTasks: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/worker/tasks${queryString ? `?${queryString}` : ''}`);
  },
  startWork: (id, data = {}) =>
    apiRequest(`/worker/issues/${id}/start-work`, { method: 'POST', body: JSON.stringify(data) }),
  addProgressUpdate: (id, data) =>
    apiRequest(`/worker/issues/${id}/progress-update`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitPhaseProof: (id, data) =>
    apiRequest(`/admin/issues/${id}/phase-proof`, { method: 'POST', body: JSON.stringify(data) }),
  resolveTask: (id, data) =>
    apiRequest(`/worker/issues/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * In-App Notifications API Endpoints (Queue 15)
 */
export const notificationAPI = {
  getNotifications: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    return apiRequest(`/notifications${queryString ? `?${queryString}` : ''}`);
  },
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
};

/**
 * Evidence & Media Upload API Endpoints
 */
export const uploadAPI = {
  uploadImage: async (file, stage = 'evidence') => {
    const formData = new FormData();
    formData.append('images', file);
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

    const firstItem = Array.isArray(data.data) ? data.data[0] : data.data;
    return {
      success: true,
      data: firstItem,
      raw: data,
    };
  },

  uploadEvidence: async (files, stage = 'initial') => {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];
    for (const file of fileList) {
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

/**
 * Safely format upload image URL for frontend rendering
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.replace(/\/api$/, '');
  return `${base}${cleanPath}`;
};
