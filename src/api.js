// src/api.js
// ==========================================
// Production-safe backend URL configuration
// Works for:
// ✅ Vercel Production
// ✅ Local Development
// ✅ Render Backend
// ==========================================

// Vercel injects VITE_API_URL at build time
// Example:
// VITE_API_URL=https://evmbackend-n3qk.onrender.com

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

// Main API base
export const API_BASE = `${API_URL}/api`;

// Auth endpoints
export const AUTH_API = {
  LOGIN: `${API_BASE}/auth/login`,
  REGISTER: `${API_BASE}/auth/register`,
  SEND_OTP: `${API_BASE}/auth/otp/send`,
  VERIFY_OTP: `${API_BASE}/auth/otp/verify`,
  REFRESH: `${API_BASE}/auth/refresh`,
  ME: `${API_BASE}/auth/me`,
};

// Google OAuth
export const GOOGLE_AUTH_URL = `${API_URL}/oauth2/authorization/google`;

// Default export
export default API_URL;