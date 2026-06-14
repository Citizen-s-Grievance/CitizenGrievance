import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: "🎙️",
      title: "Voice & Photo Complaint",
      desc: "Record audio or upload an image of the issue directly from your phone.",
    },
    {
      icon: "📍",
      title: "GPS Location Tagging",
      desc: "Auto-detect your location so the right district team gets notified instantly.",
    },
    {
      icon: "🔄",
      title: "Real-Time Status",
      desc: "Track your complaint from SENT → IN PROGRESS → SOLVED in real time.",
    },
    {
      icon: "🤖",
      title: "AI-Powered Analysis",
      desc: "Our AI model auto-categorises and summarises complaints for faster resolution.",
    },
    {
      icon: "🏛️",
      title: "District Administration",
      desc: "Each district department has a dedicated admin to own and resolve issues.",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      desc: "JWT authentication, OTP email verification, and BCrypt password protection.",
    },
    {
      icon: "🗺️",
      title: "Live Grievance Mapping",
      desc: "WebSocket-powered geospatial map tracking incoming complaints across all districts in real time.",
    },
  ];

  const departments = ["Electrical", "Water", "Sewage", "Road"];

  const steps = [
    {
      num: "01",
      title: "Register",
      desc: "Create your citizen account with OTP email verification.",
    },
    {
      num: "02",
      title: "File Complaint",
      desc: "Describe the issue, attach photo & audio, pin the location.",
    },
    {
      num: "03",
      title: "Track Status",
      desc: "Get updates as your complaint moves through resolution stages.",
    },
    {
      num: "04",
      title: "Issue Resolved",
      desc: "Admin uploads proof of repair. Issue marked Solved.",
    },
  ];

  return (
    <>
      <style>{`
        :root[data-theme="light"] {
          --bg-base: #f0f4ff;
          --bg-surface: rgba(255,255,255,0.55);
          --bg-card: rgba(255,255,255,0.65);
          --bg-nav: rgba(240,244,255,0.75);
          --border: rgba(99,120,220,0.18);
          --border-card: rgba(99,120,220,0.22);
          --text-primary: #0f1b3d;
          --text-secondary: #3b4a7a;
          --text-muted: #6b7aaa;
          --accent: #2a52e8;
          --accent-light: #e8edff;
          --accent-glow: rgba(42,82,232,0.15);
          --badge-bg: rgba(42,82,232,0.10);
          --badge-text: #1a3ab8;
          --hero-grad: linear-gradient(135deg,#e8edff 0%,#f0f4ff 50%,#e4f0ff 100%);
          --step-bg: rgba(42,82,232,0.06);
          --shadow: 0 8px 32px rgba(42,82,232,0.10);
          --shadow-card: 0 4px 24px rgba(42,82,232,0.08);
        }
        :root[data-theme="dark"] {
          --bg-base: #080e24;
          --bg-surface: rgba(15,24,60,0.60);
          --bg-card: rgba(18,28,70,0.65);
          --bg-nav: rgba(8,14,36,0.80);
          --border: rgba(80,120,255,0.18);
          --border-card: rgba(80,120,255,0.22);
          --text-primary: #e8eeff;
          --text-secondary: #a0b0e8;
          --text-muted: #6070b0;
          --accent: #5b8aff;
          --accent-light: rgba(91,138,255,0.12);
          --accent-glow: rgba(91,138,255,0.20);
          --badge-bg: rgba(91,138,255,0.15);
          --badge-text: #90b4ff;
          --hero-grad: linear-gradient(135deg,#080e24 0%,#0d1840 50%,#080e24 100%);
          --step-bg: rgba(91,138,255,0.08);
          --shadow: 0 8px 32px rgba(0,0,0,0.40);
          --shadow-card: 0 4px 24px rgba(0,0,0,0.30);
        }

        * { margin:0; padding:0; box-sizing:border-box; }

        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: var(--bg-base);
          color: var(--text-primary);
          transition: background 0.3s, color 0.3s;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top:0; left:0; right:0; z-index:100;
          padding: 0 5vw;
          height: 64px;
          display: flex; align-items:center; justify-content:space-between;
          background: var(--bg-nav);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          transition: all 0.3s;
        }
        .nav.scrolled { box-shadow: var(--shadow); }

        /* FIX: logo uses flex with gap; icon box and text are separate elements */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          background: var(--accent);
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .nav-logo-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .nav-actions { display:flex; align-items:center; gap:12px; }
        .btn-ghost {
          padding: 8px 18px;
          border-radius: 10px;
          border: 1.5px solid var(--border-card);
          background: var(--bg-card);
          backdrop-filter: blur(10px);
          color: var(--text-primary);
          font-size:0.875rem; font-weight:600;
          cursor:pointer; text-decoration:none;
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .btn-accent {
          padding: 8px 20px;
          border-radius: 10px;
          border: none;
          background: var(--accent);
          color: #fff;
          font-size:0.875rem; font-weight:700;
          cursor:pointer; text-decoration:none;
          transition: all 0.2s;
        }
        .btn-accent:hover { opacity:0.88; transform:translateY(-1px); }
        .theme-toggle {
          width:38px; height:38px;
          border-radius:10px;
          border: 1.5px solid var(--border-card);
          background: var(--bg-card);
          backdrop-filter:blur(10px);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:1.1rem;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .theme-toggle:hover { border-color:var(--accent); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction:column;
          align-items:center; justify-content:center;
          text-align:center;
          padding: 120px 5vw 80px;
          background: var(--hero-grad);
          position:relative; overflow:hidden;
        }
        .hero::before {
          content:'';
          position:absolute; inset:0;
          background: radial-gradient(ellipse 60% 50% at 50% 30%, var(--accent-glow), transparent);
          pointer-events:none;
        }
        .hero-badge {
          display:inline-flex; align-items:center; gap:8px;
          padding: 6px 16px;
          border-radius:999px;
          background: var(--badge-bg);
          border: 1px solid var(--border-card);
          color: var(--badge-text);
          font-size:0.8rem; font-weight:600;
          margin-bottom:1.5rem;
          backdrop-filter:blur(10px);
        }
        .hero-badge span { font-size:0.75rem; }
        .hero h1 {
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 800;
          line-height:1.15;
          color: var(--text-primary);
          max-width:780px;
          margin-bottom:1.25rem;
        }
        .hero h1 em {
          font-style:normal;
          color: var(--accent);
        }
        .hero p {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: var(--text-secondary);
          max-width:560px;
          line-height:1.7;
          margin-bottom:2.5rem;
        }
        .hero-cta {
          display:flex; gap:14px; flex-wrap:wrap; justify-content:center;
          margin-bottom:3rem;
        }
        .btn-hero-primary {
          padding: 14px 32px;
          border-radius: 12px;
          background: var(--accent);
          color:#fff;
          font-size:1rem; font-weight:700;
          text-decoration:none;
          border:none; cursor:pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px var(--accent-glow);
        }
        .btn-hero-primary:hover { opacity:0.88; transform:translateY(-2px); }
        .btn-hero-secondary {
          padding: 14px 32px;
          border-radius:12px;
          background: var(--bg-card);
          backdrop-filter:blur(10px);
          border: 1.5px solid var(--border-card);
          color: var(--text-primary);
          font-size:1rem; font-weight:600;
          text-decoration:none;
          cursor:pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-hero-secondary:hover { border-color:var(--accent); color:var(--accent); }

        /* ── STATS ── */
        .stats-row {
          display:flex; gap:32px; justify-content:center; flex-wrap:wrap;
        }
        .stat-item { text-align:center; }
        .stat-num {
          font-size:1.8rem; font-weight:800; color:var(--accent);
          display:block;
        }
        .stat-label {
          font-size:0.8rem; color:var(--text-muted); margin-top:2px;
        }

        /* ── GLASS CARD ── */
        .glass {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-card);
          border-radius:18px;
          box-shadow: var(--shadow-card);
        }

        /* ── SECTION ── */
        section { padding: 80px 5vw; }
        .section-label {
          font-size:0.78rem; font-weight:700; letter-spacing:0.1em;
          color:var(--accent); text-transform:uppercase;
          margin-bottom:12px;
        }
        .section-title {
          font-size: clamp(1.6rem,3vw,2.4rem);
          font-weight:800; color:var(--text-primary);
          margin-bottom:0.75rem; line-height:1.2;
        }
        .section-sub {
          font-size:1rem; color:var(--text-secondary);
          max-width:540px; line-height:1.7;
          margin-bottom:3rem;
        }

        /* ── DEPT PILLS ── */
        .dept-row {
          display:flex; gap:12px; flex-wrap:wrap; margin-bottom:3rem;
        }
        .dept-pill {
          padding:8px 20px;
          border-radius:999px;
          background:var(--badge-bg);
          border:1px solid var(--border-card);
          color:var(--badge-text);
          font-size:0.875rem; font-weight:600;
          backdrop-filter:blur(10px);
        }

        /* ── FEATURE GRID ── */
        .feature-grid {
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(260px,1fr));
          gap:20px;
        }
        .feature-card {
          padding:24px;
          border-radius:18px;
          background:var(--bg-card);
          backdrop-filter:blur(20px);
          border:1px solid var(--border-card);
          box-shadow:var(--shadow-card);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform:translateY(-4px);
          box-shadow: var(--shadow);
          border-color:var(--accent);
        }
        .feature-icon {
          font-size:2rem; margin-bottom:14px; display:block;
        }
        .feature-title {
          font-size:1rem; font-weight:700;
          color:var(--text-primary); margin-bottom:8px;
        }
        .feature-desc {
          font-size:0.875rem; color:var(--text-secondary); line-height:1.6;
        }

        /* ── HOW IT WORKS ── */
        .steps-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:20px;
        }
        .step-card {
          padding:28px 22px;
          border-radius:18px;
          background:var(--step-bg);
          border:1px solid var(--border-card);
          text-align:center;
          position:relative;
          backdrop-filter:blur(12px);
        }
        .step-num {
          font-size:2.5rem; font-weight:900;
          color:var(--accent); opacity:0.25;
          margin-bottom:8px; display:block;
          line-height:1;
        }
        .step-title {
          font-size:1rem; font-weight:700;
          color:var(--text-primary); margin-bottom:8px;
        }
        .step-desc {
          font-size:0.82rem; color:var(--text-secondary); line-height:1.6;
        }

        /* ── CTA SECTION ── */
        .cta-section {
          padding: 80px 5vw;
          text-align:center;
        }
        .cta-box {
          max-width:680px; margin:0 auto;
          padding:56px 40px;
          border-radius:24px;
          background:var(--bg-card);
          backdrop-filter:blur(24px);
          border:1px solid var(--border-card);
          box-shadow: var(--shadow);
          position:relative; overflow:hidden;
        }
        .cta-box::before {
          content:'';
          position:absolute; inset:0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-glow), transparent);
          pointer-events:none;
        }
        .cta-box h2 {
          font-size:clamp(1.5rem,3vw,2.2rem);
          font-weight:800; color:var(--text-primary);
          margin-bottom:1rem; position:relative;
        }
        .cta-box p {
          color:var(--text-secondary); font-size:1rem;
          line-height:1.7; margin-bottom:2rem; position:relative;
        }
        .cta-buttons {
          display:flex; gap:14px; justify-content:center;
          flex-wrap:wrap; position:relative;
        }

        /* ── FOOTER ── */
        footer {
          padding: 32px 5vw;
          border-top:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:12px;
        }
        footer p { font-size:0.82rem; color:var(--text-muted); }

        @media(max-width:600px){
          .nav-logo-text { display:none; }
          .hero h1 { font-size:2rem; }
          .cta-box { padding:36px 20px; }
          footer { flex-direction:column; text-align:center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <a className="nav-logo" href="/">
          <span className="nav-logo-icon">CG</span>
          <span className="nav-logo-text">CitizenGrievance</span>
        </a>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/login" className="btn-ghost">
            Login
          </Link>
          <Link to="/register/user" className="btn-accent">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <span>🏛️</span>
          <span>Telangana Government — 33 Districts</span>
        </div>
        <h1>
          Your Voice.
          <br />
          <em>Your District.</em>
          <br />
          Your Right.
        </h1>
        <p>
          File municipal complaints about Electrical, Water, Sewage, and Road
          issues directly to your district administration — with photos, audio,
          and GPS proof.
        </p>
        <div className="hero-cta">
          <Link to="/register/user" className="btn-hero-primary">
            File a Complaint →
          </Link>
          {/* CHANGED: replaced Admin Login with View Live Map */}
          <Link to="/live-map" className="btn-hero-secondary">
            🗺️ View Live Map
          </Link>
        </div>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-num">33</span>
            <span className="stat-label">Districts Covered</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">4</span>
            <span className="stat-label">Departments</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">AI</span>
            <span className="stat-label">Powered Analysis</span>
          </div>
          <div className="stat-item">
            <span className="stat-num">24/7</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section>
        <p className="section-label">Departments</p>
        <h2 className="section-title">What Can You Report?</h2>
        <p className="section-sub">
          Every complaint reaches the right department in your district
          automatically — no phone calls, no waiting in queues.
        </p>
        <div className="dept-row">
          {departments.map((d) => (
            <span key={d} className="dept-pill">
              {d}
            </span>
          ))}
        </div>

        {/* FEATURES */}
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card glass">
              <span className="feature-icon">{f.icon}</span>
              <p className="feature-title">{f.title}</p>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <p className="section-label">Process</p>
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">
          Four simple steps from filing to resolution — fully transparent, fully
          trackable.
        </p>
        <div className="steps-grid">
          {steps.map((s) => (
            <div key={s.num} className="step-card">
              <span className="step-num">{s.num}</span>
              <p className="step-title">{s.title}</p>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-box glass">
          <h2>Ready to Make Your Voice Heard?</h2>
          <p>
            Join thousands of Telangana citizens who are actively making their
            districts better — one complaint at a time.
          </p>
          <div className="cta-buttons">
            <Link to="/register/user" className="btn-hero-primary">
              Register as Citizen →
            </Link>
            <Link to="/register/admin" className="btn-hero-secondary">
              Admin Registration
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <p>© 2026 Citizen Grievance System — Telangana, India</p>
        <p>Built with Spring Boot · React · MongoDB · MySQL</p>
      </footer>
    </>
  );
};

export default Home;
