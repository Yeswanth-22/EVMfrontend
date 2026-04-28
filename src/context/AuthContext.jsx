import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../api";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || `${API_URL}/api`).replace(/\/$/, "");
const AUTH_BASE = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;
const AUTH_STORAGE_KEY = "ems_auth_v2";
const TOKEN_REFRESH_THRESHOLD = 60000; // Refresh token 1 minute before expiry

export const AuthContext = createContext({
  users: [],
  currentUser: null,
  incidents: [],
  fraudReports: [],
  analystReports: [],
  electionResults: [],
  dashboardStats: {
    users: 0,
    incidents: 0,
    fraudReports: 0,
    analystReports: 0,
    electionResults: 0,
  },
  register: async () => ({ success: false, message: "Auth provider unavailable." }),
  sendRegistrationOtp: async () => ({ success: false, message: "Auth provider unavailable." }),
  verifyRegistrationOtp: async () => ({ success: false, message: "Auth provider unavailable." }),
  login: async () => ({ success: false, message: "Auth provider unavailable." }),
  loginWithGoogle: () => {},
  completeOAuthLogin: async () => ({ success: false, message: "Auth provider unavailable." }),
  logout: () => {},
  createUser: async () => ({ success: false, message: "Auth provider unavailable." }),
  updateUser: async () => ({ success: false, message: "Auth provider unavailable." }),
  deleteUser: async () => ({ success: false, message: "Auth provider unavailable." }),
  createIncident: async () => ({ success: false, message: "Auth provider unavailable." }),
  updateIncident: async () => ({ success: false, message: "Auth provider unavailable." }),
  deleteIncident: async () => ({ success: false, message: "Auth provider unavailable." }),
  createFraudReport: async () => ({ success: false, message: "Auth provider unavailable." }),
  updateFraudReport: async () => ({ success: false, message: "Auth provider unavailable." }),
  deleteFraudReport: async () => ({ success: false, message: "Auth provider unavailable." }),
  createAnalystReport: async () => ({ success: false, message: "Auth provider unavailable." }),
  updateAnalystReport: async () => ({ success: false, message: "Auth provider unavailable." }),
  deleteAnalystReport: async () => ({ success: false, message: "Auth provider unavailable." }),
  createElectionResult: async () => ({ success: false, message: "Auth provider unavailable." }),
  updateElectionResult: async () => ({ success: false, message: "Auth provider unavailable." }),
  deleteElectionResult: async () => ({ success: false, message: "Auth provider unavailable." }),
  uploadElectionData: async () => ({ success: false, message: "Auth provider unavailable." }),
});

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

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
};

const asFailure = (message) => ({ success: false, message, data: null });

// Decode JWT without verification (client-side only)
const decodeToken = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};

