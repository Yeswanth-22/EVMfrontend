import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "../api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "citizen",
  otp: "",
};

function Register() {
  const { register, sendRegistrationOtp, verifyRegistrationOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (!form.email.trim()) {
      setError("Enter email before requesting OTP.");
      return;
    }

    setLoadingOtp(true);
    setError("");
    setInfo("");
    console.debug("Send OTP ->", `${API_URL}/api/auth/send-otp`, { email: form.email });
    const result = await sendRegistrationOtp(form.email);
    setLoadingOtp(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOtpVerified(false);
    setInfo("OTP sent. Check your inbox.");
  };

  const handleVerifyOtp = async () => {
    if (!form.email.trim() || !form.otp.trim()) {
      setError("Enter email and OTP first.");
      return;
    }

    setLoadingOtp(true);
    setError("");
    setInfo("");
    console.debug("Verify OTP ->", `${API_URL}/api/auth/verify-otp`, { email: form.email, otp: form.otp });
    const result = await verifyRegistrationOtp(form.email, form.otp);
    setLoadingOtp(false);

    if (!result.success) {
      setOtpVerified(false);
      setError(result.message);
      return;
    }

    setOtpVerified(true);
    setInfo("OTP verified. You can now register.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!otpVerified) {
      setError("Verify OTP before registering.");
      return;
    }

    // Avoid logging passwords; log email and role for debugging
    console.debug("Register ->", `${API_URL}/api/auth/register`, { email: form.email, role: form.role });
    const result = await register(form);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/login");
  };

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create account</h2>
        <p className="muted">Register to access election services.</p>

        <label htmlFor="name">Full name</label>
        <input
          id="name"
          required
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(event) => {
            setOtpVerified(false);
            setForm((prev) => ({ ...prev, email: event.target.value }));
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button
            className="btn btn-outline"
            type="button"
            onClick={handleSendOtp}
            disabled={loadingOtp}
          >
            {loadingOtp ? "Please wait..." : "Send OTP"}
          </button>
        </div>

        <label htmlFor="otp">OTP</label>
        <input
          id="otp"
          type="text"
          required
          value={form.otp}
          onChange={(event) => {
            setOtpVerified(false);
            setForm((prev) => ({ ...prev, otp: event.target.value }));
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button
            className="btn btn-outline"
            type="button"
            onClick={handleVerifyOtp}
            disabled={loadingOtp}
          >
            {loadingOtp ? "Please wait..." : "Verify OTP"}
          </button>
          {otpVerified ? (
            <span
              style={{ color: "#12805c", fontWeight: 600, alignSelf: "center" }}
              aria-label="OTP verified"
              title="OTP verified"
            >
              ✓ Verified
            </span>
          ) : null}
        </div>

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          minLength={6}
          required
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />

        <label htmlFor="role">Role</label>
        <select
          id="role"
          value={form.role}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, role: event.target.value }))
          }
        >
          <option value="citizen">Citizen</option>
          <option value="observer">Observer</option>
          <option value="analyst">Analyst</option>
        </select>

        {error ? <p className="form-error">{error}</p> : null}
        {info ? <p className="muted">{info}</p> : null}

        <button className="btn btn-primary" type="submit">
          Register
        </button>

        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}

export default Register;
