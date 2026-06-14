import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ─────────────────────────────────────────────
   CONSTANTS
   Using separate keys so admin & user sessions
   never collide in localStorage
───────────────────────────────────────────── */
const API_BASE = "http://localhost:8080";
const TOKEN_KEY = "admin_reg_token";
const TOKEN_EXPIRY_KEY = "admin_reg_token_expiry";
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

/* ─────────────────────────────────────────────
   TOKEN HELPERS
───────────────────────────────────────────── */
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, Date.now() + TOKEN_TTL_MS);
}

function getToken() {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry || Date.now() > Number(expiry)) {
    clearToken();
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

function getRemainingMs() {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return 0;
  return Math.max(0, Number(expiry) - Date.now());
}

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
const DISTRICTS = [
  "Adilabad",
  "Kumuram Bheem Asifabad",
  "Mancherial",
  "Nirmal",
  "Nizamabad",
  "Jagtial",
  "Peddapalli",
  "Kamareddy",
  "Rajanna Sircilla",
  "Karimnagar",
  "Jayashankar Bhupalpally",
  "Sangareddy",
  "Medak",
  "Siddipet",
  "Jangaon",
  "Hanumakonda",
  "Warangal",
  "Mulugu",
  "Bhadradri Kothagudem",
  "Khammam",
  "Mahabubabad",
  "Suryapet",
  "Nalgonda",
  "Yadadri Bhuvanagiri",
  "Medchal Malkajgiri",
  "Hyderabad",
  "Ranga Reddy",
  "Vikarabad",
  "Mahabubnagar",
  "Narayanpet",
  "Jogulamba Gadwal",
  "Wanaparthy",
  "Nagarkurnool",
];

// Must match exactly what's in your MunicipalProblems table
const DEPARTMENTS = ["Electrical", "Water", "Sewage", "Road"];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function AdminRegister() {
  const navigate = useNavigate();

  // UI state
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  // Form fields — matches AdministrationRegistrationRequest
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    district: "",
    department: "",
  });

  // Inline field errors
  const [errors, setErrors] = useState({});

  // OTP / credentials
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Token countdown
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);
  const expireTimerRef = useRef(null);
  const otpRefs = useRef([]);

  /* ── theme sync ── */
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  /* ── check existing token on mount ── */
  useEffect(() => {
    const token = getToken();
    if (token) {
      setStep("otp");
      startCountdown();
    }
    return () => stopCountdown();
  }, []);

  /* ── countdown ── */
  function startCountdown() {
    stopCountdown();
    setRemaining(getRemainingMs());
    timerRef.current = setInterval(() => {
      const left = getRemainingMs();
      setRemaining(left);
      if (left <= 0) {
        stopCountdown();
        handleTokenExpired();
      }
    }, 1000);
  }

  function stopCountdown() {
    clearInterval(timerRef.current);
    clearTimeout(expireTimerRef.current);
  }

  function handleTokenExpired() {
    clearToken();
    setStep("form");
    toast.error("⏰ Session expired. Please register again.", {
      toastId: "expired",
    });
  }

  /* ── generic field change ── */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  }

  /* ── phone: digits only, max 10 ── */
  function handlePhoneChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, phoneNumber: digits }));
    if (digits.length > 0 && digits.length < 10)
      setErrors((er) => ({
        ...er,
        phoneNumber: "Phone number must be 10 digits.",
      }));
    else setErrors((er) => ({ ...er, phoneNumber: "" }));
  }

  /* ── OTP box handlers ── */
  function handleOtpChange(idx, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function handleOtpKeyDown(idx, e) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  }

  /* ─────────────────────────────────────────────
     STEP 1 — INITIATE REGISTRATION
  ───────────────────────────────────────────── */
  async function handleInitiate(e) {
    e.preventDefault();

    // Field-level validation
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    if (form.phoneNumber.length !== 10)
      newErrors.phoneNumber = "Phone number must be exactly 10 digits.";
    if (!form.district) newErrors.district = "Please select a district.";
    if (!form.department) newErrors.department = "Please select a department.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning("⚠️ Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register/admin/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.text();

      if (res.ok) {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = null;
        }

        // Backend key: "registrationToken FOR Administration Registration "
        const token =
          parsed?.["registrationToken FOR Administration Registration "] ||
          parsed?.registrationToken ||
          parsed?.token ||
          null;

        if (!token) {
          toast.error(
            "Registration initiated but no token received from server.",
          );
          return;
        }

        saveToken(token);
        setStep("otp");
        startCountdown();

        const msg = parsed?.message || `OTP sent to ${form.email}`;
        toast.success(`✅ ${msg}`);
      } else if (res.status === 409) {
        // UserAlreadyExistsException OR DistrictAndDepartmentException
        toast.error(`⚠️ ${data || "Conflict: already registered."}`);
      } else if (res.status === 500) {
        // Department/District not found in DB → backend throws RuntimeException → 500
        toast.error(`❌ ${data || "Server error. Check department/district."}`);
      } else {
        toast.error(`❌ ${data || "Something went wrong. Please try again."}`);
      }
    } catch (err) {
      toast.error("🔌 Cannot reach server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  /* ─────────────────────────────────────────────
     STEP 2 — VERIFY OTP
  ───────────────────────────────────────────── */
  async function handleVerify(e) {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      handleTokenExpired();
      return;
    }

    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      toast.warning("Enter the full 6-digit OTP.");
      return;
    }
    if (!username.trim()) {
      toast.warning("Please choose a username.");
      return;
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ otp: otpStr, username, password });
      const res = await fetch(
        `${API_BASE}/register/admin/verify?${params.toString()}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.text();

      if (res.ok) {
        stopCountdown();
        clearToken();
        toast.success(
          "🎉 Admin registration successful! Redirecting to login…",
        );
        setTimeout(() => navigate("/login"), 2000);
      } else if (res.status === 401) {
        // SessionExpiredException
        stopCountdown();
        clearToken();
        setStep("form");
        toast.error(`🔒 ${data || "Session expired. Please register again."}`);
      } else if (res.status === 400) {
        // InvalidOtpException
        toast.error(`❌ ${data || "Invalid OTP. Please check and try again."}`);
      } else if (res.status === 403) {
        // Wrong token type
        toast.error(`🚫 ${data || "Invalid token type."}`);
      } else if (res.status === 409) {
        // UserAlreadyExistsException (username taken)
        toast.error(
          `⚠️ ${data || "Username already taken! Please try a different one."}`,
        );
      } else {
        toast.error(`❌ ${data || "Verification failed. Try again."}`);
      }
    } catch (err) {
      toast.error("🔌 Cannot reach server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  /* ── go back to form ── */
  function handleBack() {
    stopCountdown();
    clearToken();
    setStep("form");
    setOtp(["", "", "", "", "", ""]);
  }

  /* ── countdown display ── */
  const mins = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const pct = (remaining / TOKEN_TTL_MS) * 100;
  const urgentColor =
    remaining < 60000
      ? "var(--danger)"
      : remaining < 120000
        ? "var(--warn)"
        : "var(--accent)";

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

        :root[data-theme="light"] {
          --bg-base: #f0f4ff;
          --bg-card: rgba(255,255,255,0.75);
          --bg-nav: rgba(240,244,255,0.80);
          --bg-input: rgba(255,255,255,0.9);
          --border: rgba(99,120,220,0.18);
          --border-card: rgba(99,120,220,0.22);
          --border-input: rgba(99,120,220,0.30);
          --text-primary: #0f1b3d;
          --text-secondary: #3b4a7a;
          --text-muted: #6b7aaa;
          --accent: #2a52e8;
          --accent-light: #e8edff;
          --accent-glow: rgba(42,82,232,0.15);
          --badge-bg: rgba(42,82,232,0.10);
          --badge-text: #1a3ab8;
          --shadow: 0 8px 32px rgba(42,82,232,0.12);
          --shadow-card: 0 4px 24px rgba(42,82,232,0.09);
          --danger: #e83a3a;
          --danger-bg: rgba(232,58,58,0.08);
          --warn: #e87f2a;
          --success: #1db87a;
          --admin-accent: #7c3aed;
          --admin-glow: rgba(124,58,237,0.15);
          --admin-badge-bg: rgba(124,58,237,0.10);
          --admin-badge-text: #5b21b6;
        }
        :root[data-theme="dark"] {
          --bg-base: #080e24;
          --bg-card: rgba(18,28,70,0.75);
          --bg-nav: rgba(8,14,36,0.85);
          --bg-input: rgba(12,20,52,0.85);
          --border: rgba(80,120,255,0.18);
          --border-card: rgba(80,120,255,0.22);
          --border-input: rgba(80,120,255,0.30);
          --text-primary: #e8eeff;
          --text-secondary: #a0b0e8;
          --text-muted: #6070b0;
          --accent: #5b8aff;
          --accent-light: rgba(91,138,255,0.12);
          --accent-glow: rgba(91,138,255,0.22);
          --badge-bg: rgba(91,138,255,0.15);
          --badge-text: #90b4ff;
          --shadow: 0 8px 32px rgba(0,0,0,0.45);
          --shadow-card: 0 4px 24px rgba(0,0,0,0.35);
          --danger: #ff6b6b;
          --danger-bg: rgba(255,107,107,0.10);
          --warn: #ffb347;
          --success: #4ade80;
          --admin-accent: #a78bfa;
          --admin-glow: rgba(167,139,250,0.20);
          --admin-badge-bg: rgba(167,139,250,0.15);
          --admin-badge-text: #c4b5fd;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: var(--bg-base);
          color: var(--text-primary);
          min-height: 100vh;
          transition: background 0.3s, color 0.3s;
        }

        /* ── NAV ── */
        .ar-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 64px; padding: 0 5vw;
          display: flex; align-items: center; justify-content: space-between;
          background: var(--bg-nav);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .ar-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem; font-weight: 700;
          color: var(--text-primary); text-decoration: none;
        }
        .ar-logo-icon {
          background: var(--admin-accent); color: #fff;
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 800;
        }
        .ar-nav-right { display: flex; align-items: center; gap: 12px; }
        .theme-btn {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid var(--border-card);
          background: var(--bg-card); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 1.1rem; color: var(--text-primary);
          transition: border-color 0.2s;
        }
        .theme-btn:hover { border-color: var(--admin-accent); }
        .nav-link {
          padding: 8px 18px; border-radius: 10px;
          border: 1.5px solid var(--border-card);
          background: var(--bg-card); backdrop-filter: blur(10px);
          color: var(--text-primary); font-size: 0.875rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
        }
        .nav-link:hover { border-color: var(--admin-accent); color: var(--admin-accent); }

        /* ── PAGE ── */
        .ar-page {
          min-height: 100vh;
          padding: 88px 5vw 48px;
          display: flex; align-items: flex-start; justify-content: center;
          background: linear-gradient(135deg, var(--bg-base) 0%, var(--admin-badge-bg) 50%, var(--bg-base) 100%);
          position: relative; overflow: hidden;
        }
        .ar-page::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 50% at 50% 0%, var(--admin-glow), transparent);
          pointer-events: none;
        }

        /* ── CARD ── */
        .ar-card {
          width: 100%; max-width: 620px;
          background: var(--bg-card);
          backdrop-filter: blur(24px);
          border: 1px solid var(--border-card);
          border-radius: 24px;
          box-shadow: var(--shadow);
          padding: 40px;
          position: relative; z-index: 1;
          animation: cardIn 0.5s cubic-bezier(0.34,1.3,0.64,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── PROGRESS ── */
        .ar-progress {
          display: flex; gap: 8px; align-items: center;
          margin-bottom: 28px;
        }
        .ar-prog-step { display: flex; align-items: center; gap: 8px; }
        .ar-prog-dot {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700;
          border: 2px solid var(--border-card);
          background: var(--bg-input); color: var(--text-muted);
          transition: all 0.3s;
        }
        .ar-prog-dot.active {
          background: var(--admin-accent); border-color: var(--admin-accent);
          color: #fff; box-shadow: 0 0 0 4px var(--admin-glow);
        }
        .ar-prog-dot.done {
          background: var(--success); border-color: var(--success); color: #fff;
        }
        .ar-prog-line {
          flex: 1; height: 2px; background: var(--border-card);
          border-radius: 2px; overflow: hidden;
        }
        .ar-prog-fill {
          height: 100%; background: var(--admin-accent);
          transition: width 0.5s ease;
        }

        /* ── HEADER ── */
        .ar-header { margin-bottom: 28px; }
        .ar-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 999px;
          background: var(--admin-badge-bg); border: 1px solid var(--border-card);
          color: var(--admin-badge-text);
          font-size: 0.78rem; font-weight: 700;
          margin-bottom: 14px; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ar-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800; color: var(--text-primary);
          line-height: 1.2; margin-bottom: 8px;
        }
        .ar-title em { font-style: normal; color: var(--admin-accent); }
        .ar-sub {
          font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;
        }

        /* ── INFO BANNER ── */
        .ar-info-banner {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          background: var(--admin-badge-bg);
          border: 1px solid var(--border-card);
          margin-bottom: 24px;
          font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;
        }
        .ar-info-banner span { font-size: 1rem; margin-top: 1px; }

        /* ── GRID ── */
        .ar-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .ar-grid .span2 { grid-column: span 2; }

        /* ── FIELD ── */
        .ar-field { display: flex; flex-direction: column; gap: 5px; }
        .ar-label {
          font-size: 0.78rem; font-weight: 700;
          color: var(--text-secondary); letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ar-input, .ar-select {
          padding: 11px 14px; border-radius: 12px;
          border: 1.5px solid var(--border-input);
          background: var(--bg-input); color: var(--text-primary);
          font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
        }
        .ar-input:focus, .ar-select:focus {
          border-color: var(--admin-accent);
          box-shadow: 0 0 0 3px var(--admin-glow);
        }
        .ar-input.err, .ar-select.err {
          border-color: var(--danger) !important;
          box-shadow: 0 0 0 3px var(--danger-bg) !important;
        }
        .ar-select option { background: var(--bg-base); }
        .ar-pw-wrap { position: relative; }
        .ar-pw-wrap .ar-input { padding-right: 44px; }
        .ar-pw-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); font-size: 1rem; transition: color 0.2s;
        }
        .ar-pw-eye:hover { color: var(--admin-accent); }

        /* ── INLINE ERRORS & COUNTER ── */
        .ar-error {
          font-size: 0.76rem; color: var(--danger);
          display: flex; align-items: center; gap: 4px;
          font-weight: 600;
          animation: errIn 0.2s ease both;
        }
        @keyframes errIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ar-char-count {
          font-size: 0.72rem; color: var(--text-muted); text-align: right;
        }
        .ar-char-count.full { color: var(--success); font-weight: 700; }

        /* ── OTP ── */
        .otp-row {
          display: flex; gap: 10px; justify-content: center; margin: 20px 0;
        }
        .otp-box {
          width: 52px; height: 60px; border-radius: 14px;
          border: 2px solid var(--border-input);
          background: var(--bg-input); text-align: center;
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem; font-weight: 800;
          color: var(--text-primary); outline: none;
          caret-color: var(--admin-accent);
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .otp-box:focus {
          border-color: var(--admin-accent);
          box-shadow: 0 0 0 3px var(--admin-glow);
          transform: scale(1.06);
        }
        .otp-box:not(:placeholder-shown) {
          border-color: var(--admin-accent); color: var(--admin-accent);
        }

        /* ── COUNTDOWN ── */
        .cd-wrap {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-radius: 14px;
          background: var(--admin-badge-bg); border: 1px solid var(--border-card);
          margin-bottom: 16px;
        }
        .cd-timer {
          font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800;
          min-width: 72px; transition: color 0.5s;
        }
        .cd-bar-wrap {
          flex: 1; height: 6px; background: var(--border-card); border-radius: 99px; overflow: hidden;
        }
        .cd-bar { height: 100%; border-radius: 99px; transition: width 1s linear, background-color 0.5s; }
        .cd-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }

        /* ── CRED SECTION ── */
        .ar-cred-section {
          border-top: 1px solid var(--border-card); margin-top: 8px; padding-top: 20px;
        }
        .ar-cred-label {
          font-size: 0.8rem; font-weight: 700; color: var(--text-muted);
          letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 14px;
        }

        /* ── BUTTONS ── */
        .ar-btn {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          background: var(--admin-accent); color: #fff;
          font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px var(--admin-glow);
          margin-top: 24px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ar-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-2px); }
        .ar-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .ar-btn-ghost {
          width: 100%; padding: 12px; border-radius: 12px;
          border: 1.5px solid var(--border-card); background: transparent;
          color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;
          cursor: pointer; margin-top: 10px; transition: all 0.2s;
        }
        .ar-btn-ghost:hover { border-color: var(--admin-accent); color: var(--admin-accent); }

        /* ── SPINNER ── */
        .spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff; animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── FOOTER NOTE ── */
        .ar-foot {
          text-align: center; margin-top: 20px;
          font-size: 0.82rem; color: var(--text-muted);
        }
        .ar-foot a { color: var(--admin-accent); text-decoration: none; font-weight: 600; }
        .ar-foot a:hover { text-decoration: underline; }

        .Toastify__toast {
          border-radius: 14px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.9rem !important;
        }

        @media (max-width: 600px) {
          .ar-card { padding: 24px 16px; }
          .ar-grid { grid-template-columns: 1fr; }
          .ar-grid .span2 { grid-column: span 1; }
          .otp-box { width: 42px; height: 52px; font-size: 1.3rem; }
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={4500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={dark ? "dark" : "light"}
      />

      {/* NAV */}
      <nav className="ar-nav">
        <Link to="/" className="ar-logo">
          <span className="ar-logo-icon">CG</span>
          CitizenGrievance
        </Link>
        <div className="ar-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/login" className="nav-link">
            Login
          </Link>
        </div>
      </nav>

      {/* PAGE */}
      <div className="ar-page">
        <div className="ar-card">
          {/* PROGRESS BAR */}
          <div className="ar-progress">
            <div className="ar-prog-step">
              <div
                className={`ar-prog-dot ${step === "form" ? "active" : "done"}`}
              >
                {step === "form" ? "1" : "✓"}
              </div>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Details
              </span>
            </div>
            <div className="ar-prog-line">
              <div
                className="ar-prog-fill"
                style={{ width: step === "otp" ? "100%" : "0%" }}
              />
            </div>
            <div className="ar-prog-step">
              <div className={`ar-prog-dot ${step === "otp" ? "active" : ""}`}>
                2
              </div>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Verify OTP
              </span>
            </div>
          </div>

          {/* ══════════ STEP 1 — FORM ══════════ */}
          {step === "form" && (
            <>
              <div className="ar-header">
                <div className="ar-badge">
                  🏛️ Admin Registration · Step 1 of 2
                </div>
                <h1 className="ar-title">
                  Register as <em>District Admin</em>
                </h1>
                <p className="ar-sub">
                  Each district–department combination can only be registered
                  once. An OTP will be sent to your email to verify your
                  identity.
                </p>
              </div>

              {/* Info banner */}
              <div className="ar-info-banner">
                <span>ℹ️</span>
                <span>
                  Your district and department must exist in the system. If you
                  see a "not found" error, contact your system administrator.
                </span>
              </div>

              <form onSubmit={handleInitiate} noValidate>
                <div className="ar-grid">
                  {/* Name */}
                  <div className="ar-field span2">
                    <label className="ar-label">Full Name</label>
                    <input
                      className={`ar-input${errors.name ? " err" : ""}`}
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Suresh Reddy"
                      autoComplete="name"
                    />
                    {errors.name && (
                      <span className="ar-error">⚠ {errors.name}</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="ar-field span2">
                    <label className="ar-label">Official Email Address</label>
                    <input
                      className={`ar-input${errors.email ? " err" : ""}`}
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="admin@district.gov.in"
                      autoComplete="email"
                    />
                    {errors.email && (
                      <span className="ar-error">⚠ {errors.email}</span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="ar-field span2">
                    <label className="ar-label">Phone Number</label>
                    <input
                      className={`ar-input${errors.phoneNumber ? " err" : ""}`}
                      name="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      value={form.phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                    {errors.phoneNumber ? (
                      <span className="ar-error">⚠ {errors.phoneNumber}</span>
                    ) : (
                      <span
                        className={`ar-char-count${form.phoneNumber.length === 10 ? " full" : ""}`}
                      >
                        {form.phoneNumber.length}/10 digits
                        {form.phoneNumber.length === 10 ? " ✓" : ""}
                      </span>
                    )}
                  </div>

                  {/* District */}
                  <div className="ar-field">
                    <label className="ar-label">District</label>
                    <select
                      className={`ar-select${errors.district ? " err" : ""}`}
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <span className="ar-error">⚠ {errors.district}</span>
                    )}
                  </div>

                  {/* Department */}
                  <div className="ar-field">
                    <label className="ar-label">Department</label>
                    <select
                      className={`ar-select${errors.department ? " err" : ""}`}
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <span className="ar-error">⚠ {errors.department}</span>
                    )}
                  </div>
                </div>

                <button className="ar-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner" /> Sending OTP…
                    </>
                  ) : (
                    "Send OTP →"
                  )}
                </button>
              </form>

              <p className="ar-foot">
                Already registered? <Link to="/login">Login here</Link>
                &nbsp;·&nbsp; Citizen?{" "}
                <Link to="/register/user">Register as Citizen</Link>
              </p>
            </>
          )}

          {/* ══════════ STEP 2 — OTP + CREDENTIALS ══════════ */}
          {step === "otp" && (
            <>
              <div className="ar-header">
                <div className="ar-badge">
                  📧 Admin Registration · Step 2 of 2
                </div>
                <h1 className="ar-title">
                  Verify Your <em>Email</em>
                </h1>
                <p className="ar-sub">
                  Enter the 6-digit OTP sent to{" "}
                  <strong>{form.email || "your email"}</strong>, then set your
                  admin login credentials.
                </p>
              </div>

              {/* Countdown */}
              <div className="cd-wrap">
                <div>
                  <div className="cd-label">Session expires in</div>
                  <div className="cd-timer" style={{ color: urgentColor }}>
                    {mins}:{secs}
                  </div>
                </div>
                <div className="cd-bar-wrap">
                  <div
                    className="cd-bar"
                    style={{ width: `${pct}%`, backgroundColor: urgentColor }}
                  />
                </div>
              </div>

              <form onSubmit={handleVerify} noValidate>
                {/* OTP boxes */}
                <div className="otp-row">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      className="otp-box"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      placeholder="·"
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>

                {/* Credentials */}
                <div className="ar-cred-section">
                  <p className="ar-cred-label">
                    Set your admin login credentials
                  </p>
                  <div className="ar-grid">
                    <div className="ar-field span2">
                      <label className="ar-label">Username</label>
                      <input
                        className="ar-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a unique admin username"
                        autoComplete="username"
                      />
                    </div>
                    <div className="ar-field span2">
                      <label className="ar-label">Password</label>
                      <div className="ar-pw-wrap">
                        <input
                          className="ar-input"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="ar-pw-eye"
                          onClick={() => setShowPassword((s) => !s)}
                          tabIndex={-1}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="ar-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner" /> Verifying…
                    </>
                  ) : (
                    "Verify & Complete Registration ✓"
                  )}
                </button>

                <button
                  type="button"
                  className="ar-btn-ghost"
                  onClick={handleBack}
                  disabled={loading}
                >
                  ← Back to Registration Form
                </button>
              </form>

              <p className="ar-foot">
                Didn't receive OTP? Go back and re-submit to request a new one.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
