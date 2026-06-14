import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAuthToken,
  clearAuthCookies,
  isLoggedIn,
} from "../../utils/authCookie";

const BASE = "http://localhost:8080/admin";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    inProgress: 0,
    solved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

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
    fetchStats();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch(`${BASE}/profile`, {
        headers: { Authorization: getAuthToken() },
      });
      if (res.ok) setProfile(await res.json());
    } catch {}
  }
  async function fetchStats() {
    try {
      const res = await fetch(`${BASE}/myStats`, {
        headers: { Authorization: getAuthToken() },
      });
      if (res.status === 401) {
        clearAuthCookies();
        navigate("/login");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setStats({
          total: d.total ?? 0,
          sent: d.sent ?? 0,
          pending: d.pending ?? 0,
          inProgress: d.inProgress ?? 0,
          solved: d.solved ?? 0,
          rejected: d.rejected ?? 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: "📋",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.12)",
    },

    {
      label: "Pending",
      value: stats.sent,
      icon: "⏳",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.12)",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: "🔧",
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.12)",
    },
    {
      label: "Resolved",
      value: stats.solved,
      icon: "✅",
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        :root[data-theme="light"]{--bg:#f0f4ff;--bg-card:rgba(255,255,255,0.88);--bg-nav:rgba(240,244,255,0.92);--bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);--border-card:rgba(99,120,220,0.22);--text-primary:#0f1b3d;--text-secondary:#3b4a7a;--text-muted:#6b7aaa;--accent:#7c3aed;--accent-glow:rgba(124,58,237,0.15);--accent-badge:rgba(124,58,237,0.09);--shadow:0 8px 32px rgba(124,58,237,0.11);--shadow-card:0 2px 12px rgba(124,58,237,0.08);}
        :root[data-theme="dark"]{--bg:#080e24;--bg-card:rgba(14,22,58,0.85);--bg-nav:rgba(8,14,36,0.92);--bg-input:rgba(10,17,46,0.90);--border:rgba(167,139,250,0.15);--border-card:rgba(167,139,250,0.22);--text-primary:#e8eeff;--text-secondary:#a0b0e8;--text-muted:#5a6a9a;--accent:#a78bfa;--accent-glow:rgba(167,139,250,0.20);--accent-badge:rgba(167,139,250,0.12);--shadow:0 8px 32px rgba(0,0,0,0.50);--shadow-card:0 2px 12px rgba(0,0,0,0.40);}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}
        .ad-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .ad-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
        .ad-logo-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.9rem;font-weight:800;}
        .ad-admin-tag{font-size:.7rem;font-weight:700;background:var(--accent-badge);color:var(--accent);border-radius:20px;padding:3px 10px;border:1px solid var(--border-card);}
        .ad-nav-right{display:flex;align-items:center;gap:8px;}
        .ad-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'DM Sans',sans-serif;}
        .ad-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
        .ad-nav-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.3);}
        .ad-nav-btn.danger:hover{background:rgba(239,68,68,0.08);border-color:#ef4444;}
        .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;}
        .ad-profile-chip{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);}
        .ad-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;color:#fff;}
        .ad-chip-name{font-size:.82rem;font-weight:600;color:var(--text-primary);}
        .ad-chip-dept{font-size:.7rem;color:var(--text-muted);}
        .ad-page{padding:88px 5vw 60px;max-width:1100px;margin:0 auto;}
        .ad-header{margin-bottom:32px;animation:fadeUp .4s ease both;}
        .ad-title{font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);margin-bottom:4px;}
        .ad-subtitle{font-size:.88rem;color:var(--text-muted);}
        .ad-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:36px;animation:fadeUp .4s ease .05s both;}
        .ad-stat-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:18px;padding:20px 18px;display:flex;flex-direction:column;gap:6px;transition:transform .2s,box-shadow .2s,border-color .2s;}
        .ad-stat-card:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:var(--accent);}
        .ad-stat-icon{font-size:1.4rem;margin-bottom:4px;}
        .ad-stat-value{font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;line-height:1;}
        .ad-stat-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);}
        .ad-stat-bar{height:3px;border-radius:4px;margin-top:6px;overflow:hidden;}
        .ad-stat-bar-fill{height:100%;border-radius:4px;transition:width 1.2s cubic-bezier(.4,0,.2,1);}
        .ad-section{margin-bottom:36px;animation:fadeUp .4s ease .1s both;}
        .ad-section-title{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
        .ad-section-title::after{content:'';flex:1;height:1px;background:var(--border-card);}
        .ad-actions-row{display:flex;gap:14px;flex-wrap:wrap;}
        .ad-action-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:20px 24px;cursor:pointer;min-width:180px;transition:all .2s;text-decoration:none;display:block;}
        .ad-action-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow);}
        .ad-action-icon{font-size:1.6rem;margin-bottom:10px;}
        .ad-action-label{font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;}
        .ad-action-sub{font-size:.78rem;color:var(--text-muted);}
        .ad-info-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
        .ad-info-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:14px;padding:16px;transition:border-color .2s;}
        .ad-info-card:hover{border-color:var(--accent);}
        .ad-info-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:6px;}
        .ad-info-value{font-size:.92rem;font-weight:600;color:var(--text-primary);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:900px){.ad-stats{grid-template-columns:repeat(3,1fr);}.ad-info-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:600px){.ad-stats{grid-template-columns:repeat(2,1fr);}.ad-page{padding:80px 4vw 48px;}}
      `}</style>

      <nav className="ad-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin/dashboard" className="ad-logo">
            <span className="ad-logo-icon">CG</span>
            <span>CitizenGrievance</span>
          </a>
          <span className="ad-admin-tag">🏛 Admin</span>
        </div>
        <div className="ad-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          {profile && (
            <div className="ad-profile-chip">
              <div className="ad-avatar">
                {(profile.name ?? profile.username ?? "A")[0].toUpperCase()}
              </div>
              <div>
                <div className="ad-chip-name">
                  {profile.name ?? profile.username}
                </div>
                <div className="ad-chip-dept">{profile.department}</div>
              </div>
            </div>
          )}
          <Link to="/admin/complaints" className="ad-nav-btn">
            Complaints
          </Link>
          <Link to="/admin/profile" className="ad-nav-btn">
            Profile
          </Link>
          <button
            className="ad-nav-btn danger"
            onClick={() => {
              clearAuthCookies();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="ad-page">
        <div className="ad-header">
          <div className="ad-title">Dashboard Overview</div>
          <div className="ad-subtitle">
            {profile
              ? `Welcome back, ${profile.name ?? profile.username} · ${profile.district} · ${profile.department}`
              : "Loading…"}
          </div>
        </div>

        <div className="ad-stats">
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className="ad-stat-card"
              style={{
                borderColor: `${card.color}33`,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div className="ad-stat-icon">{card.icon}</div>
              <div
                className="ad-stat-value"
                style={{ color: loading ? "var(--text-muted)" : card.color }}
              >
                {loading ? "—" : card.value}
              </div>
              <div className="ad-stat-label">{card.label}</div>
              <div
                className="ad-stat-bar"
                style={{ background: `${card.color}22` }}
              >
                <div
                  className="ad-stat-bar-fill"
                  style={{
                    background: card.color,
                    width: loading
                      ? "0%"
                      : `${Math.min((card.value / (stats.total || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="ad-section">
          <div className="ad-section-title">Quick Actions</div>
          <div className="ad-actions-row">
            <Link to="/admin/complaints" className="ad-action-card">
              <div className="ad-action-icon">📋</div>
              <div className="ad-action-label">View All Complaints</div>
              <div className="ad-action-sub">Browse & resolve complaints</div>
            </Link>
            <Link to="/admin/profile" className="ad-action-card">
              <div className="ad-action-icon">👤</div>
              <div className="ad-action-label">My Profile</div>
              <div className="ad-action-sub">View admin details</div>
            </Link>
          </div>
        </div>

        {profile && (
          <div className="ad-section">
            <div className="ad-section-title">Your Jurisdiction</div>
            <div className="ad-info-grid">
              {[
                { label: "District", value: profile.district },
                { label: "Department", value: profile.department },
                { label: "Email", value: profile.email },
                { label: "Phone", value: profile.phoneNumber },
              ]
                .filter((f) => f.value)
                .map((f) => (
                  <div key={f.label} className="ad-info-card">
                    <div className="ad-info-label">{f.label}</div>
                    <div className="ad-info-value">{f.value}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
