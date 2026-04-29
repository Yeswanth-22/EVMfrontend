import axios from "axios";
import { API_BASE } from "./api";

// ==========================================
// Production-safe Axios client for localhost, Vercel, Railway, and JWT auth.
// ==========================================

const apiClient = axios.create({
  baseURL: API_BASE,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Required for secure session cookies when the backend sends them.
  withCredentials: true,

  // Prevent hanging requests
  timeout: 30000,
});

// ==========================================
// REQUEST INTERCEPTOR
// Automatically attach JWT token
// ==========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// Auto-handle expired token / auth issues
// ==========================================
apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      // Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem("token");
      }

      // Forbidden
      if (error.response.status === 403) {
        console.error("Access denied.");
      }

      // Server error
      if (error.response.status >= 500) {
        console.error("Server error. Please try again later.");
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
