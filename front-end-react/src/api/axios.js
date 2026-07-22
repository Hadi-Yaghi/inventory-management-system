import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = localStorage.getItem('accessToken');

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => {
  return accessToken;
};

// Request interceptor to attach token and active store context header
api.interceptors.request.use(
  (config) => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeStoreStr = localStorage.getItem('activeStore');
    if (activeStoreStr) {
      try {
        const activeStore = JSON.parse(activeStoreStr);
        if (activeStore && activeStore.id) {
          config.headers['X-Active-Store-ID'] = activeStore.id;
        }
      } catch (e) {
        // ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for generic error handling / 401 redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Optional: implement silent refresh here using the refresh token stored in localStorage
    // If we get 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                             originalRequest.url?.includes('/auth/register') || 
                             originalRequest.url?.includes('/auth/google') || 
                             originalRequest.url?.includes('/auth/accept-invitation');
      if (!isAuthEndpoint) {
        window.dispatchEvent(new Event('unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
