// src/api.js
// Centralized backend URL configuration. Vite injects `VITE_API_URL` at build time.
// Set `VITE_API_URL` in Vercel to your backend base (no trailing `/`).
// Example VITE_API_URL=https://evmbackend-n3qk.onrender.com

export const API_URL = import.meta.env.VITE_API_URL ?? "https://evmbackend-n3qk.onrender.com";
export const API_BASE = `${API_URL}/api`;

export default API_URL;