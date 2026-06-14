import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ═══════════════════════════════════════════════════
   AUTH COOKIE HELPERS  — import these anywhere you
   need to attach the token to API calls
   ═══════════════════════════════════════════════════ */

/** Save JWT + role to cookies (2-hour expiry matches backend) */
export function saveAuthCookie(token, role) {
  const maxAge = 2 * 60 * 60; // 2 hours in seconds
  document.cookie = `auth_token=${encodeURIComponent(token)}; max-age=${maxAge}; path=/; SameSite=Strict`;
  document.cookie = `auth_role=${role}; max-age=${maxAge}; path=/; SameSite=Strict`;
}

/** Read a cookie by name. Returns null if not found / expired. */
export function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/**
 * Get the stored Bearer token.
 * Use this in every authenticated fetch:
 *   headers: { Authorization: getAuthToken() }
 */
export function getAuthToken() {
  return getCookie("auth_token"); // e.g. "Bearer eyJhbGci..."
}

/** Get the stored role: "ROLE_USER" or "ROLE_ADMIN" */
export function getAuthRole() {
  return getCookie("auth_role");
}

/** Clear both auth cookies (logout) */
export function clearAuthCookies() {
  document.cookie = "auth_token=; max-age=0; path=/";
  document.cookie = "auth_role=; max-age=0; path=/";
}

