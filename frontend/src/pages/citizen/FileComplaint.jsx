import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAuthToken,
  clearAuthCookies,
  isLoggedIn,
} from "../../utils/authCookie";

const API_BASE = "http://localhost:8080";
const MAX_MB = 14;
const MAX_BYTES = MAX_MB * 1024 * 1024;

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
const DEPARTMENTS = ["Electrical", "Water", "Sewage", "Road"];
const DEPT_ICONS = { Electrical: "⚡", Water: "💧", Sewage: "🚰", Road: "🛣️" };
const DEPT_DESC = {
  Electrical: "Power & lighting",
  Water: "Supply issues",
  Sewage: "Drainage & pipes",
  Road: "Potholes & damage",
};

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}
function fmtSecs(s) {
  const m = Math.floor(s / 60),
    sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ════════════════════════════════
   CAMERA MODAL
════════════════════════════════ */
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    startCamera(facing);
    return () => stopCamera();
  }, [facing]);

  async function startCamera(facingMode) {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setReady(true);
        };
      }
    } catch (err) {
      toast.error("Camera access denied: " + err.message);
      onClose();
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setReady(false);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file, URL.createObjectURL(blob));
        stopCamera();
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div
      className="cam-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cam-modal">
        <div className="cam-topbar">
          <span className="cam-title">📷 Take Photo</span>
          <div className="cam-actions">
            <button
              className="cam-flip"
              onClick={() =>
                setFacing((f) => (f === "environment" ? "user" : "environment"))
              }
              title="Flip camera"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
            </button>
            <button className="cam-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="cam-viewfinder">
          {flash && <div className="cam-flash" />}
          <video ref={videoRef} className="cam-video" playsInline muted />
          {!ready && (
            <div className="cam-loading">
              <div className="cam-spinner" />
              <span>Starting camera…</span>
            </div>
          )}
          {/* Corner guides */}
          <div className="cam-corner cam-tl" />
          <div className="cam-corner cam-tr" />
          <div className="cam-corner cam-bl" />
          <div className="cam-corner cam-br" />
        </div>

        <div className="cam-bottom">
          <button className="cam-shutter" onClick={capture} disabled={!ready}>
            <div className="cam-shutter-ring" />
            <div className="cam-shutter-inner" />
          </button>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════
   LIVE AUDIO RECORDER
