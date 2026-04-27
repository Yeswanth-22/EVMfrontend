import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await login(form.email, form.password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(`/${result.user.role}`);
  };

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <p className="muted">Sign in to continue to your dashboard.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button className="btn btn-primary" type="submit">
          Login
        </button>

        <button className="btn btn-outline" type="button" onClick={loginWithGoogle}>
          Continue with Google
        </button>

        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
}

export default Login;
