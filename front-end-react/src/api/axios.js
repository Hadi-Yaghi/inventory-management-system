import axios from 'axios';

// Base API instance
const api = axios.create({
  baseURL: 'http://localhost:8080', // Replace with dynamic env variable if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// We keep the access token in memory
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
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
      // Ideally call a refresh token endpoint here.
      // For now, if unauthorized, we can just reject or trigger a global logout
      // by dispatching a custom event
      window.dispatchEvent(new Event('unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
