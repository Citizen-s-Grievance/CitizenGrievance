import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAuthToken,
  clearAuthCookies,
  isLoggedIn,
} from "../../utils/authCookie";

const BASE = "http://localhost:8080/admin";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch(`${BASE}/profile`, {
        headers: { Authorization: getAuthToken() },
      });
      if (res.status === 401) {
        clearAuthCookies();
        navigate("/login");
        return;
      }
      if (res.ok) setProfile(await res.json());
      else setError("Failed to load profile.");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  const fields = profile
    ? [
        {
          icon: "🪪",
          label: "Administration ID",
          value: profile.administrationId,
        },
        { icon: "👤", label: "Username", value: profile.username },
        { icon: "✉️", label: "Email", value: profile.email },
        { icon: "📛", label: "Full Name", value: profile.name },
        { icon: "📞", label: "Phone Number", value: profile.phoneNumber },
        { icon: "📍", label: "District", value: profile.district },
        { icon: "🏢", label: "Department", value: profile.department },
      ]
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        :root[data-theme="light"]{
          --bg:#f0f4ff;--bg-card:rgba(255,255,255,0.88);--bg-nav:rgba(240,244,255,0.92);
          --bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);
          --border-card:rgba(99,120,220,0.22);--text-primary:#0f1b3d;--text-secondary:#3b4a7a;
          --text-muted:#6b7aaa;--accent:#7c3aed;--accent2:#a78bfa;
          --accent-glow:rgba(124,58,237,0.15);--accent-badge:rgba(124,58,237,0.09);
          --shadow:0 8px 32px rgba(124,58,237,0.11);--shadow-card:0 2px 12px rgba(124,58,237,0.08);
        }
        :root[data-theme="dark"]{
          --bg:#080e24;--bg-card:rgba(14,22,58,0.85);--bg-nav:rgba(8,14,36,0.92);
          --bg-input:rgba(10,17,46,0.90);--border:rgba(167,139,250,0.15);
          --border-card:rgba(167,139,250,0.22);--text-primary:#e8eeff;--text-secondary:#a0b0e8;
          --text-muted:#5a6a9a;--accent:#a78bfa;--accent2:#7c3aed;
          --accent-glow:rgba(167,139,250,0.20);--accent-badge:rgba(167,139,250,0.12);
          --shadow:0 8px 32px rgba(0,0,0,0.50);--shadow-card:0 2px 12px rgba(0,0,0,0.40);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}

        /* NAV */
        .ap-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .ap-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
        .ap-logo-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.9rem;font-weight:800;}
        .ap-admin-tag{font-size:.7rem;font-weight:700;background:var(--accent-badge);color:var(--accent);border-radius:20px;padding:3px 10px;border:1px solid var(--border-card);}
        .ap-nav-right{display:flex;align-items:center;gap:8px;}
        .ap-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'DM Sans',sans-serif;}
        .ap-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
        .ap-nav-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.3);}
        .ap-nav-btn.danger:hover{background:rgba(239,68,68,0.08);border-color:#ef4444;}
        .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;}

        /* PAGE */
        .ap-page{padding:88px 5vw 60px;max-width:1000px;margin:0 auto;}

        /* HEADER */
        .ap-header{margin-bottom:32px;animation:fadeUp .4s ease both;}
        .ap-title{font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);margin-bottom:4px;}
        .ap-subtitle{font-size:.88rem;color:var(--text-muted);}

        /* LOADING */
        .ap-center{display:flex;flex-direction:column;align-items:center;padding-top:80px;gap:16px;color:var(--text-muted);font-size:.9rem;}
        .ap-spinner{width:40px;height:40px;border:3px solid var(--border-card);border-top:3px solid var(--accent);border-radius:50%;animation:spin .8s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ap-error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:12px;padding:16px 20px;font-size:.88rem;}

        /* PROFILE LAYOUT */
        .ap-container{display:flex;gap:24px;align-items:flex-start;animation:fadeUp .4s ease both;}

        /* AVATAR CARD */
        .ap-avatar-card{width:240px;flex-shrink:0;background:var(--bg-card);border:1px solid var(--border-card);border-radius:22px;padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:var(--shadow-card);}
        .ap-avatar-circle{width:86px;height:86px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-weight:800;font-size:2.2rem;color:#fff;margin-bottom:8px;box-shadow:0 0 40px var(--accent-glow);}
        .ap-avatar-name{font-family:'Outfit',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text-primary);text-align:center;}
        .ap-avatar-role{font-size:.82rem;color:var(--accent);font-weight:600;}
        .ap-avatar-district{font-size:.82rem;color:var(--text-muted);}
        .ap-badge-row{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;justify-content:center;}
        .ap-badge{font-size:.72rem;font-weight:700;padding:3px 12px;border-radius:999px;border:1px solid;}
        .ap-badge-admin{background:var(--accent-badge);color:var(--accent);border-color:rgba(167,139,250,0.3);}
        .ap-badge-active{background:rgba(52,211,153,0.12);color:#34d399;border-color:rgba(52,211,153,0.3);}

        /* DIVIDER */
        .ap-avatar-divider{width:100%;height:1px;background:var(--border-card);margin:4px 0;}

        /* QUICK INFO inside avatar card */
        .ap-quick-info{width:100%;display:flex;flex-direction:column;gap:8px;}
        .ap-quick-row{display:flex;align-items:center;gap:10px;font-size:.8rem;}
        .ap-quick-icon{font-size:.9rem;width:20px;text-align:center;flex-shrink:0;}
        .ap-quick-label{color:var(--text-muted);flex:1;}
        .ap-quick-val{color:var(--text-primary);font-weight:600;text-align:right;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

        /* DETAILS CARD */
        .ap-details-card{flex:1;background:var(--bg-card);border:1px solid var(--border-card);border-radius:22px;padding:32px;box-shadow:var(--shadow-card);}
        .ap-details-head{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:24px;display:flex;align-items:center;gap:10px;}
        .ap-details-head::after{content:'';flex:1;height:1px;background:var(--border-card);}
        .ap-fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .ap-field-item{background:var(--bg-input);border:1px solid var(--border-card);border-radius:14px;padding:16px;transition:border-color .2s;}
        .ap-field-item:hover{border-color:var(--accent);}
        .ap-field-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .ap-field-icon{font-size:.9rem;}
        .ap-field-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);}
        .ap-field-value{font-size:.95rem;font-weight:600;color:var(--text-primary);word-break:break-all;}

        /* ID field — full width */
        .ap-field-full{grid-column:1 / -1;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

        @media(max-width:760px){
          .ap-container{flex-direction:column;}
          .ap-avatar-card{width:100%;}
          .ap-fields-grid{grid-template-columns:1fr;}
          .ap-page{padding:80px 4vw 48px;}
        }
      `}</style>

      {/* NAV */}
      <nav className="ap-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin/dashboard" className="ap-logo">
            <span className="ap-logo-icon">CG</span>
            <span>CitizenGrievance</span>
          </a>
          <span className="ap-admin-tag">🏛 Admin</span>
        </div>
        <div className="ap-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/admin/dashboard" className="ap-nav-btn">
            Dashboard
          </Link>
          <Link to="/admin/complaints" className="ap-nav-btn">
            Complaints
          </Link>
          <button
            className="ap-nav-btn danger"
            onClick={() => {
              clearAuthCookies();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="ap-page">
        {/* Header */}
        <div className="ap-header">
          <div className="ap-title">My Profile</div>
          <div className="ap-subtitle">Your administrator account details</div>
        </div>

        {loading && (
          <div className="ap-center">
            <div className="ap-spinner" />
            <span>Loading profile…</span>
          </div>
        )}

        {error && <div className="ap-error">{error}</div>}

        {profile && (
          <div className="ap-container">
            {/* Avatar card */}
            <div className="ap-avatar-card">
              <div className="ap-avatar-circle">
                {(profile.name ?? profile.username ?? "A")[0].toUpperCase()}
              </div>
              <div className="ap-avatar-name">
                {profile.name ?? profile.username}
              </div>
              <div className="ap-avatar-role">
                🏢 {profile.department ?? "Administrator"}
              </div>
              <div className="ap-avatar-district">
                📍 {profile.district ?? "—"}
              </div>
              <div className="ap-badge-row">
                <span className="ap-badge ap-badge-admin">Admin</span>
                <span className="ap-badge ap-badge-active">Active</span>
              </div>

              <div className="ap-avatar-divider" />

              {/* Quick-view inside card */}
              <div className="ap-quick-info">
                {[
                  { icon: "✉️", label: "Email", value: profile.email },
                  { icon: "📞", label: "Phone", value: profile.phoneNumber },
                  { icon: "📍", label: "District", value: profile.district },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div key={r.label} className="ap-quick-row">
                      <span className="ap-quick-icon">{r.icon}</span>
                      <span className="ap-quick-label">{r.label}</span>
                      <span className="ap-quick-val" title={r.value}>
                        {r.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Details card */}
            <div className="ap-details-card">
              <div className="ap-details-head">Account Information</div>
              <div className="ap-fields-grid">
                {fields
                  .filter((f) => f.value)
                  .map((f) => (
                    <div
                      key={f.label}
                      className={`ap-field-item ${f.label === "Administration ID" ? "ap-field-full" : ""}`}
                    >
                      <div className="ap-field-header">
                        <span className="ap-field-icon">{f.icon}</span>
                        <span className="ap-field-label">{f.label}</span>
                      </div>
                      <div className="ap-field-value">{f.value}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
