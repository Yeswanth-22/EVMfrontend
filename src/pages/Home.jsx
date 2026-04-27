import { Link, Navigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const roles = [
  {
    title: "Admin",
    desc: "Control system access, monitor election operations, and maintain platform integrity through secure workflows.",
  },
  {
    title: "Observer",
    desc: "Verify incidents in the field, document anomalies, and strengthen public transparency with structured reports.",
  },
  {
    title: "Citizen",
    desc: "Track election updates, submit fraud reports, and stay engaged in a secure civic participation process.",
  },
  {
    title: "Data Analyst",
    desc: "Analyze election data, generate decision-ready reports, and provide real-time insights on process quality.",
  },
];

const features = [
  {
    icon: "🔒",
    title: "Role-Based Access",
    desc: "Strict separation of responsibilities with secure, role-specific views.",
  },
  {
    icon: "🛡️",
    title: "Tamper-Resistant Reporting",
    desc: "Structured incident reporting designed for accountability and traceability.",
  },
  {
    icon: "📊",
    title: "Operational Visibility",
    desc: "Clear system metrics to monitor election activities in real time.",
  },
  {
    icon: "⚡",
    title: "Fast Case Handling",
    desc: "Prioritized issue workflows that help teams respond quickly and consistently.",
  },
  {
    icon: "🏛️",
    title: "Government-Ready UX",
    desc: "Professional interface language tailored for public-sector trust.",
  },
  {
    icon: "✅",
    title: "Audit Friendly",
    desc: "Clean records and standardized actions to support transparency reviews.",
  },
];

function Home({ fallbackPath = "/" }) {
  const { currentUser } = useContext(AuthContext);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (currentUser && fallbackPath !== "/") {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <div className="ems-landing">
      <header className={`ems-navbar ${isScrolled ? "ems-navbar-solid" : ""}`}>
        <div className="ems-shell ems-navbar-inner">
          <div className="ems-brand">
            <span className="ems-brand-mark">EMS</span>
            <div>
              <strong>Election Management System</strong>
              <small>Secure • Transparent • Accountable</small>
            </div>
          </div>

          <nav className="ems-nav-links" aria-label="Primary">
            <a href="#roles">Roles</a>
            <a href="#features">Features</a>
          </nav>

          <div className="ems-nav-actions">
            <Link className="ems-btn ems-btn-ghost" to="/login">
              Sign In
            </Link>
            <Link className="ems-btn ems-btn-primary" to="/register">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="ems-hero">
          <div className="ems-shell ems-hero-grid">
            <div className="ems-hero-copy">
              <p className="ems-kicker">Trusted election operations platform</p>
              <h1>Modern election oversight for secure public confidence</h1>
              <p>
                A professional, role-based portal for election administration,
                incident oversight, and citizen reporting—built to support
                transparent governance with confidence.
              </p>
              <div className="ems-hero-actions">
                <Link className="ems-btn ems-btn-primary" to="/register">
                  Request Access
                </Link>
                <Link className="ems-btn ems-btn-ghost" to="/login">
                  Access Portal
                </Link>
              </div>
            </div>

            <aside className="ems-trust-panel" aria-label="Platform trust indicators">
              <h3>Platform Assurances</h3>
              <ul>
                <li>Role-isolated access across stakeholders</li>
                <li>Structured reporting and review workflows</li>
                <li>Consistent audit-ready operational records</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="roles" className="ems-section">
          <div className="ems-shell">
            <div className="ems-section-head">
              <h2>Role-based election collaboration</h2>
              <p>
                Clear responsibilities keep election operations coordinated,
                secure, and transparent for every participant.
              </p>
            </div>

            <div className="ems-role-grid">
              {roles.map((role) => (
                <article className="ems-role-card" key={role.title}>
                  <h3>{role.title}</h3>
                  <p>{role.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="ems-section ems-section-soft">
          <div className="ems-shell">
            <div className="ems-section-head">
              <h2>Built for secure public-sector operations</h2>
              <p>
                Minimal by design, enterprise in quality—focused on trust,
                clarity, and responsive decision-making.
              </p>
            </div>

            <div className="ems-feature-grid">
              {features.map((feature) => (
                <article className="ems-feature-card" key={feature.title}>
                  <span className="ems-feature-icon" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;