════════════════════════════════ */
function AudioRecorder({ onRecorded, onClose }) {
  const [state, setState] = useState("idle"); // idle | recording | done
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [bars, setBars] = useState(Array(28).fill(4));
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const frameRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(frameRef.current);
      mediaRef.current?.stream?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      // Visualizer
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      const src = ctxRef.current.createMediaStreamSource(stream);
      src.connect(analyserRef.current);
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      function drawBars() {
        frameRef.current = requestAnimationFrame(drawBars);
        analyserRef.current.getByteFrequencyData(data);
        const slice = Math.floor(data.length / 28);
        setBars(
          Array.from({ length: 28 }, (_, i) =>
            Math.max(4, (data[i * slice] / 255) * 52),
          ),
        );
      }
      drawBars();

      const mr = new MediaRecorder(stream, {
        mimeType: getSupportedMimeType(),
      });
      mr.ondataavailable = (e) =>
        e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        const ext = mr.mimeType.includes("ogg")
          ? "ogg"
          : mr.mimeType.includes("webm")
            ? "webm"
            : "mp4";
        const file = new File([blob], `recording_${Date.now()}.${ext}`, {
          type: mr.mimeType,
        });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
        setState("done");
        cancelAnimationFrame(frameRef.current);
        setBars(Array(28).fill(4));
        stream.getTracks().forEach((t) => t.stop());
        ctxRef.current?.close();
      };
      mr.start(100);
      mediaRef.current = mr;
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      toast.error("Microphone access denied: " + err.message);
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  }

  function getSupportedMimeType() {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }

  function confirmUse() {
    if (audioFile) {
      onRecorded(audioFile);
      onClose();
    }
  }

  return (
    <div
      className="rec-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rec-modal">
        <div className="rec-topbar">
          <span className="rec-title">🎙️ Record Audio</span>
          <button className="cam-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rec-body">
          {/* Waveform viz */}
          <div className="rec-viz">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`rec-bar ${state === "recording" ? "rec-bar-live" : ""}`}
                style={{ height: `${h}px`, animationDelay: `${i * 0.04}s` }}
              />
            ))}
          </div>

          {/* Timer */}
          <div
            className={`rec-timer ${state === "recording" ? "rec-timer-live" : ""}`}
          >
            {state === "idle" && <span>Ready to record</span>}
            {state === "recording" && (
              <>
                <span className="rec-dot" />
                {fmtSecs(seconds)}
              </>
            )}
            {state === "done" && <span>Recording complete</span>}
          </div>

          {/* Playback */}
          {state === "done" && audioUrl && (
            <audio src={audioUrl} controls className="rec-audio-preview" />
          )}

          {/* Buttons */}
          <div className="rec-btns">
            {state === "idle" && (
              <button className="rec-start-btn" onClick={startRecording}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="8" />
                </svg>
                Start Recording
              </button>
            )}
            {state === "recording" && (
              <button className="rec-stop-btn" onClick={stopRecording}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
                Stop
              </button>
            )}
            {state === "done" && (
              <>
                <button
                  className="rec-redo-btn"
                  onClick={() => {
                    setState("idle");
                    setAudioUrl(null);
                    setAudioFile(null);
                    setSeconds(0);
                  }}
                >
                  ↺ Re-record
                </button>
                <button className="rec-use-btn" onClick={confirmUse}>
                  ✓ Use Recording
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export default function FileComplaint() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  const [form, setForm] = useState({
    complaintsInWords: "",
    landmark: "",
    district: "",
    department: "",
    latitude: "",
    longitude: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const imgRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, []);

  function handleField(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  }

  function applyImageFile(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(
        `Image must be under ${MAX_MB}MB. Got: ${fmtBytes(file.size)}`,
      );
      return;
    }
    setImageFile(file);
    setErrors((er) => ({ ...er, imageComplaint: "" }));
    setImgPreview(URL.createObjectURL(file));
  }

  function handleImageChange(e) {
    applyImageFile(e.target.files?.[0]);
  }

  function handleAudioChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(
        `Audio must be under ${MAX_MB}MB. Got: ${fmtBytes(file.size)}`,
      );
      e.target.value = "";
      return;
    }
    setAudioFile(file);
    setErrors((er) => ({ ...er, audioComplaint: "" }));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setErrors((er) => ({ ...er, latitude: "", longitude: "" }));
        toast.success("📍 Location detected!");
        setLocLoading(false);
      },
      (err) => {
        toast.error(`📍 ${err.message}`);
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validate() {
    const e = {};
    if (!form.complaintsInWords.trim())
      e.complaintsInWords = "Description is required.";
    else if (form.complaintsInWords.trim().length < 20)
      e.complaintsInWords = "At least 20 characters required.";
    if (!form.landmark.trim()) e.landmark = "Landmark is required.";
    if (!form.district) e.district = "Please select a district.";
    if (!form.department) e.department = "Please select a department.";
    if (!form.latitude)
      e.latitude = "GPS location is required. Use Detect or enter manually.";
    if (!form.longitude) e.longitude = "Longitude is required.";
    if (!imageFile) e.imageComplaint = "Please attach or capture a photo.";
    if (!audioFile) e.audioComplaint = "Please upload or record audio.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning("⚠️ Please fix the errors before submitting.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image-complaint", imageFile);
      fd.append("audio-complaint", audioFile);
      fd.append("latitude", form.latitude);
      fd.append("longitude", form.longitude);
      fd.append("complaintsInWords", form.complaintsInWords);
      fd.append("landmark", form.landmark);
      fd.append("district", form.district);
      fd.append("department", form.department);
      const res = await fetch(`${API_BASE}/citizen/complaint`, {
        method: "POST",
        headers: { Authorization: getAuthToken() ?? "" },
        body: fd,
      });
      const text = await res.text();
      if (res.ok) {
        toast.success("✅ Complaint filed! Redirecting…");
        setTimeout(() => navigate("/citizen/dashboard"), 2000);
      } else if (res.status === 401) {
        clearAuthCookies();
        navigate("/login");
      } else toast.error(`❌ ${text || "Failed to file complaint."}`);
    } catch (err) {
      toast.error(`🔌 ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const completionSteps = [
    !!form.department,
    !!(
      form.complaintsInWords.trim().length >= 20 &&
      form.landmark &&
      form.district
    ),
    !!(form.latitude && form.longitude),
    !!imageFile,
    !!audioFile,
  ];
  const completionPct = Math.round(
    (completionSteps.filter(Boolean).length / completionSteps.length) * 100,
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        :root[data-theme="light"]{
          --bg:#f0f4ff;--bg-card:rgba(255,255,255,0.85);--bg-nav:rgba(240,244,255,0.90);
          --bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);
          --border-card:rgba(99,120,220,0.22);--border-input:rgba(99,120,220,0.28);
          --text-primary:#0f1b3d;--text-secondary:#3b4a7a;--text-muted:#6b7aaa;
          --accent:#2a52e8;--accent-glow:rgba(42,82,232,0.15);--accent-badge:rgba(42,82,232,0.09);
          --shadow:0 8px 32px rgba(42,82,232,0.11);--shadow-card:0 4px 20px rgba(42,82,232,0.08);
          --danger:#e83a3a;--danger-bg:rgba(232,58,58,0.08);--success:#10b981;--success-bg:rgba(16,185,129,0.1);
        }
        :root[data-theme="dark"]{
          --bg:#080e24;--bg-card:rgba(14,22,58,0.85);--bg-nav:rgba(8,14,36,0.92);
          --bg-input:rgba(10,17,46,0.90);--border:rgba(80,120,255,0.15);
          --border-card:rgba(80,120,255,0.22);--border-input:rgba(80,120,255,0.28);
          --text-primary:#e8eeff;--text-secondary:#a0b0e8;--text-muted:#5a6a9a;
          --accent:#5b8aff;--accent-glow:rgba(91,138,255,0.20);--accent-badge:rgba(91,138,255,0.12);
          --shadow:0 8px 32px rgba(0,0,0,0.50);--shadow-card:0 4px 20px rgba(0,0,0,0.38);
          --danger:#ff6b6b;--danger-bg:rgba(255,107,107,0.10);--success:#4ade80;--success-bg:rgba(74,222,128,0.1);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}

        /* ── NAV (unchanged) ── */
        .fc-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .fc-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
        .fc-logo-icon{width:34px;height:34px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;font-weight:800;}
        .fc-nav-right{display:flex;align-items:center;gap:8px;}
        .fc-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'DM Sans',sans-serif;}
        .fc-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
        .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;}

        /* ── PAGE ── */
        .fc-page{padding:88px 5vw 64px;max-width:740px;margin:0 auto;}

        /* ── HEADER ── */
        .fc-header{margin-bottom:24px;animation:fadeUp .4s ease both;}
        .fc-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:var(--accent-badge);border:1px solid var(--border-card);color:var(--accent);font-size:.76rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;}
        .fc-title{font-family:'Outfit',sans-serif;font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:var(--text-primary);margin-bottom:6px;}
        .fc-title em{font-style:normal;color:var(--accent);}
        .fc-sub{font-size:.9rem;color:var(--text-secondary);line-height:1.6;}

        /* ── PROGRESS BAR ── */
        .fc-progress-wrap{margin-bottom:24px;animation:fadeUp .4s ease .05s both;}
        .fc-progress-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
        .fc-progress-label{font-size:.78rem;font-weight:600;color:var(--text-muted);}
        .fc-progress-pct{font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:800;color:var(--accent);}
        .fc-progress-track{height:6px;border-radius:999px;background:var(--border-card);overflow:hidden;}
        .fc-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),#818cf8);transition:width .5s cubic-bezier(.34,1.56,.64,1);}

        /* ── CARD ── */
        .fc-card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:22px;padding:24px;box-shadow:var(--shadow-card);margin-bottom:16px;animation:fadeUp .4s ease both;transition:border-color .2s;}
        .fc-card:hover{border-color:rgba(99,120,220,0.35);}
        .fc-card:nth-child(2){animation-delay:.05s;}
        .fc-card:nth-child(3){animation-delay:.10s;}
        .fc-card:nth-child(4){animation-delay:.15s;}
        .fc-card:nth-child(5){animation-delay:.20s;}
        .fc-card-title{font-family:'Outfit',sans-serif;font-size:.95rem;font-weight:700;color:var(--text-primary);margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--border-card);}
        .fc-card-title-left{display:flex;align-items:center;gap:8px;}
        .fc-step-badge{width:22px;height:22px;border-radius:50%;background:var(--accent-badge);border:1px solid var(--border-card);color:var(--accent);font-size:.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .fc-step-done{background:var(--success-bg);border-color:var(--success);color:var(--success);}

        /* ── DEPT GRID ── */
        .fc-dept-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .fc-dept-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px 12px;border-radius:16px;border:1.5px solid var(--border-card);background:var(--bg-input);cursor:pointer;transition:all .22s;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;}
        .fc-dept-btn::before{content:'';position:absolute;inset:0;background:var(--accent-badge);opacity:0;transition:opacity .22s;}
        .fc-dept-btn:hover::before{opacity:1;}
        .fc-dept-btn:hover{border-color:var(--accent);transform:translateY(-2px);}
        .fc-dept-btn.selected{border-color:var(--accent);background:var(--accent-badge);box-shadow:0 4px 18px var(--accent-glow);}
        .fc-dept-btn.selected .fc-dept-check{opacity:1;}
        .fc-dept-icon{font-size:1.6rem;position:relative;z-index:1;}
        .fc-dept-label{font-size:.78rem;font-weight:700;color:var(--text-primary);position:relative;z-index:1;}
        .fc-dept-sub{font-size:.66rem;color:var(--text-muted);position:relative;z-index:1;text-align:center;}
        .fc-dept-check{position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;}
        .fc-dept-check svg{width:10px;height:10px;}

        /* ── FORM FIELDS ── */
        .fc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .fc-grid .span2{grid-column:span 2;}
        .fc-field{display:flex;flex-direction:column;gap:5px;}
        .fc-label{font-size:.74rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;}
        .fc-input,.fc-select,.fc-textarea{padding:11px 14px;border-radius:12px;border:1.5px solid var(--border-input);background:var(--bg-input);color:var(--text-primary);font-family:'DM Sans',sans-serif;font-size:.92rem;outline:none;transition:border-color .2s,box-shadow .2s;width:100%;}
        .fc-input:focus,.fc-select:focus,.fc-textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow);}
        .fc-input.err,.fc-select.err,.fc-textarea.err{border-color:var(--danger)!important;box-shadow:0 0 0 3px var(--danger-bg)!important;}
        .fc-textarea{resize:vertical;min-height:110px;line-height:1.6;}
        .fc-select option{background:var(--bg);}
        .fc-error{font-size:.74rem;color:var(--danger);font-weight:600;display:flex;align-items:center;gap:4px;animation:errIn .2s ease both;}
        @keyframes errIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .fc-char-count{font-size:.71rem;color:var(--text-muted);text-align:right;}

        /* ── GPS ── */
        .fc-loc-row{display:flex;gap:8px;align-items:flex-end;}
        .fc-loc-row .fc-field{flex:1;}
        .fc-loc-btn{padding:11px 16px;border-radius:12px;background:var(--accent);border:none;color:#fff;font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;white-space:nowrap;height:44px;display:flex;align-items:center;gap:6px;transition:opacity .2s,transform .2s;flex-shrink:0;}
        .fc-loc-btn:hover{opacity:.88;transform:translateY(-1px);}
        .fc-loc-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}
        .fc-loc-detected{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:var(--success-bg);border:1px solid var(--success);font-size:.78rem;color:var(--success);font-weight:600;margin-top:4px;}

        /* ── PHOTO SECTION ── */
        .fc-photo-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
        .fc-photo-opt{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 16px;border-radius:16px;border:1.5px dashed var(--border-input);background:var(--bg-input);cursor:pointer;transition:all .22s;font-family:'DM Sans',sans-serif;}
        .fc-photo-opt:hover{border-color:var(--accent);background:var(--accent-badge);transform:translateY(-2px);}
        .fc-photo-opt-icon{font-size:1.8rem;}
        .fc-photo-opt-label{font-size:.82rem;font-weight:700;color:var(--text-primary);}
        .fc-photo-opt-sub{font-size:.7rem;color:var(--text-muted);text-align:center;}

        /* Drag zone */
        .fc-drag-zone{border:2px dashed var(--border-input);border-radius:14px;padding:24px 20px;text-align:center;cursor:pointer;transition:all .22s;background:var(--bg-input);}
        .fc-drag-zone.dragging{border-color:var(--accent);background:var(--accent-badge);transform:scale(1.01);}
        .fc-drag-zone.err{border-color:var(--danger);}
        .fc-dz-icon{font-size:1.8rem;display:block;margin-bottom:6px;}
        .fc-dz-label{font-size:.84rem;color:var(--text-secondary);} .fc-dz-label strong{color:var(--accent);}
        .fc-dz-limit{font-size:.71rem;color:var(--text-muted);margin-top:4px;}

        /* Preview */
        .fc-img-preview{position:relative;border-radius:16px;overflow:hidden;border:1.5px solid var(--border-card);}
        .fc-img-preview img{width:100%;max-height:280px;object-fit:cover;display:block;}
        .fc-preview-bar{position:absolute;bottom:0;left:0;right:0;padding:10px 14px;background:linear-gradient(to top,rgba(0,0,0,0.65),transparent);display:flex;align-items:center;justify-content:space-between;}
        .fc-preview-name{font-size:.76rem;color:rgba(255,255,255,0.9);font-weight:600;}
        .fc-preview-actions{display:flex;gap:8px;}
        .fc-preview-btn{padding:5px 10px;border-radius:8px;background:rgba(255,255,255,0.18);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:.72rem;font-weight:600;cursor:pointer;transition:background .2s;}
        .fc-preview-btn:hover{background:rgba(255,255,255,0.3);}
        .fc-preview-btn.remove{background:rgba(239,68,68,0.4);}
        .fc-preview-btn.remove:hover{background:rgba(239,68,68,0.65);}

        /* ── AUDIO SECTION ── */
        .fc-audio-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
        .fc-audio-opt{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 16px;border-radius:16px;border:1.5px dashed var(--border-input);background:var(--bg-input);cursor:pointer;transition:all .22s;}
        .fc-audio-opt:hover{border-color:var(--accent);background:var(--accent-badge);transform:translateY(-2px);}
        .fc-audio-opt-icon{font-size:1.8rem;}
        .fc-audio-opt-label{font-size:.82rem;font-weight:700;color:var(--text-primary);}
        .fc-audio-opt-sub{font-size:.7rem;color:var(--text-muted);text-align:center;}

        /* Audio info card */
        .fc-audio-card{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:var(--accent-badge);border:1.5px solid var(--border-card);}
        .fc-audio-blob{width:44px;height:44px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
        .fc-audio-info-text{flex:1;min-width:0;}
        .fc-audio-name{font-size:.86rem;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .fc-audio-meta{font-size:.73rem;color:var(--text-muted);display:flex;gap:8px;margin-top:2px;}
        .fc-audio-tag{padding:2px 8px;border-radius:999px;background:var(--accent-badge);border:1px solid var(--border-card);color:var(--accent);font-size:.68rem;font-weight:700;}
        .fc-audio-remove{background:none;border:1.5px solid var(--border-card);border-radius:8px;cursor:pointer;color:var(--danger);padding:6px 10px;font-size:.8rem;font-weight:700;transition:all .2s;}
        .fc-audio-remove:hover{background:var(--danger-bg);border-color:var(--danger);}

        /* ── SUBMIT ── */
        .fc-submit-wrap{animation:fadeUp .4s ease .25s both;}
        .fc-submit{width:100%;padding:16px;border-radius:16px;border:none;background:var(--accent);color:#fff;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 8px 28px var(--accent-glow);transition:all .2s;letter-spacing:.02em;}
        .fc-submit:hover:not(:disabled){opacity:.9;transform:translateY(-2px);box-shadow:0 12px 36px var(--accent-glow);}
        .fc-submit:disabled{opacity:.5;cursor:not-allowed;transform:none;}
        .spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:spin .7s linear infinite;display:inline-block;}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* ════════════════════
           CAMERA MODAL
        ════════════════════ */
        .cam-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease both;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .cam-modal{width:min(560px,98vw);background:#0a0a0f;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 32px 80px rgba(0,0,0,0.8);animation:slideUp .3s cubic-bezier(.34,1.2,.64,1) both;}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
        .cam-topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#111118;border-bottom:1px solid rgba(255,255,255,0.08);}
        .cam-title{font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:700;color:#fff;}
        .cam-actions{display:flex;gap:8px;align-items:center;}
        .cam-flip{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;}
        .cam-flip:hover{background:rgba(255,255,255,0.15);}
        .cam-close-btn{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:background .2s;}
        .cam-close-btn:hover{background:rgba(239,68,68,0.3);}
        .cam-viewfinder{position:relative;aspect-ratio:4/3;background:#000;overflow:hidden;}
        .cam-video{width:100%;height:100%;object-fit:cover;display:block;}
        .cam-flash{position:absolute;inset:0;background:#fff;animation:flashOut .2s ease forwards;z-index:10;}
        @keyframes flashOut{from{opacity:0.9}to{opacity:0}}
        .cam-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:rgba(255,255,255,0.6);font-size:.84rem;}
        .cam-spinner{width:32px;height:32px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#fff;animation:spin .8s linear infinite;}
        /* Corner brackets */
        .cam-corner{position:absolute;width:24px;height:24px;border-color:#fff;border-style:solid;opacity:0.7;}
        .cam-tl{top:16px;left:16px;border-width:2px 0 0 2px;border-radius:4px 0 0 0;}
        .cam-tr{top:16px;right:16px;border-width:2px 2px 0 0;border-radius:0 4px 0 0;}
        .cam-bl{bottom:16px;left:16px;border-width:0 0 2px 2px;border-radius:0 0 0 4px;}
        .cam-br{bottom:16px;right:16px;border-width:0 2px 2px 0;border-radius:0 0 4px 0;}
        .cam-bottom{display:flex;align-items:center;justify-content:center;padding:24px;background:#111118;}
        .cam-shutter{position:relative;width:68px;height:68px;border-radius:50%;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s;}
        .cam-shutter:hover{transform:scale(1.06);}
        .cam-shutter:active{transform:scale(.94);}
        .cam-shutter:disabled{opacity:.4;cursor:not-allowed;transform:none;}
        .cam-shutter-ring{position:absolute;inset:0;border-radius:50%;border:3px solid rgba(255,255,255,0.8);}
        .cam-shutter-inner{width:52px;height:52px;border-radius:50%;background:#fff;transition:background .15s;}
        .cam-shutter:hover .cam-shutter-inner{background:#e0e7ff;}

        /* ════════════════════
           RECORDER MODAL
        ════════════════════ */
        .rec-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease both;}
        .rec-modal{width:min(440px,95vw);background:#0a0a0f;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 32px 80px rgba(0,0,0,0.8);animation:slideUp .3s cubic-bezier(.34,1.2,.64,1) both;}
        .rec-topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#111118;border-bottom:1px solid rgba(255,255,255,0.08);}
        .rec-title{font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:700;color:#fff;}
        .rec-body{padding:28px 24px 32px;display:flex;flex-direction:column;align-items:center;gap:20px;}
        /* Waveform */
        .rec-viz{display:flex;align-items:center;justify-content:center;gap:3px;height:64px;width:100%;}
        .rec-bar{width:5px;border-radius:999px;background:rgba(91,138,255,0.4);transition:height .08s ease;flex-shrink:0;}
        .rec-bar-live{background:var(--accent,#5b8aff);animation:barPulse .6s ease-in-out infinite alternate;}
        @keyframes barPulse{from{opacity:.8}to{opacity:1}}
        /* Timer */
        .rec-timer{font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:10px;}
        .rec-timer-live{color:#fff;}
        .rec-dot{width:10px;height:10px;border-radius:50%;background:#ef4444;animation:blink 1s step-start infinite;flex-shrink:0;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .rec-audio-preview{width:100%;border-radius:12px;outline:none;}
        /* Rec buttons */
        .rec-btns{display:flex;gap:10px;width:100%;}
        .rec-start-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:14px;background:#ef4444;border:none;color:#fff;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;}
        .rec-start-btn:hover{opacity:.88;transform:translateY(-1px);}
        .rec-stop-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:14px;background:#374151;border:none;color:#fff;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;}
        .rec-stop-btn:hover{background:#4b5563;}
        .rec-redo-btn{flex:1;padding:13px;border-radius:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-family:'Outfit',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;}
        .rec-redo-btn:hover{background:rgba(255,255,255,0.14);}
        .rec-use-btn{flex:1;padding:13px;border-radius:14px;background:var(--accent,#5b8aff);border:none;color:#fff;font-family:'Outfit',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;}
        .rec-use-btn:hover{opacity:.88;transform:translateY(-1px);}

        /* ── UTILS ── */
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .Toastify__toast{border-radius:14px!important;font-family:'DM Sans',sans-serif!important;}

        @media(max-width:560px){
          .fc-grid{grid-template-columns:1fr;}
          .fc-grid .span2{grid-column:span 1;}
          .fc-dept-grid{grid-template-columns:repeat(2,1fr);}
          .fc-photo-options,.fc-audio-options{grid-template-columns:1fr;}
          .fc-page{padding:80px 4vw 48px;}
          .fc-loc-row{flex-wrap:wrap;}
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme={dark ? "dark" : "light"}
      />

      {showCamera && (
        <CameraModal
          onCapture={(file, url) => {
            setImageFile(file);
            setImgPreview(url);
            setErrors((er) => ({ ...er, imageComplaint: "" }));
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
      {showRecorder && (
        <AudioRecorder
          onRecorded={(file) => {
            setAudioFile(file);
            setErrors((er) => ({ ...er, audioComplaint: "" }));
          }}
          onClose={() => setShowRecorder(false)}
        />
      )}

      {/* ── NAV ── */}
      <nav className="fc-nav">
        <Link to="/citizen/dashboard" className="fc-logo">
          <span className="fc-logo-icon">CG</span>
          <span>CitizenGrievance</span>
        </Link>
        <div className="fc-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link to="/citizen/dashboard" className="fc-nav-btn">
            Dashboard
          </Link>
          <Link to="/citizen/complaints" className="fc-nav-btn">
            My Complaints
          </Link>
        </div>
      </nav>

      <div className="fc-page">
        {/* HEADER */}
        <div className="fc-header">
          <div className="fc-badge">📝 File a Complaint</div>
          <h1 className="fc-title">
            Report a <em>Municipal Issue</em>
          </h1>
          <p className="fc-sub">
            Attach a photo, record audio, and pin your location. Your complaint
            goes directly to district administration.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="fc-progress-wrap">
          <div className="fc-progress-head">
            <span className="fc-progress-label">Form completion</span>
            <span className="fc-progress-pct">{completionPct}%</span>
          </div>
          <div className="fc-progress-track">
            <div
              className="fc-progress-fill"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── 1. DEPARTMENT ── */}
          <div className="fc-card">
            <div className="fc-card-title">
              <div className="fc-card-title-left">
                <span
                  className={`fc-step-badge ${completionSteps[0] ? "fc-step-done" : ""}`}
                >
                  {completionSteps[0] ? "✓" : "1"}
                </span>
                🏛️ Select Department
              </div>
            </div>
            <div className="fc-dept-grid">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`fc-dept-btn${form.department === d ? " selected" : ""}`}
                  onClick={() => {
                    setForm((f) => ({ ...f, department: d }));
                    setErrors((er) => ({ ...er, department: "" }));
                  }}
                >
                  <span className="fc-dept-icon">{DEPT_ICONS[d]}</span>
                  <span className="fc-dept-label">{d}</span>
                  <span className="fc-dept-sub">{DEPT_DESC[d]}</span>
                  <span className="fc-dept-check">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
            {errors.department && (
              <div className="fc-error" style={{ marginTop: 8 }}>
                ⚠ {errors.department}
              </div>
            )}
          </div>

          {/* ── 2. DETAILS ── */}
          <div className="fc-card">
            <div className="fc-card-title">
              <div className="fc-card-title-left">
                <span
                  className={`fc-step-badge ${completionSteps[1] ? "fc-step-done" : ""}`}
                >
                  {completionSteps[1] ? "✓" : "2"}
                </span>
                📋 Complaint Details
              </div>
            </div>
            <div className="fc-grid">
              <div className="fc-field span2">
                <label className="fc-label">Describe the Issue</label>
                <textarea
                  className={`fc-textarea${errors.complaintsInWords ? " err" : ""}`}
                  name="complaintsInWords"
                  value={form.complaintsInWords}
                  onChange={handleField}
                  placeholder="Describe the problem clearly. E.g. There is a large pothole on the main road causing accidents..."
                  maxLength={1000}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 2,
                  }}
                >
                  {errors.complaintsInWords ? (
                    <span className="fc-error">
                      ⚠ {errors.complaintsInWords}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="fc-char-count">
                    {form.complaintsInWords.length}/1000
                  </span>
                </div>
              </div>

              <div className="fc-field span2">
                <label className="fc-label">Landmark / Nearby Reference</label>
                <input
                  className={`fc-input${errors.landmark ? " err" : ""}`}
                  name="landmark"
                  value={form.landmark}
                  onChange={handleField}
                  placeholder="e.g. Near Hyderabad Railway Station, Opp. SBI Bank"
                />
                {errors.landmark && (
                  <span className="fc-error">⚠ {errors.landmark}</span>
                )}
              </div>

              <div className="fc-field">
                <label className="fc-label">District</label>
                <select
                  className={`fc-select${errors.district ? " err" : ""}`}
                  name="district"
                  value={form.district}
                  onChange={handleField}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <span className="fc-error">⚠ {errors.district}</span>
                )}
              </div>

              <div className="fc-field">
                <label className="fc-label">GPS Location</label>
                <div className="fc-loc-row">
                  <div className="fc-field">
                    <input
                      className={`fc-input${errors.latitude ? " err" : ""}`}
                      name="latitude"
                      value={form.latitude}
                      onChange={handleField}
                      placeholder="Latitude"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="fc-field">
                    <input
                      className={`fc-input${errors.longitude ? " err" : ""}`}
                      name="longitude"
                      value={form.longitude}
                      onChange={handleField}
                      placeholder="Longitude"
                      type="number"
                      step="any"
                    />
                  </div>
                  <button
                    type="button"
                    className="fc-loc-btn"
                    onClick={getLocation}
                    disabled={locLoading}
                  >
                    {locLoading ? (
                      <span
                        className="spinner"
                        style={{ width: 15, height: 15 }}
                      />
                    ) : (
                      "📍"
                    )}{" "}
                    Detect
                  </button>
                </div>
                {form.latitude && form.longitude && !errors.latitude && (
                  <div className="fc-loc-detected">
                    ✓ Location pinned: {form.latitude}, {form.longitude}
                  </div>
                )}
                {(errors.latitude || errors.longitude) && (
                  <span className="fc-error">
                    ⚠ {errors.latitude || errors.longitude}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── 3. PHOTO ── */}
          <div className="fc-card">
            <div className="fc-card-title">
              <div className="fc-card-title-left">
                <span
                  className={`fc-step-badge ${completionSteps[3] ? "fc-step-done" : ""}`}
                >
                  {completionSteps[3] ? "✓" : "3"}
                </span>
                📷 Complaint Photo
              </div>
              <span
                style={{
                  fontSize: ".78rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Max {MAX_MB}MB
              </span>
            </div>

            {imgPreview ? (
              <div className="fc-img-preview">
                <img src={imgPreview} alt="Preview" />
                <div className="fc-preview-bar">
                  <span className="fc-preview-name">{imageFile?.name}</span>
                  <div className="fc-preview-actions">
                    <button
                      type="button"
                      className="fc-preview-btn"
                      onClick={() => {
                        setImageFile(null);
                        setImgPreview(null);
                        imgRef.current.value = "";
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="fc-preview-btn remove"
                      onClick={() => {
                        setImageFile(null);
                        setImgPreview(null);
                        imgRef.current.value = "";
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="fc-photo-options">
                  <div
                    className="fc-photo-opt"
                    onClick={() => setShowCamera(true)}
                  >
                    <span className="fc-photo-opt-icon">📸</span>
                    <span className="fc-photo-opt-label">Open Camera</span>
                    <span className="fc-photo-opt-sub">
                      Take a photo instantly
                    </span>
                  </div>
                  <div
                    className="fc-photo-opt"
                    onClick={() => imgRef.current.click()}
                  >
                    <span className="fc-photo-opt-icon">🖼️</span>
                    <span className="fc-photo-opt-label">Upload File</span>
                    <span className="fc-photo-opt-sub">PNG, JPG, WEBP</span>
                  </div>
                </div>

                <div
                  className={`fc-drag-zone${dragging ? " dragging" : ""}${errors.imageComplaint ? " err" : ""}`}
                  onClick={() => imgRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) applyImageFile(f);
                  }}
                >
                  <span className="fc-dz-icon">⬆️</span>
                  <div className="fc-dz-label">
                    Or <strong>drag & drop</strong> your photo here
                  </div>
                  <div className="fc-dz-limit">
                    PNG, JPG, WEBP — max {MAX_MB}MB
                  </div>
                </div>
              </>
            )}
            <input
              type="file"
              ref={imgRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            {errors.imageComplaint && (
              <div className="fc-error" style={{ marginTop: 8 }}>
                ⚠ {errors.imageComplaint}
              </div>
            )}
          </div>

          {/* ── 4. AUDIO ── */}
          <div className="fc-card">
            <div className="fc-card-title">
              <div className="fc-card-title-left">
                <span
                  className={`fc-step-badge ${completionSteps[4] ? "fc-step-done" : ""}`}
                >
                  {completionSteps[4] ? "✓" : "4"}
                </span>
                🎙️ Audio Description
              </div>
              <span
                style={{
                  fontSize: ".78rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Max {MAX_MB}MB
              </span>
            </div>

            {audioFile ? (
              <div className="fc-audio-card">
                <div className="fc-audio-blob">🎵</div>
                <div className="fc-audio-info-text">
                  <div className="fc-audio-name">{audioFile.name}</div>
                  <div className="fc-audio-meta">
                    <span>{fmtBytes(audioFile.size)}</span>
                    {audioFile.name.includes("recording_") && (
                      <span className="fc-audio-tag">🎙 Recorded</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="fc-audio-remove"
                  onClick={() => {
                    setAudioFile(null);
                    if (audioRef.current) audioRef.current.value = "";
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <div className="fc-audio-options">
                <div
                  className="fc-audio-opt"
                  onClick={() => setShowRecorder(true)}
                >
                  <span className="fc-audio-opt-icon">🎙️</span>
                  <span className="fc-audio-opt-label">Record Now</span>
                  <span className="fc-audio-opt-sub">Use your microphone</span>
                </div>
                <div
                  className="fc-audio-opt"
                  onClick={() => audioRef.current.click()}
                >
                  <span className="fc-audio-opt-icon">📁</span>
                  <span className="fc-audio-opt-label">Upload File</span>
                  <span className="fc-audio-opt-sub">MP3, WAV, OGG, M4A</span>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={audioRef}
              accept="audio/*"
              style={{ display: "none" }}
              onChange={handleAudioChange}
            />
            {errors.audioComplaint && (
              <div className="fc-error" style={{ marginTop: 8 }}>
                ⚠ {errors.audioComplaint}
              </div>
            )}
          </div>

          {/* ── SUBMIT ── */}
          <div className="fc-submit-wrap">
            <button className="fc-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Submitting…
                </>
              ) : (
                <>📤 Submit Complaint</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
