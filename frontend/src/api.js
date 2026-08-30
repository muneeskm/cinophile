import axios from 'axios';

// Pulls from Vercel Config or REACT_APP variable, falling back to local server during dev
const BACKEND_BASE = 
  process.env.REACT_APP_BACKEND_URL || 
  process.env.BACKEND_URL || 
  'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BACKEND_BASE}/api/`,
});

// Interceptor 1: Attach JWT Access Token (uses key 'token' matching AuthContext)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Handle 401 errors & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');

      if (refreshToken && refreshToken !== 'undefined') {
        try {
          const res = await axios.post(`${BACKEND_BASE}/api/token/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;