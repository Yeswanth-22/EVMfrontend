import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Navbar({ title }) {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="top-nav">
      <div>
        <p className="badge">Election Management</p>
        <h2>{title}</h2>
      </div>

      <div className="top-nav-actions">
        <div className="user-chip">
          <span>{currentUser?.name || "Guest"}</span>
          <small>{currentUser?.role || "visitor"}</small>
        </div>
        <button className="btn btn-outline" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
