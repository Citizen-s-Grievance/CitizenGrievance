import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAuthToken,
  getAuthRole,
  clearAuthCookies,
  isLoggedIn,
} from "../../utils/authCookie";

const API_BASE = "http://localhost:8080";

async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthToken() ?? "",
      ...(options.headers || {}),
    },
  });
}

const STATUS_META = {
  SENT: {
    label: "Sent",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
    dot: "#818cf8",
    icon: "📤",
  },
  PENDING: {
    label: "Pending",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    dot: "#fbbf24",
    icon: "⏳",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    dot: "#38bdf8",
    icon: "🔄",
  },
  SOLVED: {
    label: "Resolved",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    dot: "#34d399",
    icon: "✅",
  },
  REJECTED: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    dot: "#f87171",
    icon: "❌",
  },
};
function getStatus(s) {
  return (
    STATUS_META[s?.toUpperCase()] || {
      label: s || "Unknown",
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.12)",
      dot: "#94a3b8",
      icon: "❓",
    }
  );
}

const DEPT_ICONS = { Electrical: "⚡", Water: "💧", Sewage: "🚰", Road: "🛣️" };
const DEPT_COLORS = {
  Electrical: { c: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  Water: { c: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  Sewage: { c: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  Road: { c: "#fb923c", bg: "rgba(251,146,60,0.12)" },
};

/* ── Animated counter ── */
function Counter({ to, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let start = 0;
    const step = Math.ceil(to / (duration / 16));
    const t = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(start);
      if (start >= to) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}</>;
}

/* ── Floating orbs background ── */
function OrbBg() {
  return (
    <div className="orb-bg" aria-hidden>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [stats, setStats] = useState(null);
  const [latestComplaint, setLatestComplaint] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good day");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    if (getAuthRole() === "ROLE_ADMIN") {
      navigate("/admin/dashboard");
      return;
    }
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    fetchStats();
    fetchLatestComplaint();
  }, []);

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/citizen/myStats`);
      if (res.status === 401) {
        handleExpired();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      setStats(await res.json());
    } catch (err) {
      toast.error(`❌ Failed to load stats: ${err.message}`);
      setStats({ total: 0, pending: 0, resolved: 0 });
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchLatestComplaint() {
    setRecentLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE}/citizen/getMyComplaints?page=0&size=1&sortBy=dateTime&sortOrder=desc`,
      );
      if (res.status === 401) {
        handleExpired();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list =
        data.complaints ?? (Array.isArray(data) ? data : (data.content ?? []));
      setLatestComplaint(list.length > 0 ? list[0] : false);
    } catch (err) {
      toast.error(`❌ Failed to load recent complaint: ${err.message}`);
      setLatestComplaint(false);
    } finally {
      setRecentLoading(false);
    }
  }

  function handleExpired() {
    clearAuthCookies();
    toast.error("🔒 Session expired. Please login again.");
    navigate("/login");
  }

  const totalVal = stats?.total ?? stats?.totalComplaints ?? 0;
  const pendingVal =
    stats?.in_progress ?? stats?.IN_PROGRESS ?? stats?.pending ?? 0;
  const resolvedVal = stats?.solved ?? stats?.SOLVED ?? stats?.resolved ?? 0;

  const resolvedPct =
    totalVal > 0 ? Math.round((resolvedVal / totalVal) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        :root[data-theme="light"]{
          --bg:#f0f4ff;--bg-card:rgba(255,255,255,0.82);--bg-nav:rgba(240,244,255,0.88);
          --bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);
          --border-card:rgba(99,120,220,0.20);--text-primary:#0f1b3d;--text-secondary:#3b4a7a;
          --text-muted:#6b7aaa;--accent:#2a52e8;--accent-glow:rgba(42,82,232,0.15);
          --accent-badge:rgba(42,82,232,0.09);--shadow:0 8px 32px rgba(42,82,232,0.10);
          --shadow-card:0 4px 20px rgba(42,82,232,0.08);
          --orb1:rgba(42,82,232,0.07);--orb2:rgba(99,102,241,0.06);--orb3:rgba(56,189,248,0.05);
        }
        :root[data-theme="dark"]{
          --bg:#080e24;--bg-card:rgba(14,22,58,0.82);--bg-nav:rgba(8,14,36,0.90);
          --bg-input:rgba(10,17,46,0.90);--border:rgba(80,120,255,0.15);
          --border-card:rgba(80,120,255,0.20);--text-primary:#e8eeff;--text-secondary:#a0b0e8;
          --text-muted:#5a6a9a;--accent:#5b8aff;--accent-glow:rgba(91,138,255,0.20);
          --accent-badge:rgba(91,138,255,0.12);--shadow:0 8px 32px rgba(0,0,0,0.45);
          --shadow-card:0 4px 20px rgba(0,0,0,0.35);
          --orb1:rgba(91,138,255,0.10);--orb2:rgba(129,140,248,0.08);--orb3:rgba(56,189,248,0.06);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;overflow-x:hidden;}

        /* ── ORB BACKGROUND ── */
        .orb-bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);}
        .orb-1{width:600px;height:600px;top:-200px;left:-200px;background:var(--orb1);animation:orbDrift 18s ease-in-out infinite alternate;}
        .orb-2{width:500px;height:500px;top:30%;right:-180px;background:var(--orb2);animation:orbDrift 22s ease-in-out infinite alternate-reverse;}
        .orb-3{width:400px;height:400px;bottom:-100px;left:30%;background:var(--orb3);animation:orbDrift 26s ease-in-out infinite alternate;}
        @keyframes orbDrift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.08)}100%{transform:translate(-20px,20px) scale(.95)}}

        /* ── NAV ── */
        .ud-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;transition:all .3s;font-family:'DM Sans',sans-serif;}
        .ud-nav.scrolled{background:var(--bg-nav);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);box-shadow:0 4px 24px rgba(0,0,0,0.08);}
        .ud-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
        .ud-logo-icon{width:34px;height:34px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;font-weight:800;}
        .ud-nav-right{display:flex;align-items:center;gap:8px;}
        .ud-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;backdrop-filter:blur(10px);}
        .ud-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
        .ud-nav-btn.logout{border-color:rgba(239,68,68,0.3);color:#ef4444;}
        .ud-nav-btn.logout:hover{background:rgba(239,68,68,0.08);border-color:#ef4444;}
        .ud-nav-cta{padding:8px 18px;border-radius:10px;background:var(--accent);color:#fff;font-size:.82rem;font-weight:700;text-decoration:none;transition:all .2s;box-shadow:0 4px 14px var(--accent-glow);font-family:'Outfit',sans-serif;}
        .ud-nav-cta:hover{opacity:.88;transform:translateY(-1px);}
        .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;backdrop-filter:blur(10px);}

        /* ── PAGE ── */
        .ud-page{position:relative;z-index:1;padding:0 5vw 72px;max-width:1100px;margin:0 auto;}

        /* ── HERO ── */
        .ud-hero{padding:110px 0 56px;display:flex;align-items:center;justify-content:space-between;gap:32px;animation:fadeUp .6s ease both;}
        .ud-hero-left{flex:1;max-width:600px;}
        .ud-hero-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:999px;background:var(--accent-badge);border:1px solid var(--border-card);color:var(--accent);font-size:.76rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:18px;}
        .ud-hero-badge-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:pulse-dot 2s ease infinite;}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
        .ud-hero h1{font-family:'Outfit',sans-serif;font-size:clamp(2rem,4.5vw,3rem);font-weight:900;color:var(--text-primary);line-height:1.15;margin-bottom:14px;letter-spacing:-.02em;}
        .ud-hero h1 em{font-style:normal;background:linear-gradient(135deg,var(--accent),#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .ud-hero-sub{font-size:1rem;color:var(--text-secondary);line-height:1.7;margin-bottom:32px;max-width:480px;}
        
        /* CTA BLOCK */
        .ud-hero-cta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
        .ud-cta-primary{display:inline-flex;align-items:center;gap:10px;padding:14px 28px;border-radius:14px;background:var(--accent);color:#fff;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:800;text-decoration:none;box-shadow:0 8px 28px var(--accent-glow);transition:all .25s;letter-spacing:.01em;border:none;cursor:pointer;}
        .ud-cta-primary:hover{transform:translateY(-3px);box-shadow:0 14px 36px var(--accent-glow);opacity:.94;}
        .ud-cta-primary:active{transform:translateY(-1px);}
        .ud-cta-primary .cta-arrow{font-size:1.1rem;transition:transform .2s;}
        .ud-cta-primary:hover .cta-arrow{transform:translateX(4px);}
        .ud-cta-secondary{display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:14px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-family:'Outfit',sans-serif;font-size:.92rem;font-weight:700;text-decoration:none;transition:all .22s;backdrop-filter:blur(12px);}
        .ud-cta-secondary:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-2px);}

        /* Hero right: visual ring */
        .ud-hero-visual{flex-shrink:0;width:220px;height:220px;position:relative;animation:fadeUp .6s ease .1s both;}
        .ud-hero-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--border-card);animation:spinSlow 20s linear infinite;}
        .ud-hero-ring-2{position:absolute;inset:16px;border-radius:50%;border:1.5px dashed var(--border-card);animation:spinSlow 14s linear infinite reverse;}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        .ud-hero-center{position:absolute;inset:32px;border-radius:50%;background:var(--accent-badge);display:flex;align-items:center;justify-content:center;font-size:3rem;border:1.5px solid var(--border-card);}
        .ud-hero-dot{position:absolute;width:10px;height:10px;border-radius:50%;background:var(--accent);}
        .ud-hero-dot:nth-child(1){top:-4px;left:50%;transform:translateX(-50%);}
        .ud-hero-dot:nth-child(2){bottom:-4px;left:50%;transform:translateX(-50%);background:#34d399;}
        .ud-hero-dot:nth-child(3){left:-4px;top:50%;transform:translateY(-50%);background:#fbbf24;}
        .ud-hero-dot:nth-child(4){right:-4px;top:50%;transform:translateY(-50%);background:#f87171;}

        /* ── STATS ── */
        .ud-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;animation:fadeUp .5s ease .15s both;}
        .ud-stat-card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:22px;padding:24px 22px;box-shadow:var(--shadow-card);transition:transform .22s,box-shadow .22s,border-color .22s;position:relative;overflow:hidden;}
        .ud-stat-card::before{content:'';position:absolute;top:0;right:0;width:80px;height:80px;border-radius:0 22px 0 80px;background:var(--accent-badge);transition:width .3s,height .3s;}
        .ud-stat-card:hover{transform:translateY(-4px);box-shadow:var(--shadow);border-color:var(--accent);}
        .ud-stat-card:hover::before{width:120px;height:120px;}
        .ud-stat-icon{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.35rem;margin-bottom:14px;position:relative;z-index:1;}
        .ud-stat-num{font-family:'Outfit',sans-serif;font-size:2.4rem;font-weight:900;line-height:1;margin-bottom:4px;position:relative;z-index:1;}
        .ud-stat-lbl{font-size:.74rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em;position:relative;z-index:1;}
        .ud-skel{border-radius:8px;background:var(--border-card);animation:shimmer 1.4s ease infinite;}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.85}}

        /* ── RESOLUTION PROGRESS ── */
        .ud-resolution{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:22px;padding:24px 26px;margin-bottom:40px;animation:fadeUp .5s ease .22s both;}
        .ud-res-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .ud-res-title{font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:700;color:var(--text-primary);}
        .ud-res-pct{font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:900;color:#34d399;}
        .ud-res-track{height:10px;border-radius:999px;background:var(--border-card);overflow:hidden;margin-bottom:12px;}
        .ud-res-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#34d399,#38bdf8);transition:width 1.2s cubic-bezier(.34,1.2,.64,1);}
        .ud-res-labels{display:flex;justify-content:space-between;font-size:.76rem;color:var(--text-muted);font-weight:600;}

        /* ── SECTION HEAD ── */
        .ud-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;animation:fadeUp .5s ease .28s both;}
        .ud-section-title{font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;}
        .ud-view-all{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;font-weight:700;color:var(--accent);text-decoration:none;padding:6px 12px;border-radius:8px;border:1.5px solid var(--border-card);background:var(--bg-card);transition:all .2s;}
        .ud-view-all:hover{border-color:var(--accent);transform:translateX(2px);}

        /* ── RECENT CARD ── */
        .ud-recent-card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:22px;padding:26px;box-shadow:var(--shadow-card);cursor:pointer;transition:all .22s;animation:fadeUp .5s ease .3s both;position:relative;overflow:hidden;}
        .ud-recent-card::after{content:'View details →';position:absolute;bottom:22px;right:24px;font-size:.78rem;font-weight:700;color:var(--accent);opacity:0;transform:translateX(-6px);transition:all .22s;}
        .ud-recent-card:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:var(--accent);}
        .ud-recent-card:hover::after{opacity:1;transform:translateX(0);}
        .ud-complaint-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;}
        .ud-complaint-dept{display:flex;align-items:center;gap:12px;}
        .ud-dept-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;}
        .ud-dept-name{font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);}
        .ud-dept-district{font-size:.78rem;color:var(--text-muted);margin-top:3px;display:flex;align-items:center;gap:4px;}
        .ud-status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 13px;border-radius:999px;font-size:.75rem;font-weight:700;white-space:nowrap;flex-shrink:0;border:1px solid transparent;}
        .ud-status-dot{width:6px;height:6px;border-radius:50%;}
        .ud-complaint-body{font-size:.9rem;color:var(--text-secondary);line-height:1.65;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .ud-complaint-meta{display:flex;gap:16px;flex-wrap:wrap;}
        .ud-meta-item{display:flex;align-items:center;gap:5px;font-size:.76rem;color:var(--text-muted);font-weight:500;}
        .ud-divider{height:1px;background:var(--border-card);margin:16px 0;}

        /* ── DEPT BREAKDOWN ── */
        .ud-dept-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-card);}
        .ud-dept-row:last-child{border-bottom:none;}
        .ud-dept-mini{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}
        .ud-dept-bar-wrap{flex:1;}
        .ud-dept-bar-label{display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-muted);font-weight:600;margin-bottom:5px;}
        .ud-dept-bar-track{height:5px;border-radius:999px;background:var(--border-card);overflow:hidden;}
        .ud-dept-bar-fill{height:100%;border-radius:999px;transition:width 1.2s cubic-bezier(.34,1.2,.64,1);}

        /* ── EMPTY ── */
        .ud-empty{background:var(--bg-card);backdrop-filter:blur(20px);border:2px dashed var(--border-card);border-radius:22px;padding:52px 32px;text-align:center;animation:fadeUp .5s ease .3s both;}
        .ud-empty-emoji{font-size:3.4rem;display:block;margin-bottom:16px;animation:float 3s ease-in-out infinite;}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .ud-empty h3{font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:800;margin-bottom:8px;}
        .ud-empty p{font-size:.88rem;color:var(--text-secondary);line-height:1.65;max-width:340px;margin:0 auto 24px;}
        .ud-file-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border-radius:14px;background:var(--accent);color:#fff;font-family:'Outfit',sans-serif;font-size:.93rem;font-weight:800;text-decoration:none;box-shadow:0 6px 24px var(--accent-glow);transition:all .2s;}
        .ud-file-btn:hover{opacity:.88;transform:translateY(-2px);}

        /* Skeleton */
        .ud-recent-skel{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:22px;padding:28px;animation:fadeUp .5s ease .3s both;}

        /* ── TWO-COL BOTTOM ── */
        .ud-bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px;animation:fadeUp .5s ease .35s both;}
        .ud-bottom-card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:22px;padding:24px;box-shadow:var(--shadow-card);}
        .ud-bottom-title{font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:700;color:var(--text-primary);margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border-card);}

        /* Quick tips */
        .ud-tip{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-card);}
        .ud-tip:last-child{border-bottom:none;}
        .ud-tip-icon{width:32px;height:32px;border-radius:10px;background:var(--accent-badge);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;}
        .ud-tip-text{font-size:.82rem;color:var(--text-secondary);line-height:1.5;}
        .ud-tip-text strong{color:var(--text-primary);display:block;margin-bottom:2px;font-size:.82rem;}

        /* ── UTILS ── */
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .Toastify__toast{border-radius:14px!important;font-family:'DM Sans',sans-serif!important;}

        @media(max-width:768px){
          .ud-stats-row{grid-template-columns:1fr 1fr;}
          .ud-bottom-grid{grid-template-columns:1fr;}
          .ud-hero{flex-direction:column;padding:90px 0 40px;}
          .ud-hero-visual{display:none;}
          .ud-page{padding:0 4vw 60px;}
        }
        @media(max-width:480px){
          .ud-stats-row{grid-template-columns:1fr;}
          .ud-nav-btn.hide-sm{display:none;}
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme={dark ? "dark" : "light"}
      />
      <OrbBg />

      {/* ── NAV ── */}
      <nav className={`ud-nav ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="ud-logo">
          <span className="ud-logo-icon">CG</span>
          <span>CitizenGrievance</span>
        </Link>
        <div className="ud-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/citizen/complaints" className="ud-nav-btn hide-sm">
            My Complaints
          </Link>
          <Link to="/citizen/profile" className="ud-nav-btn hide-sm">
            Profile
          </Link>
          <button
            className="ud-nav-btn logout"
            onClick={() => {
              clearAuthCookies();
              navigate("/login");
            }}
          >
            Logout
          </button>
          <Link to="/citizen/file-complaint" className="ud-nav-cta">
            + File Complaint
          </Link>
        </div>
      </nav>

      <div className="ud-page">
        {/* ── HERO ── */}
        <div className="ud-hero">
          <div className="ud-hero-left">
            <div className="ud-hero-badge">
              <span className="ud-hero-badge-dot" />
              👤 Citizen Dashboard
            </div>
            <h1>
              {greeting},<br />
              <em>Citizen!</em>
            </h1>
            <p className="ud-hero-sub">
              Your voice matters. Report municipal issues — roads, water,
              electricity, sewage — and track every step of the resolution
              process in real time.
            </p>
            <div className="ud-hero-cta">
              <Link to="/citizen/file-complaint" className="ud-cta-primary">
                📝 File a Complaint <span className="cta-arrow">→</span>
              </Link>
              <Link to="/citizen/complaints" className="ud-cta-secondary">
                📋 View My Complaints
              </Link>
            </div>
          </div>

          <div className="ud-hero-visual">
            <div className="ud-hero-ring">
              <span className="ud-hero-dot" />
              <span className="ud-hero-dot" />
              <span className="ud-hero-dot" />
              <span className="ud-hero-dot" />
            </div>
            <div className="ud-hero-ring-2" />
            <div className="ud-hero-center">🏛️</div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="ud-stats-row">
          {[
            {
              label: "Total Filed",
              val: totalVal,
              color: "#818cf8",
              bg: "rgba(129,140,248,0.12)",
              icon: "📋",
            },
            {
              label: "In Progress",
              val: pendingVal,
              color: "#fbbf24",
              bg: "rgba(251,191,36,0.12)",
              icon: "⏳",
            },
            {
              label: "Resolved",
              val: resolvedVal,
              color: "#34d399",
              bg: "rgba(52,211,153,0.12)",
              icon: "✅",
            },
          ].map((s, i) => (
            <div
              className="ud-stat-card"
              key={s.label}
              style={{ animationDelay: `${0.1 + i * 0.07}s` }}
            >
              <div className="ud-stat-icon" style={{ background: s.bg }}>
                {s.icon}
              </div>
              {statsLoading ? (
                <>
                  <div
                    className="ud-skel"
                    style={{
                      height: 38,
                      width: 80,
                      marginBottom: 8,
                      borderRadius: 10,
                    }}
                  />
                  <div
                    className="ud-skel"
                    style={{ height: 12, width: 110, borderRadius: 6 }}
                  />
                </>
              ) : (
                <>
                  <div className="ud-stat-num" style={{ color: s.color }}>
                    <Counter to={s.val} />
                  </div>
                  <div className="ud-stat-lbl">{s.label}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── RESOLUTION RATE ── */}
        {!statsLoading && totalVal > 0 && (
          <div className="ud-resolution">
            <div className="ud-res-head">
              <div className="ud-res-title">Resolution Rate</div>
              <div className="ud-res-pct">{resolvedPct}%</div>
            </div>
            <div className="ud-res-track">
              <div
                className="ud-res-fill"
                style={{ width: `${resolvedPct}%` }}
              />
            </div>
            <div className="ud-res-labels">
              <span>{resolvedVal} resolved</span>
              <span>{totalVal - resolvedVal} pending / in progress</span>
            </div>
          </div>
        )}

        {/* ── MOST RECENT ── */}
        <div className="ud-section-head">
          <span className="ud-section-title">🕐 Most Recent Complaint</span>
          {latestComplaint && (
            <Link to="/citizen/complaints" className="ud-view-all">
              View all →
            </Link>
          )}
        </div>

        {recentLoading ? (
          <div className="ud-recent-skel">
            <div
              className="ud-skel"
              style={{
                height: 22,
                width: "40%",
                marginBottom: 16,
                borderRadius: 8,
              }}
            />
            <div
              className="ud-skel"
              style={{
                height: 15,
                width: "90%",
                marginBottom: 8,
                borderRadius: 6,
              }}
            />
            <div
              className="ud-skel"
              style={{ height: 15, width: "70%", borderRadius: 6 }}
            />
          </div>
        ) : latestComplaint ? (
          <div
            className="ud-recent-card"
            onClick={() => navigate("/citizen/complaints")}
          >
            <div className="ud-complaint-header">
              <div className="ud-complaint-dept">
                <div
                  className="ud-dept-icon"
                  style={{
                    background:
                      DEPT_COLORS[latestComplaint.department]?.bg ??
                      "var(--accent-badge)",
                  }}
                >
                  {DEPT_ICONS[latestComplaint.department] || "📋"}
                </div>
                <div>
                  <div className="ud-dept-name">
                    {latestComplaint.department || "General"} Complaint
                  </div>
                  <div className="ud-dept-district">
                    📍{" "}
                    {latestComplaint.district ||
                      latestComplaint.landmark ||
                      "—"}
                  </div>
                </div>
              </div>
              {(() => {
                const s = getStatus(latestComplaint.status);
                return (
                  <span
                    className="ud-status-badge"
                    style={{
                      color: s.color,
                      background: s.bg,
                      borderColor: `${s.dot}33`,
                    }}
                  >
                    <span
                      className="ud-status-dot"
                      style={{ background: s.dot }}
                    />
                    {s.label}
                  </span>
                );
              })()}
            </div>
            <p className="ud-complaint-body">
              {latestComplaint.complaintInWords ||
                latestComplaint.complaintsInWords ||
                "No description provided."}
            </p>
            <div className="ud-divider" />
            <div className="ud-complaint-meta">
              {latestComplaint.dateTime && (
                <span className="ud-meta-item">
                  🗓️{" "}
                  {new Date(latestComplaint.dateTime).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {latestComplaint.landmark && (
                <span className="ud-meta-item">
                  📌 {latestComplaint.landmark}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="ud-empty">
            <span className="ud-empty-emoji">📭</span>
            <h3>No complaints filed yet</h3>
            <p>
              Haven't faced any municipal issues? Great! But if you do — roads,
              water, electricity or sewage — we're here to help.
            </p>
            <Link to="/citizen/file-complaint" className="ud-file-btn">
              📝 File Your First Complaint
            </Link>
          </div>
        )}

        {/* ── BOTTOM GRID ── */}
        <div className="ud-bottom-grid">
          {/* Dept breakdown */}
          <div className="ud-bottom-card">
            <div className="ud-bottom-title">📊 Department Overview</div>
            {["Electrical", "Water", "Sewage", "Road"].map((dept, i) => {
              const dc = DEPT_COLORS[dept];
              return (
                <div className="ud-dept-row" key={dept}>
                  <div className="ud-dept-mini" style={{ background: dc.bg }}>
                    {DEPT_ICONS[dept]}
                  </div>
                  <div className="ud-dept-bar-wrap">
                    <div className="ud-dept-bar-label">
                      <span>{dept}</span>
                      <span style={{ color: dc.c }}>
                        {
                          [
                            "⚡ Power grid",
                            "💧 Water supply",
                            "🚰 Drainage",
                            "🛣️ Roads & paths",
                          ][i]
                        }
                      </span>
                    </div>
                    <div className="ud-dept-bar-track">
                      <div
                        className="ud-dept-bar-fill"
                        style={{
                          width: `${[75, 60, 40, 85][i]}%`,
                          background: `linear-gradient(90deg,${dc.c},${dc.c}88)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="ud-bottom-card">
            <div className="ud-bottom-title">💡 Filing Tips</div>
            {[
              [
                "📸",
                "Add a clear photo",
                "A sharp photo helps authorities identify and prioritize your complaint faster.",
              ],
              [
                "📍",
                "Pin your location",
                "Use GPS detection for accurate location — it speeds up dispatch significantly.",
              ],
              [
                "🎙️",
                "Record your voice",
                "A short audio note gives context that text alone can't convey.",
              ],
              [
                "📝",
                "Be specific",
                "Mention the exact landmark and describe the severity clearly.",
              ],
            ].map(([icon, head, body]) => (
              <div className="ud-tip" key={head}>
                <div className="ud-tip-icon">{icon}</div>
                <div className="ud-tip-text">
                  <strong>{head}</strong>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
