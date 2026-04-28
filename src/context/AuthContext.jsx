import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../api";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || `${API_URL}/api`).replace(/\/$/, "");
const AUTH_BASE = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;
const AUTH_STORAGE_KEY = "ems_auth_v2";
const TOKEN_REFRESH_THRESHOLD = 60000; // 1 minute

const asFailure = (message) => ({ success: false, message, data: null });

export const AuthContext = createContext({});

const readAuth = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return { token: null, user: null };
  try {
    const parsed = JSON.parse(raw);
    return { token: parsed?.token || null, user: parsed?.user || null };
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

  const setupTokenRefresh = useCallback(
    (activeToken) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (!activeToken) return;
      try {
        const parts = activeToken.split(".");
        if (parts.length !== 3) return;
        const decoded = JSON.parse(atob(parts[1]));
        const expiresAt = decoded?.exp ? decoded.exp * 1000 : 0;
        const expiresIn = expiresAt - Date.now();
        if (expiresIn <= 0) {
          setToken(null);
          setCurrentUser(null);
          return;
        }
        const refreshIn = Math.max(expiresIn - TOKEN_REFRESH_THRESHOLD, 1000);
        refreshTimerRef.current = setTimeout(async () => {
          const refreshed = await refreshTokenInternal(activeToken);
          if (refreshed && refreshed.data?.token) {
            setToken(refreshed.data.token);
            setupTokenRefresh(refreshed.data.token);
          } else {
            setToken(null);
            setCurrentUser(null);
          }
        }, refreshIn);
      } catch (err) {
        console.error("setupTokenRefresh error", err);
      }
    },
    []
  );

  const refreshTokenInternal = useCallback(async (activeToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeToken}` },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) return null;
      return payload;
    } catch (err) {
      console.error("refreshTokenInternal error", err);
      return null;
    }
  }, []);

  const request = useCallback(
    async (path, options = {}, explicitToken) => {
      const activeToken = explicitToken ?? token;
      const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
      if (activeToken) headers.Authorization = `Bearer ${activeToken}`;
      const url = `${API_BASE}${path}`;
      console.debug("API request", { url, options: { ...options, headers } });
      try {
        const res = await fetch(url, { ...options, headers });
        const payload = await res.json().catch(() => null);
        console.debug("API response", { url, status: res.status, payload });
        if (!res.ok) {
          if (res.status === 401) {
            setToken(null);
            setCurrentUser(null);
          }
          return asFailure(payload?.message || `Request failed with status ${res.status}.`);
        }
        if (payload == null) return asFailure("Invalid server response.");
        return payload;
      } catch (err) {
        console.error("request error", err);
        return asFailure("Unable to connect to backend. Please check server connection.");
      }
    },
    [token]
  );

  const resolveList = (res) => {
    if (!res) return [];
    if (res.success && Array.isArray(res.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  };

  const loadAllData = useCallback(
    async (authToken) => {
      const activeToken = authToken ?? token;
      if (!activeToken) return;

      const [usersRes, incidentsRes, fraudRes, analystRes, electionRes] = await Promise.all([
        request("/admin/users", {}, activeToken),
        request("/admin/incidents", {}, activeToken),
        request("/admin/fraud-reports", {}, activeToken),
        request("/admin/analyst-reports", {}, activeToken),
        request("/admin/election-results", {}, activeToken),
      ]);

      console.debug("loadAllData results", { usersRes, incidentsRes, fraudRes, analystRes, electionRes });

      setUsers(resolveList(usersRes));
      setIncidents(resolveList(incidentsRes));
      setFraudReports(resolveList(fraudRes));
      setAnalystReports(resolveList(analystRes));
      setElectionResults(resolveList(electionRes));
    },
    [request, token]
  );

  useEffect(() => {
    writeAuth(token, currentUser);
  }, [token, currentUser]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) return;
      // attempt to validate token and load user/data
      const me = await request("/auth/me");
      if (!me.success) {
        setToken(null);
        setCurrentUser(null);
        return;
      }
      setCurrentUser(me.data);
      await loadAllData(token);
      setupTokenRefresh(token);
    };
    bootstrap();
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [token, request, loadAllData, setupTokenRefresh]);

  const register = async (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) });

  const sendRegistrationOtp = async (email) => request("/auth/send-otp", { method: "POST", body: JSON.stringify({ email }) });
  const verifyRegistrationOtp = async (email, otp) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) });

  const login = async (email, password) => {
    const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (!result.success || !result.data?.token) {
      return asFailure(result.message || "Login failed.");
    }
    setToken(result.data.token);
    setCurrentUser(result.data.user);
    await loadAllData(result.data.token);
    setupTokenRefresh(result.data.token);
    return { success: true, message: result.message || "Login successful.", user: result.data.user, token: result.data.token };
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setIncidents([]);
    setFraudReports([]);
    setAnalystReports([]);
    setElectionResults([]);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Admin helpers
  const createUser = async (payload) => {
    const res = await request("/admin/users", { method: "POST", body: JSON.stringify(payload) });
    if (res.success && res.data) setUsers((p) => [res.data, ...p]);
    return res;
  };

  const updateUser = async (userId, updates) => {
    const res = await request(`/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(updates) });
    if (res.success && res.data) setUsers((p) => p.map((u) => (u.id === userId ? res.data : u)));
    return res;
  };

  const deleteUser = async (userId) => {
    const res = await request(`/admin/users/${userId}`, { method: "DELETE" });
    if (res.success) setUsers((p) => p.filter((u) => u.id !== userId));
    return res;
  };

  const updateFraudReport = async (id, updates) => {
    const res = await request(`/admin/fraud-reports/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    if (res.success && res.data) setFraudReports((p) => p.map((r) => (r.id === id ? res.data : r)));
    return res;
  };

  const deleteFraudReport = async (id) => {
    const res = await request(`/admin/fraud-reports/${id}`, { method: "DELETE" });
    if (res.success) setFraudReports((p) => p.filter((r) => r.id !== id));
    return res;
  };

  const dashboardStats = useMemo(
    () => ({ users: users.length, incidents: incidents.length, fraudReports: fraudReports.length, analystReports: analystReports.length, electionResults: electionResults.length }),
    [users.length, incidents.length, fraudReports.length, analystReports.length, electionResults.length]
  );

  const value = useMemo(
    () => ({
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
      logout,
      createUser,
      updateUser,
      deleteUser,
      updateFraudReport,
      deleteFraudReport,
    }),
    [users, currentUser, incidents, fraudReports, analystReports, electionResults, dashboardStats]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
