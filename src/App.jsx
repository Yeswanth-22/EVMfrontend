import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";

import SecureRole from "./components/SecureRole";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OAuthCallback from "./pages/OAuthCallback";

import AdminDashboard from "./admin/AdminDashboard";
import CitizenDashboard from "./citizen/CitizenDashboard";
import ObserverDashboard from "./observer/ObserverDashboard";
import AnalystDashboard from "./analyst/AnalystDashboard";

function AppRoutes() {
  const auth = useContext(AuthContext);
  const currentUser = auth?.currentUser ?? null;

  const defaultPath = currentUser ? `/${currentUser.role}` : "/";

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth2/callback" element={<OAuthCallback />} />

      <Route
        path="/admin"
        element={
          <SecureRole currentUser={currentUser} role="admin">
            <AdminDashboard />
          </SecureRole>
        }
      />

      <Route
        path="/citizen"
        element={
          <SecureRole currentUser={currentUser} role="citizen">
            <CitizenDashboard />
          </SecureRole>
        }
      />

      <Route
        path="/observer"
        element={
          <SecureRole currentUser={currentUser} role="observer">
            <ObserverDashboard />
          </SecureRole>
        }
      />

      <Route
        path="/analyst"
        element={
          <SecureRole currentUser={currentUser} role="analyst">
            <AnalystDashboard />
          </SecureRole>
        }
      />

      <Route path="*" element={<Home fallbackPath={defaultPath} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;