const getTokenExpiresIn = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  return decoded.exp * 1000 - Date.now();
};

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

  useEffect(() => {
    writeAuth(token, currentUser);
  }, [token, currentUser]);

  // Refresh token automatically before expiry
  const setupTokenRefresh = useCallback(
    (activeToken) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      if (!activeToken) return;

      const expiresIn = getTokenExpiresIn(activeToken);
      if (expiresIn <= 0) {
        setToken(null);
        setCurrentUser(null);
        return;
      }

      const refreshIn = Math.max(expiresIn - TOKEN_REFRESH_THRESHOLD, 1000);
      refreshTimerRef.current = setTimeout(async () => {
        const refreshResult = await refreshTokenInternal(activeToken);
        if (refreshResult && refreshResult.data?.token) {
          setToken(refreshResult.data.token);
          setupTokenRefresh(refreshResult.data.token);
        } else {
          setToken(null);
          setCurrentUser(null);
        }
      }, refreshIn);
    },
    []
  );

  const refreshTokenInternal = useCallback(
    async (activeToken) => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          return null;
        }

        return payload;
      } catch (error) {
        console.error("refreshTokenInternal error:", error);
        return null;
      }
    },
    []
  );

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
          const message = payload?.message || `Request failed with status ${response.status}.`;
          if (response.status === 401) {
            setToken(null);
            setCurrentUser(null);
          }
          return asFailure(message);
        }

        if (!payload) {
          return asFailure("Invalid server response.");
        }

        return payload;
      } catch (error) {
        console.error("request error:", error);
        return asFailure(error?.response?.data?.message || "Unable to connect to backend. Please check server connection.");
      }
    },
    [token]
  );

  const uploadFormData = useCallback(
    async (path, formData, explicitToken) => {
      const activeToken = explicitToken ?? token;
      const headers = {};
      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      try {
        const response = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          body: formData,
          headers,
        });
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const message = payload?.message || `Request failed with status ${response.status}.`;
          if (response.status === 401) {
            setToken(null);
            setCurrentUser(null);
          }
          return asFailure(message);
        }

        if (!payload) {
          return asFailure("Invalid server response.");
        }

        return payload;
      } catch (error) {
        console.error("uploadFormData error:", error);
        return asFailure(error?.response?.data?.message || "Unable to connect to backend. Please check server connection.");
      }
    },
    [token]
  );

  const loadAllData = useCallback(
    async (authToken) => {
      const activeToken = authToken ?? token;
      if (!activeToken) {
        setUsers([]);
        setIncidents([]);
        setFraudReports([]);
        setAnalystReports([]);
        setElectionResults([]);
        return;
      }

      const [usersRes, incidentsRes, fraudRes, analystRes, electionRes] = await Promise.all([
        request("/admin/users", {}, activeToken),
        request("/admin/incidents", {}, activeToken),
        request("/admin/fraud-reports", {}, activeToken),
        request("/admin/analyst-reports", {}, activeToken),
        request("/admin/election-results", {}, activeToken),
      ]);

      setUsers(usersRes.success && Array.isArray(usersRes.data) ? usersRes.data : []);
      setIncidents(incidentsRes.success && Array.isArray(incidentsRes.data) ? incidentsRes.data : []);
      setFraudReports(fraudRes.success && Array.isArray(fraudRes.data) ? fraudRes.data : []);
      setAnalystReports(analystRes.success && Array.isArray(analystRes.data) ? analystRes.data : []);
      setElectionResults(electionRes.success && Array.isArray(electionRes.data) ? electionRes.data : []);
    },
    [request, token]
  );

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        setToken(null);
        setCurrentUser(null);
        return;
      }

      const meResult = await request("/auth/me");
      if (!meResult.success) {
        setToken(null);
        setCurrentUser(null);
        return;
      }

      setCurrentUser(meResult.data);
      await loadAllData(token);
      setupTokenRefresh(token);
    };

    bootstrap();

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [loadAllData, request, token, setupTokenRefresh]);

  const register = async (userData) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  };

  const sendRegistrationOtp = async (email) => {
    return request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const verifyRegistrationOtp = async (email, otp) => {
    return request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  };

  const login = async (email, password) => {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!result.success || !result.data?.token || !result.data?.user) {
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

  const loginWithGoogle = () => {
    // Use centralized API_URL and redirect to backend OAuth endpoint
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  const completeOAuthLogin = async (oauthToken) => {
    if (!oauthToken) {
      return asFailure("Google login failed. Missing token.");
    }

    const meResult = await request("/auth/me", {}, oauthToken);
    if (!meResult.success || !meResult.data) {
      return asFailure(meResult.message || "Google login failed.");
    }

    setToken(oauthToken);
    setCurrentUser(meResult.data);
    await loadAllData(oauthToken);
    setupTokenRefresh(oauthToken);

    return {
      success: true,
      message: "Google login successful.",
      user: meResult.data,
      token: oauthToken,
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
  };

  const createUser = async (payload) => {
    const result = await request("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.success) {
      setUsers((prev) => [...prev, result.data]);
    }
    return result;
  };

  const updateUser = async (userId, updates) => {
    const result = await request(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (result.success) {
      setUsers((prev) => prev.map((item) => (item.id === userId ? result.data : item)));
      if (currentUser?.id === userId) {
        setCurrentUser(result.data);
      }
    }

    return result;
  };

  const deleteUser = async (userId) => {
    const result = await request(`/admin/users/${userId}`, { method: "DELETE" });
    if (result.success) {
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    }
    return result;
  };

  const createIncident = async (payload) => {
    const result = await request("/admin/incidents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.success) {
      setIncidents((prev) => [result.data, ...prev]);
    }
    return result;
  };

  const updateIncident = async (incidentId, updates) => {
    const result = await request(`/admin/incidents/${incidentId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (result.success) {
      setIncidents((prev) => prev.map((item) => (item.id === incidentId ? result.data : item)));
    }
    return result;
  };

  const deleteIncident = async (incidentId) => {
    const result = await request(`/admin/incidents/${incidentId}`, { method: "DELETE" });
    if (result.success) {
      setIncidents((prev) => prev.filter((item) => item.id !== incidentId));
    }
    return result;
  };

  const createFraudReport = async (payload) => {
    const result = await request("/admin/fraud-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.success) {
      setFraudReports((prev) => [result.data, ...prev]);
    }
    return result;
  };

  const updateFraudReport = async (reportId, updates) => {
    const result = await request(`/admin/fraud-reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (result.success) {
      setFraudReports((prev) => prev.map((item) => (item.id === reportId ? result.data : item)));
    }
    return result;
  };

  const deleteFraudReport = async (reportId) => {
    const result = await request(`/admin/fraud-reports/${reportId}`, { method: "DELETE" });
    if (result.success) {
      setFraudReports((prev) => prev.filter((item) => item.id !== reportId));
    }
    return result;
  };

  const createAnalystReport = async (payload) => {
    const result = await request("/admin/analyst-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.success) {
      setAnalystReports((prev) => [result.data, ...prev]);
    }
    return result;
  };

  const updateAnalystReport = async (reportId, updates) => {
    const result = await request(`/admin/analyst-reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (result.success) {
      setAnalystReports((prev) => prev.map((item) => (item.id === reportId ? result.data : item)));
    }
    return result;
  };

  const deleteAnalystReport = async (reportId) => {
    const result = await request(`/admin/analyst-reports/${reportId}`, { method: "DELETE" });
    if (result.success) {
      setAnalystReports((prev) => prev.filter((item) => item.id !== reportId));
    }
    return result;
  };

  const createElectionResult = async (payload) => {
    const result = await request("/admin/election-results", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.success) {
      setElectionResults((prev) => [result.data, ...prev]);
    }
    return result;
  };

  const updateElectionResult = async (resultId, updates) => {
    const result = await request(`/admin/election-results/${resultId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    if (result.success) {
      setElectionResults((prev) => prev.map((item) => (item.id === resultId ? result.data : item)));
    }
    return result;
  };

  const deleteElectionResult = async (resultId) => {
    const result = await request(`/admin/election-results/${resultId}`, { method: "DELETE" });
    if (result.success) {
      setElectionResults((prev) => prev.filter((item) => item.id !== resultId));
    }
    return result;
  };

  const uploadElectionData = async (file) => {
    if (!file) {
      return asFailure("No file selected for upload.");
    }

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadFormData("/election-results/bulk-upload", formData);
    if (result.success) {
      await loadAllData(token);
    }
    return result;
  };

  const dashboardStats = useMemo(
    () => ({
      users: users.length,
      incidents: incidents.length,
      fraudReports: fraudReports.length,
      analystReports: analystReports.length,
      electionResults: electionResults.length,
    }),
    [users.length, incidents.length, fraudReports.length, analystReports.length, electionResults.length]
  );

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        incidents,
        fraudReports,
        analystReports,
        electionResults,
        dashboardStats,
        register,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        login,
        loginWithGoogle,
        completeOAuthLogin,
        logout,
        createUser,
        updateUser,
        deleteUser,
        createIncident,
        updateIncident,
        deleteIncident,
        createFraudReport,
        updateFraudReport,
        deleteFraudReport,
        createAnalystReport,
        updateAnalystReport,
        deleteAnalystReport,
        createElectionResult,
        updateElectionResult,
        deleteElectionResult,
        uploadElectionData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
