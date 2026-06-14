import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAuthToken,
  clearAuthCookies,
  isLoggedIn,
} from "../../utils/authCookie";

const API_BASE = "http://localhost:8080";

async function authFetch(url) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthToken() ?? "",
    },
  });
}

const ROLE_LABELS = { ROLE_USER: "Citizen", ROLE_ADMIN: "Administrator" };

export default function UserProfile() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [profile, setProfile] = useState(null);
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
    fetch(`${API_BASE}/citizen/profile`, {
      headers: { Authorization: getAuthToken() ?? "" },
    })
      .then(async (r) => {
        if (r.status === 401) {
          clearAuthCookies();
          navigate("/login");
          return;
        }
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => toast.error(`❌ ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  function SkeletonField() {
    return (
      <div className="up-field">
        <div
          className="skel"
          style={{ height: 12, width: 80, marginBottom: 8 }}
        />
        <div className="skel" style={{ height: 18, width: "70%" }} />
      </div>
    );
  }

  const FIELDS = profile
    ? [
        {
          group: "Personal Information",
          icon: "👤",
          items: [
            { label: "Full Name", value: profile.name, icon: "🪪" },
            { label: "Username", value: profile.username, icon: "🔖" },
            {
              label: "Role",
              value: ROLE_LABELS[profile.role] ?? profile.role,
              icon: "🛡️",
            },
          ],
        },
        {
          group: "Contact Details",
          icon: "📬",
          items: [
            { label: "Email", value: profile.email, icon: "✉️" },
            { label: "Phone Number", value: profile.phoneNumber, icon: "📱" },
          ],
        },
        {
          group: "Identity",
          icon: "🪪",
          items: [
            {
              label: "Aadhar Number",
              value: profile.aadharNumber
                ? profile.aadharNumber.replace(/(.{4})/g, "$1 ").trim()
                : "—",
              icon: "🆔",
            },
          ],
        },
        {
          group: "Address",
          icon: "🏠",
          items: [
            { label: "Address", value: profile.address, icon: "🏠" },
            { label: "District", value: profile.district, icon: "📍" },
            { label: "State", value: profile.state, icon: "🗺️" },
            { label: "PIN Code", value: profile.pinCode, icon: "📮" },
          ],
        },
      ]
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        :root[data-theme="light"]{
          --bg:#f0f4ff;--bg-card:rgba(255,255,255,0.85);--bg-nav:rgba(240,244,255,0.90);
          --bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);
          --border-card:rgba(99,120,220,0.22);--text-primary:#0f1b3d;--text-secondary:#3b4a7a;
          --text-muted:#6b7aaa;--accent:#2a52e8;--accent-glow:rgba(42,82,232,0.15);
          --accent-badge:rgba(42,82,232,0.09);--shadow:0 8px 32px rgba(42,82,232,0.11);
          --shadow-card:0 4px 20px rgba(42,82,232,0.08);
        }
        :root[data-theme="dark"]{
          --bg:#080e24;--bg-card:rgba(14,22,58,0.85);--bg-nav:rgba(8,14,36,0.92);
          --bg-input:rgba(10,17,46,0.90);--border:rgba(80,120,255,0.15);
          --border-card:rgba(80,120,255,0.22);--text-primary:#e8eeff;--text-secondary:#a0b0e8;
          --text-muted:#5a6a9a;--accent:#5b8aff;--accent-glow:rgba(91,138,255,0.20);
          --accent-badge:rgba(91,138,255,0.12);--shadow:0 8px 32px rgba(0,0,0,0.50);
          --shadow-card:0 4px 20px rgba(0,0,0,0.38);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}

        .up-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .up-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
        .up-logo-icon{width:34px;height:34px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;font-weight:800;}
        .up-nav-right{display:flex;align-items:center;gap:8px;}
        .up-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'DM Sans',sans-serif;}
        .up-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
        .up-nav-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.3);}
        .up-nav-btn.danger:hover{background:rgba(239,68,68,0.08);border-color:#ef4444;}
        .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;}

        .up-page{padding:88px 5vw 56px;max-width:800px;margin:0 auto;}

        /* HERO CARD */
        .up-hero{background:var(--bg-card);backdrop-filter:blur(24px);border:1px solid var(--border-card);border-radius:24px;padding:32px;box-shadow:var(--shadow-card);margin-bottom:24px;display:flex;align-items:center;gap:24px;animation:fadeUp .5s ease both;position:relative;overflow:hidden;}
        .up-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 0% 50%, var(--accent-badge), transparent);pointer-events:none;}
        .up-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#7c3aed);display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;font-weight:800;font-family:'Outfit',sans-serif;flex-shrink:0;box-shadow:0 8px 24px var(--accent-glow);}
        .up-hero-info{flex:1;min-width:0;}
        .up-hero-name{font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:800;color:var(--text-primary);margin-bottom:4px;}
        .up-hero-username{font-size:.88rem;color:var(--text-muted);margin-bottom:10px;}
        .up-role-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:var(--accent-badge);border:1px solid var(--border-card);color:var(--accent);font-size:.76rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}

        /* SECTIONS */
        .up-section{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:20px;padding:24px;box-shadow:var(--shadow-card);margin-bottom:16px;animation:fadeUp .5s ease both;}
        .up-section:nth-child(2){animation-delay:.06s;}
        .up-section:nth-child(3){animation-delay:.12s;}
        .up-section:nth-child(4){animation-delay:.18s;}
        .up-section-title{font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:700;color:var(--text-primary);margin-bottom:18px;display:flex;align-items:center;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--border-card);}
        .up-fields{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
        .up-field{display:flex;flex-direction:column;gap:4px;}
        .up-label{font-size:.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:5px;}
        .up-value{font-size:.92rem;color:var(--text-primary);font-weight:500;background:var(--bg-input);border:1px solid var(--border-card);border-radius:10px;padding:10px 13px;line-height:1.4;}
        .up-value.empty{color:var(--text-muted);font-style:italic;}
        .up-span2{grid-column:span 2;}

        .skel{border-radius:8px;background:var(--border-card);animation:shimmer 1.4s ease infinite;}
        @keyframes shimmer{0%,100%{opacity:.45}50%{opacity:.9}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .Toastify__toast{border-radius:14px!important;font-family:'DM Sans',sans-serif!important;}
        @media(max-width:560px){.up-fields{grid-template-columns:1fr}.up-span2{grid-column:span 1}.up-hero{flex-direction:column;text-align:center}.up-page{padding:80px 4vw 48px;}}
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme={dark ? "dark" : "light"}
      />

      <nav className="up-nav">
        <Link to="/citizen/dashboard" className="up-logo">
          <span className="up-logo-icon">CG</span>
          <span>CitizenGrievance</span>
        </Link>
        <div className="up-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/citizen/dashboard" className="up-nav-btn">
            Dashboard
          </Link>
          <Link to="/citizen/complaints" className="up-nav-btn">
            My Complaints
          </Link>
          <button
            className="up-nav-btn danger"
            onClick={() => {
              clearAuthCookies();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="up-page">
        {/* HERO */}
        <div className="up-hero">
          {loading ? (
            <div
              className="skel"
              style={{ width: 80, height: 80, borderRadius: "50%" }}
            />
          ) : (
            <div className="up-avatar">
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="up-hero-info">
            {loading ? (
              <>
                <div
                  className="skel"
                  style={{ height: 26, width: 200, marginBottom: 8 }}
                />
                <div
                  className="skel"
                  style={{ height: 16, width: 130, marginBottom: 12 }}
                />
                <div
                  className="skel"
                  style={{ height: 24, width: 100, borderRadius: 999 }}
                />
              </>
            ) : (
              <>
                <div className="up-hero-name">{profile?.name ?? "—"}</div>
                <div className="up-hero-username">
                  @{profile?.username ?? "—"}
                </div>
                <span className="up-role-badge">
                  🛡️ {ROLE_LABELS[profile?.role] ?? profile?.role}
                </span>
              </>
            )}
          </div>
        </div>

        {/* FIELD GROUPS */}
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div className="up-section" key={i}>
                <div
                  className="skel"
                  style={{ height: 18, width: 160, marginBottom: 18 }}
                />
                <div className="up-fields">
                  {[1, 2].map((j) => (
                    <SkeletonField key={j} />
                  ))}
                </div>
              </div>
            ))
          : FIELDS.map((group) => (
              <div className="up-section" key={group.group}>
                <div className="up-section-title">
                  {group.icon} {group.group}
                </div>
                <div className="up-fields">
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      className={`up-field${group.group === "Address" && item.label === "Address" ? " up-span2" : ""}`}
                    >
                      <span className="up-label">
                        {item.icon} {item.label}
                      </span>
                      <span
                        className={`up-value${!item.value ? " empty" : ""}`}
                      >
                        {item.value || "Not provided"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </>
  );

  function SkeletonField() {
    return (
      <div className="up-field">
        <div
          className="skel"
          style={{ height: 12, width: 80, marginBottom: 8 }}
        />
        <div className="skel" style={{ height: 42, borderRadius: 10 }} />
      </div>
    );
  }
}
