import { Navigate } from "react-router-dom";

function SecureRole({ children, currentUser, role }) {
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
}

export default SecureRole;