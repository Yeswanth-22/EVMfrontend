import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function OAuthCallback() {
  const { completeOAuthLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRunRef = useRef(false);
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const run = async () => {
      const error = searchParams.get("error");
      if (error) {
        setMessage(decodeURIComponent(error));
        return;
      }

      const token = searchParams.get("token");
      if (!token) {
        setMessage("Google sign-in did not return a token.");
        return;
      }

      const result = await completeOAuthLogin(token);
      if (!result.success) {
        setMessage(result.message);
        return;
      }

      navigate(`/${result.user.role}`, { replace: true });
    };

    run();
  }, [completeOAuthLogin, navigate, searchParams]);

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <h2>Signing you in</h2>
        <p className="muted">{message}</p>
      </div>
    </section>
  );
}

export default OAuthCallback;