import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, API_BASE } from "../api";

const AUTH_STORAGE_KEY = "ems_auth_v2";
const TOKEN_REFRESH_THRESHOLD = 60000; // 1 min before expiry

const asFailure = (message) => ({
  success: false,
  message,
  data: null,
});

export const AuthContext = createContext({});

// ==============================
// Local Storage Helpers
// ==============================
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
    JSON.stringify({
      token,
      user,
    })
  );
};

// ==============================
// Provider
// ==============================
export const AuthProvider = ({ children }) => {
  const auth = readAuth();

  const [token, setToken] = useState(auth.token);
  const [currentUser, setCurrentUser] = useState(auth.user);

  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [fraudReports, setFraudReports] = useState([]);
  const [analystReports, setAnalystReports] = useState([]);
  const [electionResults, setElectionResults] = useState([]);

  const refreshTimerRef = useRef(null);

  // ==============================
  // Token Refresh
  // ==============================
  const refreshTokenInternal = useCallback(async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        credentials: "include",
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload) {
        return null;
      }

      return payload;
    } catch (err) {
      console.error("refreshTokenInternal error", err);
      return null;
    }
  }, []);

  const setupTokenRefresh = useCallback(
    (activeToken) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      if (!activeToken) {
        return;
      }

      try {
        const parts = activeToken.split(".");

        if (parts.length !== 3) {
          return;
        }

        const decoded = JSON.parse(atob(parts[1]));

        const expiresAt = decoded?.exp ? decoded.exp * 1000 : 0;

        const expiresIn = expiresAt - Date.now();

        if (expiresIn <= 0) {
          logout();
          return;
        }

        const refreshIn = Math.max(
          expiresIn - TOKEN_REFRESH_THRESHOLD,
          1000
        );

        refreshTimerRef.current = setTimeout(async () => {
          const refreshed = await refreshTokenInternal(activeToken);

          if (refreshed?.data?.token) {
            setToken(refreshed.data.token);
            setupTokenRefresh(refreshed.data.token);
          } else {
            logout();
          }
        }, refreshIn);
      } catch (err) {
        console.error("setupTokenRefresh error", err);
      }
    },
    [refreshTokenInternal]
  );

  // ==============================
  // Core Request
  // ==============================
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
        const res = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
          credentials: "include",
        });

        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 401) {
            logout();
          }

          return asFailure(
            payload?.message || `Request failed (${res.status})`
          );
        }

        if (!payload) {
          return asFailure("Invalid server response.");
        }

        return payload;
      } catch (err) {
        console.error("API request error", err);

        return asFailure(
          "Unable to connect to backend. Please check server connection."
        );
      }
    },
    [token]
  );

  // ==============================
  // Helpers
  // ==============================
  const resolveList = (res) => {
    if (!res) return [];
    if (res.success && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  };

  // ==============================
  // Dashboard Data
  // ==============================
  const loadAllData = useCallback(
    async (authToken) => {
      const activeToken = authToken ?? token;

      if (!activeToken) {
        return;
      }

      const [
        usersRes,
        incidentsRes,
        fraudRes,
        analystRes,
        electionRes,
      ] = await Promise.all([
        request("/admin/users", {}, activeToken),
        request("/admin/incidents", {}, activeToken),
        request("/admin/fraud-reports", {}, activeToken),
        request("/admin/analyst-reports", {}, activeToken),
        request("/admin/election-results", {}, activeToken),
      ]);

      setUsers(resolveList(usersRes));
      setIncidents(resolveList(incidentsRes));
      setFraudReports(resolveList(fraudRes));
      setAnalystReports(resolveList(analystRes));
      setElectionResults(resolveList(electionRes));
    },
    [request, token]
  );

  // ==============================
  // Persist Auth
  // ==============================
  useEffect(() => {
    writeAuth(token, currentUser);
  }, [token, currentUser]);

  // ==============================
  // Bootstrap
  // ==============================
  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        return;
      }

      const me = await request("/auth/me");

      if (!me.success) {
        logout();
        return;
      }

      setCurrentUser(me.data);

      await loadAllData(token);

      setupTokenRefresh(token);
    };

    bootstrap();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, request, loadAllData, setupTokenRefresh]);

  // ==============================
  // AUTH METHODS
  // ==============================
  const register = async (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

  const sendRegistrationOtp = async (email) =>
    request("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

  const verifyRegistrationOtp = async (email, otp) =>
    request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

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

    await loadAllData(result.data.token);

    setupTokenRefresh(result.data.token);

    return {
      success: true,
      message: result.message || "Login successful.",
      user: result.data.user,
      token: result.data.token,
    };
  };

  const logout = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    setToken(null);
    setCurrentUser(null);

    setUsers([]);
    setIncidents([]);
    setFraudReports([]);
    setAnalystReports([]);
    setElectionResults([]);

    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // ==============================
  // Dashboard Stats
  // ==============================
  const dashboardStats = useMemo(
    () => ({
      users: users.length,
      incidents: incidents.length,
      fraudReports: fraudReports.length,
      analystReports: analystReports.length,
      electionResults: electionResults.length,
    }),
    [
      users.length,
      incidents.length,
      fraudReports.length,
      analystReports.length,
      electionResults.length,
    ]
  );

  // ==============================
  // Context Value
  // ==============================
  const value = useMemo(
    () => ({
      API_URL,
      token,
      currentUser,
      users,
      incidents,
      fraudReports,
      analystReports,
      electionResults,
      dashboardStats,

      register,
      sendRegistrationOtp,
      verifyRegistrationOtp,
      login,
      logout,
    }),
    [
      token,
      currentUser,
      users,
      incidents,
      fraudReports,
      analystReports,
      electionResults,
      dashboardStats,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
