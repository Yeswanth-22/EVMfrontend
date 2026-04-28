import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../api";

/**
 * FINAL FIXED API CONFIG
 * Backend:
 * https://evmbackend-n3qk.onrender.com
 */
const API_BASE = "https://evmbackend-n3qk.onrender.com/api";
const AUTH_BASE = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;

console.log("API_BASE =", API_BASE);

const AUTH_STORAGE_KEY = "ems_auth_v2";
const TOKEN_REFRESH_THRESHOLD = 60000;

export const AuthContext = createContext({});

/* =========================
   STORAGE HELPERS
========================= */

const readAuth = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return { token: null, user: null };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      token: parsed?.token || null,
      user: parsed?.user || null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const writeAuth = (token, user) => {
  if (!token || !user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token, user })
  );
};

const asFailure = (message) => ({
  success: false,
  message,
  data: null,
});

/* =========================
   AUTH PROVIDER
========================= */

export const AuthProvider = ({ children }) => {
  const auth = readAuth();

  const [token, setToken] = useState(auth.token);
  const [currentUser, setCurrentUser] = useState(auth.user);

  const refreshTimerRef = useRef(null);

  /* =========================
     GENERIC REQUEST
  ========================= */

  const request = useCallback(
    async (path, options = {}, explicitToken) => {
      const activeToken = explicitToken ?? token;

      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      try {
        const response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
        });

        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          return asFailure(
            payload?.message ||
              `Request failed with status ${response.status}.`
          );
        }

        if (!payload) {
          return asFailure("Invalid server response.");
        }

        return payload;
      } catch (error) {
        console.error("request error:", error);

        return asFailure(
          "Unable to connect to backend. Please check server connection."
        );
      }
    },
    [token]
  );

  /* =========================
     REGISTER
  ========================= */

  const register = async (userData) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  };

  /* =========================
     SEND OTP
     CORRECT:
     /api/auth/otp/send
  ========================= */

  const sendRegistrationOtp = async (email) => {
    return request("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  /* =========================
     VERIFY OTP
     CORRECT:
     /api/auth/otp/verify
  ========================= */

  const verifyRegistrationOtp = async (email, otp) => {
    return request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  };

  /* =========================
     LOGIN
  ========================= */

  const login = async (email, password) => {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!result.success || !result.data?.token) {
      return asFailure(result.message || "Login failed.");
    }

    setToken(result.data.token);
    setCurrentUser(result.data.user);

    return {
      success: true,
      message: result.message || "Login successful.",
      user: result.data.user,
      token: result.data.token,
    };
  };

  /* =========================
     GOOGLE LOGIN
  ========================= */

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    setToken(null);
    setCurrentUser(null);

    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  /* =========================
     CURRENT USER
  ========================= */

  useEffect(() => {
    writeAuth(token, currentUser);
  }, [token, currentUser]);

  /* =========================
     CONTEXT VALUE
  ========================= */

  const value = useMemo(
    () => ({
      currentUser,
      token,

      register,
      sendRegistrationOtp,
      verifyRegistrationOtp,

      login,
      loginWithGoogle,
      logout,
    }),
    [currentUser, token]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};