/** True if a valid (non-expired) auth cookie exists */
export function isLoggedIn() {
  return !!getAuthToken();
}

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */
const API_BASE = "http://localhost:8080";

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState("USER"); // "USER" | "ADMIN"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  /* ── theme sync ── */
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  /* ── redirect if already logged in ── */
  useEffect(() => {
    if (isLoggedIn()) {
      const role = getAuthRole();
      redirectByRole(role);
    }
  }, []);

  function redirectByRole(role) {
    if (role === "ROLE_ADMIN") navigate("/admin/dashboard");
    else navigate("/citizen/dashboard");
  }

  /* ─────────────────────────────────────────────
     SUBMIT LOGIN
  ───────────────────────────────────────────── */
  async function handleLogin(e) {
    e.preventDefault();

    if (!username.trim()) {
      toast.warning("Please enter your username.");
      return;
    }
    if (!password.trim()) {
      toast.warning("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, userType }),
      });

      const text = await res.text();

      if (res.ok) {
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        if (!data?.token) {
          toast.error("Login succeeded but no token received.");
          return;
        }

        // token already includes "Bearer " prefix from backend
        saveAuthCookie(data.token, data.role);

        toast.success(
          `✅ Welcome back! Logging you in as ${data.role === "ROLE_ADMIN" ? "Admin" : "Citizen"}…`,
        );
        setTimeout(() => redirectByRole(data.role), 1500);
      } else if (res.status === 401) {
        toast.error(`🔒 ${text || "Invalid username or password."}`);
      } else {
        toast.error(`❌ ${text || "Login failed. Please try again."}`);
      }
    } catch (err) {
      toast.error("🔌 Cannot reach server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  const isAdmin = userType === "ADMIN";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

        :root[data-theme="light"] {
          --bg-base: #f0f4ff;
          --bg-card: rgba(255,255,255,0.78);
          --bg-nav: rgba(240,244,255,0.82);
          --bg-input: rgba(255,255,255,0.92);
          --border: rgba(99,120,220,0.18);
          --border-card: rgba(99,120,220,0.22);
          --border-input: rgba(99,120,220,0.28);
          --text-primary: #0f1b3d;
          --text-secondary: #3b4a7a;
          --text-muted: #6b7aaa;
          --user-accent: #2a52e8;
          --user-glow: rgba(42,82,232,0.18);
          --user-badge-bg: rgba(42,82,232,0.09);
          --user-badge-text: #1a3ab8;
          --admin-accent: #7c3aed;
          --admin-glow: rgba(124,58,237,0.18);
          --admin-badge-bg: rgba(124,58,237,0.09);
          --admin-badge-text: #5b21b6;
          --shadow: 0 12px 48px rgba(42,82,232,0.13);
          --danger: #e83a3a;
          --danger-bg: rgba(232,58,58,0.08);
        }
        :root[data-theme="dark"] {
          --bg-base: #080e24;
          --bg-card: rgba(14,22,58,0.82);
          --bg-nav: rgba(8,14,36,0.88);
          --bg-input: rgba(10,17,46,0.90);
          --border: rgba(80,120,255,0.18);
          --border-card: rgba(80,120,255,0.20);
          --border-input: rgba(80,120,255,0.28);
          --text-primary: #e8eeff;
          --text-secondary: #a0b0e8;
          --text-muted: #5a6a9a;
          --user-accent: #5b8aff;
          --user-glow: rgba(91,138,255,0.22);
          --user-badge-bg: rgba(91,138,255,0.12);
          --user-badge-text: #93b4ff;
          --admin-accent: #a78bfa;
          --admin-glow: rgba(167,139,250,0.22);
          --admin-badge-bg: rgba(167,139,250,0.12);
          --admin-badge-text: #c4b5fd;
          --shadow: 0 12px 48px rgba(0,0,0,0.55);
          --danger: #ff6b6b;
          --danger-bg: rgba(255,107,107,0.10);
        }

        /* derived from userType */
        :root { --accent: var(--user-accent); --glow: var(--user-glow); }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: var(--bg-base);
          color: var(--text-primary);
          min-height: 100vh;
          transition: background 0.3s, color 0.3s;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .ln-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 64px; padding: 0 5vw;
          display: flex; align-items: center; justify-content: space-between;
          background: var(--bg-nav); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .ln-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 700;
          color: var(--text-primary); text-decoration: none;
        }
        .ln-logo-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800; color: #fff;
          background: var(--user-accent);
          transition: background 0.4s;
        }
        .ln-logo-icon.admin { background: var(--admin-accent); }
        .ln-nav-right { display: flex; align-items: center; gap: 12px; }
        .theme-btn {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid var(--border-card);
          background: var(--bg-card); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 1.1rem; color: var(--text-primary);
          transition: border-color 0.2s;
        }
        .theme-btn:hover { border-color: var(--user-accent); }
        .nav-reg-link {
          padding: 8px 18px; border-radius: 10px;
          border: 1.5px solid var(--border-card);
          background: var(--bg-card); backdrop-filter: blur(10px);
          color: var(--text-primary); font-size: 0.875rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
        }
        .nav-reg-link:hover { border-color: var(--user-accent); color: var(--user-accent); }

        /* ── PAGE ── */
        .ln-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 80px 5vw 48px;
          position: relative; overflow: hidden;
        }

        /* Animated background blobs */
        .ln-blob {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.35;
          pointer-events: none; transition: background 0.6s;
          animation: blobFloat 8s ease-in-out infinite;
        }
        .ln-blob-1 {
          width: 480px; height: 480px;
          top: -120px; left: -100px;
          background: var(--user-accent);
          animation-delay: 0s;
        }
        .ln-blob-1.admin { background: var(--admin-accent); }
        .ln-blob-2 {
          width: 360px; height: 360px;
          bottom: -80px; right: -80px;
          background: var(--user-accent);
          opacity: 0.20;
          animation-delay: -3s;
        }
        .ln-blob-2.admin { background: var(--admin-accent); }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(20px,-20px) scale(1.04); }
          66%       { transform: translate(-10px,15px) scale(0.97); }
        }

        /* ── CARD ── */
        .ln-card {
          width: 100%; max-width: 460px;
          background: var(--bg-card);
          backdrop-filter: blur(28px);
          border: 1px solid var(--border-card);
          border-radius: 28px;
          box-shadow: var(--shadow);
          padding: 44px 40px;
          position: relative; z-index: 1;
          animation: cardIn 0.55s cubic-bezier(0.34,1.28,0.64,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── TYPE SWITCHER ── */
        .ln-switcher {
          display: flex; gap: 6px;
          background: var(--bg-input);
          border: 1.5px solid var(--border-input);
          border-radius: 16px; padding: 5px;
          margin-bottom: 32px;
        }
        .ln-switch-btn {
          flex: 1; padding: 10px 12px; border-radius: 12px;
          border: none; background: transparent;
          font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 700;
          color: var(--text-muted); cursor: pointer;
          transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .ln-switch-btn.active-user {
          background: var(--user-accent); color: #fff;
          box-shadow: 0 4px 16px var(--user-glow);
        }
        .ln-switch-btn.active-admin {
          background: var(--admin-accent); color: #fff;
          box-shadow: 0 4px 16px var(--admin-glow);
        }
        .ln-switch-btn:hover:not(.active-user):not(.active-admin) {
          color: var(--text-primary);
          background: var(--border-card);
        }

        /* ── HEADER ── */
        .ln-header { margin-bottom: 28px; text-align: center; }
        .ln-icon-wrap {
          width: 64px; height: 64px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; margin: 0 auto 16px;
          transition: background 0.4s, box-shadow 0.4s;
        }
        .ln-icon-wrap.user  { background: var(--user-badge-bg);  box-shadow: 0 0 0 8px var(--user-badge-bg);  }
        .ln-icon-wrap.admin { background: var(--admin-badge-bg); box-shadow: 0 0 0 8px var(--admin-badge-bg); }
        .ln-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.5rem,3vw,1.9rem); font-weight: 800;
          color: var(--text-primary); margin-bottom: 6px; line-height: 1.2;
        }
        .ln-title em { font-style: normal; transition: color 0.4s; }
        .ln-title em.user  { color: var(--user-accent); }
        .ln-title em.admin { color: var(--admin-accent); }
        .ln-sub { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; }

        /* ── FIELDS ── */
        .ln-fields { display: flex; flex-direction: column; gap: 16px; }
        .ln-field  { display: flex; flex-direction: column; gap: 6px; }
        .ln-label  {
          font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .ln-input {
          padding: 12px 14px; border-radius: 13px;
          border: 1.5px solid var(--border-input);
          background: var(--bg-input); color: var(--text-primary);
          font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
        }
        .ln-input:focus.user  { border-color: var(--user-accent);  box-shadow: 0 0 0 3px var(--user-glow);  }
        .ln-input:focus.admin { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-glow); }
        .ln-pw-wrap { position: relative; }
        .ln-pw-wrap .ln-input { padding-right: 46px; }
        .ln-pw-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); font-size: 1rem; transition: color 0.2s;
        }
        .ln-pw-eye:hover { color: var(--text-primary); }

        /* ── SUBMIT BUTTON ── */
        .ln-btn {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 800;
          color: #fff; cursor: pointer; margin-top: 8px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.25s; letter-spacing: 0.02em;
        }
        .ln-btn.user  { background: var(--user-accent);  box-shadow: 0 6px 24px var(--user-glow); }
        .ln-btn.admin { background: var(--admin-accent); box-shadow: 0 6px 24px var(--admin-glow);}
        .ln-btn:hover:not(:disabled) { opacity: 0.87; transform: translateY(-2px); }
        .ln-btn:active:not(:disabled){ transform: translateY(0); }
        .ln-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── SPINNER ── */
        .spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff; animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── DIVIDER ── */
        .ln-divider {
          display: flex; align-items: center; gap: 12px; margin: 20px 0;
        }
        .ln-divider-line { flex: 1; height: 1px; background: var(--border-card); }
        .ln-divider-text { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }

        /* ── FOOTER ── */
        .ln-footer { margin-top: 20px; text-align: center; }
        .ln-footer p { font-size: 0.83rem; color: var(--text-muted); line-height: 1.8; }
        .ln-footer a { font-weight: 700; text-decoration: none; transition: opacity 0.2s; }
        .ln-footer a.user  { color: var(--user-accent); }
        .ln-footer a.admin { color: var(--admin-accent); }
        .ln-footer a:hover { opacity: 0.75; }

        /* ── COOKIE NOTICE ── */
        .ln-cookie-note {
          margin-top: 16px; padding: 10px 14px; border-radius: 10px;
          background: var(--border-card); border: 1px solid var(--border-input);
          font-size: 0.76rem; color: var(--text-muted); line-height: 1.5;
          display: flex; gap: 8px; align-items: flex-start;
        }

        .Toastify__toast {
          border-radius: 14px !important; font-family: 'DM Sans', sans-serif !important;
          font-size: 0.9rem !important;
        }

        @media (max-width: 520px) {
          .ln-card { padding: 28px 18px; border-radius: 20px; }
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={dark ? "dark" : "light"}
      />

      {/* NAV */}
      <nav className="ln-nav">
        <Link to="/" className="ln-logo">
          <span className={`ln-logo-icon${isAdmin ? " admin" : ""}`}>CG</span>
          CitizenGrievance
        </Link>
        <div className="ln-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/register/user" className="nav-reg-link">
            Register
          </Link>
        </div>
      </nav>

      {/* PAGE */}
      <div className="ln-page">
        {/* Animated blobs */}
        <div className={`ln-blob ln-blob-1${isAdmin ? " admin" : ""}`} />
        <div className={`ln-blob ln-blob-2${isAdmin ? " admin" : ""}`} />

        <div className="ln-card">
          {/* USER / ADMIN SWITCHER */}
          <div className="ln-switcher">
            <button
              type="button"
              className={`ln-switch-btn${userType === "USER" ? " active-user" : ""}`}
              onClick={() => setUserType("USER")}
            >
              👤 Citizen Login
            </button>
            <button
              type="button"
              className={`ln-switch-btn${userType === "ADMIN" ? " active-admin" : ""}`}
              onClick={() => setUserType("ADMIN")}
            >
              🏛️ Admin Login
            </button>
          </div>

          {/* HEADER */}
          <div className="ln-header">
            <div className={`ln-icon-wrap ${isAdmin ? "admin" : "user"}`}>
              {isAdmin ? "🏛️" : "👤"}
            </div>
            <h1 className="ln-title">
              Welcome back,{" "}
              <em className={isAdmin ? "admin" : "user"}>
                {isAdmin ? "Admin" : "Citizen"}
              </em>
            </h1>
            <p className="ln-sub">
              {isAdmin
                ? "Sign in to manage district complaints and resolutions."
                : "Sign in to file and track your grievances."}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} noValidate>
            <div className="ln-fields">
              <div className="ln-field">
                <label className="ln-label">Username</label>
                <input
                  className={`ln-input ${isAdmin ? "admin" : "user"}`}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAdmin ? "Admin username" : "Your username"}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="ln-field">
                <label className="ln-label">Password</label>
                <div className="ln-pw-wrap">
                  <input
                    className={`ln-input ${isAdmin ? "admin" : "user"}`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="ln-pw-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            <button
              className={`ln-btn ${isAdmin ? "admin" : "user"}`}
              type="submit"
              disabled={loading}
              style={{ marginTop: "20px" }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Signing in…
                </>
              ) : (
                `Sign in as ${isAdmin ? "Admin" : "Citizen"} →`
              )}
            </button>
          </form>

          <div className="ln-divider">
            <div className="ln-divider-line" />
            <span className="ln-divider-text">don't have an account?</span>
            <div className="ln-divider-line" />
          </div>

          {/* FOOTER LINKS */}
          <div className="ln-footer">
            <p>
              {isAdmin ? (
                <>
                  New admin?{" "}
                  <Link to="/register/admin" className={`admin`}>
                    Register as Admin →
                  </Link>
                </>
              ) : (
                <>
                  New citizen?{" "}
                  <Link to="/register/user" className={`user`}>
                    Create a Citizen Account →
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* COOKIE NOTICE */}
          <div className="ln-cookie-note">
            <span>🍪</span>
            <span>
              Your session token is stored in a secure cookie and expires
              automatically in 2 hours — matching your server session.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
