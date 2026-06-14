import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

function b64ToUrl(b64, mime) {
  if (!b64) return null;
  try {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch {
    return null;
  }
}

function guessImageMime(b64) {
  if (!b64) return "image/jpeg";
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("R0lGO")) return "image/gif";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

const STATUS_META = {
  SENT: {
    label: "Sent",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
    dot: "#818cf8",
  },
  PENDING: {
    label: "Pending",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    dot: "#fbbf24",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
    dot: "#38bdf8",
  },
  SOLVED: {
    label: "Resolved",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    dot: "#34d399",
  },
  REJECTED: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    dot: "#f87171",
  },
};
function getStatus(s) {
  return (
    STATUS_META[s?.toUpperCase()] ?? {
      label: s ?? "Unknown",
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.12)",
      dot: "#94a3b8",
    }
  );
}

const DEPT_ICONS = { Electrical: "⚡", Water: "💧", Sewage: "🚰", Road: "🛣️" };

/* ════════════════════════════════
   AUDIO PLAYER
════════════════════════════════ */
function AudioPlayer({ src }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(1);
  const [bars, setBars] = useState(() => Array(40).fill(0.08));
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const srcRef = useRef(null);
  const analyser = useRef(null);
  const frameRef = useRef(null);
  const dataRef = useRef(null);
  const fmt = (s) =>
    !isFinite(s)
      ? "0:00"
      : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function initCtx() {
    if (ctxRef.current) return;
    ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyser.current = ctxRef.current.createAnalyser();
    analyser.current.fftSize = 128;
    dataRef.current = new Uint8Array(analyser.current.frequencyBinCount);
    srcRef.current = ctxRef.current.createMediaElementSource(audioRef.current);
    srcRef.current.connect(analyser.current);
    analyser.current.connect(ctxRef.current.destination);
  }
  function animate() {
    frameRef.current = requestAnimationFrame(animate);
    analyser.current.getByteFrequencyData(dataRef.current);
    const slice = Math.floor(dataRef.current.length / 40);
    const next = Array.from({ length: 40 }, (_, i) => {
      const avg =
        dataRef.current
          .slice(i * slice, i * slice + slice)
          .reduce((a, b) => a + b, 0) / (slice || 1);
      return Math.max(0.05, avg / 255);
    });
    setBars(next);
  }
  function stopAnimate() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setBars(Array(40).fill(0.08));
  }
  async function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      stopAnimate();
      setPlaying(false);
    } else {
      initCtx();
      if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
      await audioRef.current.play();
      animate();
      setPlaying(true);
    }
  }
  useEffect(
    () => () => {
      stopAnimate();
      ctxRef.current?.close();
    },
    [],
  );
  return (
    <div className="ap-shell">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => {
          setPlaying(false);
          stopAnimate();
          setProgress(0);
        }}
      />
      <div className="ap-wave">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`ap-bar ${playing ? "ap-bar-live" : ""}`}
            style={{
              height: `${Math.round(h * 52) + 4}px`,
              animationDelay: `${i * 0.025}s`,
              opacity: progress / (duration || 1) > i / 40 ? 1 : 0.28,
            }}
          />
        ))}
      </div>
      <div className="ap-controls">
        <button
          className={`ap-playbtn ${playing ? "ap-playbtn-pause" : ""}`}
          onClick={togglePlay}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <div className="ap-scrub-wrap">
          <input
            type="range"
            className="ap-scrub"
            min={0}
            max={duration || 1}
            step={0.1}
            value={progress}
            onChange={(e) => {
              audioRef.current.currentTime = +e.target.value;
              setProgress(+e.target.value);
            }}
          />
          <div className="ap-timestamps">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="ap-vol">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ opacity: 0.5 }}
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            className="ap-vol-range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => {
              audioRef.current.volume = +e.target.value;
              setVol(+e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FULL-PAGE DETAIL VIEW
════════════════════════════════ */
function ComplaintDetail({ complaint, onBack }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null);
  const [adminSrc, setAdminSrc] = useState(null);
  const [imgZoom, setImgZoom] = useState(false);
  const [tab, setTab] = useState("details");
  const st = getStatus(complaint.status);

  // ── Compute flags from raw data (NOT from blob URLs) ──
  // so tab enabled/disabled is known immediately before blobs are built
  const hasImg = !!complaint.imageComplaint;
  const hasAudio = !!complaint.audioComplaint;
  const hasPdf = !!complaint.pdfLLM;
  const hasAdminImg = !!complaint.administrativeImageAfterResolving;
  const hasAiText = !!complaint.complaintDescriptionLLM;

  const hasMedia = hasImg || hasAudio || hasAdminImg;
  const hasReport = hasPdf || hasAiText;

  // ── Build blob URLs ──
  useEffect(() => {
    const img = b64ToUrl(
      complaint.imageComplaint,
      guessImageMime(complaint.imageComplaint),
    );
    const audio = b64ToUrl(complaint.audioComplaint, "audio/mpeg");
    const pdf = b64ToUrl(complaint.pdfLLM, "application/pdf");
    const admin = b64ToUrl(
      complaint.administrativeImageAfterResolving,
      guessImageMime(complaint.administrativeImageAfterResolving),
    );
    setImgSrc(img);
    setAudioSrc(audio);
    setPdfSrc(pdf);
    setAdminSrc(admin);
    return () => {
      [img, audio, pdf, admin].forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [complaint]);

  return (
    <div className="fv-root">
      {imgZoom && imgSrc && (
        <div className="zoom-overlay" onClick={() => setImgZoom(false)}>
          <img src={imgSrc} alt="Zoomed" className="zoom-img" />
          <button className="zoom-close" onClick={() => setImgZoom(false)}>
            ✕
          </button>
        </div>
      )}

      {/* Sticky topbar */}
      <div className="fv-topbar">
        <button className="fv-backbtn" onClick={onBack}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="fv-topbar-center">
          <span className="fv-topbar-dept">
            {DEPT_ICONS[complaint.department] ?? "📋"} {complaint.department}
          </span>
          <span className="fv-topbar-dot">·</span>
          <span className="fv-topbar-district">{complaint.district}</span>
        </div>
        <span
          className="fv-status-chip"
          style={{
            color: st.color,
            background: st.bg,
            borderColor: `${st.dot}33`,
          }}
        >
          <span className="fv-status-dot" style={{ background: st.dot }} />
          {st.label}
        </span>
      </div>

      {/* Hero */}
      <div className="fv-hero">
        {imgSrc ? (
          <img src={imgSrc} alt="Complaint" className="fv-hero-img" />
        ) : (
          <div className="fv-hero-blank">
            <span>{DEPT_ICONS[complaint.department] ?? "📋"}</span>
          </div>
        )}
        <div className="fv-hero-overlay" />
        <div className="fv-hero-text">
          <div className="fv-hero-label">Complaint filed</div>
          <div className="fv-hero-date">
            {complaint.dateTime
              ? new Date(complaint.dateTime).toLocaleString("en-IN", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : "—"}
          </div>
        </div>
        {imgSrc && (
          <button className="fv-zoom-btn" onClick={() => setImgZoom(true)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Expand
          </button>
        )}
      </div>

      {/* Tabs — enabled/disabled based on raw data flags */}
      <div className="fv-tabs">
        {[
          { key: "details", label: "Details", disabled: false },
          { key: "media", label: "Media", disabled: !hasMedia },
          {
            key: "report",
            label: "AI Report",
            disabled: !hasReport,
            dot: hasReport,
          },
        ].map((t) => (
          <button
            key={t.key}
            className={`fv-tab ${tab === t.key ? "fv-tab-active" : ""} ${t.disabled ? "fv-tab-disabled" : ""}`}
            onClick={() => !t.disabled && setTab(t.key)}
          >
            {t.label}
            {t.dot && <span className="fv-tab-dot" />}
          </button>
        ))}
      </div>

      {/* ── Details tab ── */}
      {tab === "details" && (
        <div className="fv-body fv-body-anim">
          <div className="fv-meta-grid">
            {[
              [
                "Department",
                `${DEPT_ICONS[complaint.department] ?? ""} ${complaint.department}`,
              ],
              ["District", complaint.district],
              ["Landmark", complaint.landmark],
              ["Status", st.label],
              [
                "Filed On",
                complaint.dateTime
                  ? new Date(complaint.dateTime).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—",
              ],
              [
                "Time",
                complaint.dateTime
                  ? new Date(complaint.dateTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—",
              ],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="fv-meta-card">
                  <div className="fv-meta-label">{k}</div>
                  <div className="fv-meta-value">{v}</div>
                </div>
              ))}
          </div>

          <div className="fv-section">
            <div className="fv-section-head">Complaint Description</div>
            <div className="fv-desc">
              {complaint.complaintInWords ?? "No description provided."}
            </div>
          </div>

          <div className="fv-section">
            <div className="fv-section-head">Status Timeline</div>
            <div className="fv-timeline">
              {["SENT", "PENDING", "IN_PROGRESS", "SOLVED"].map((s, i) => {
                const cur = complaint.status?.toUpperCase();
                const statuses = ["SENT", "PENDING", "IN_PROGRESS", "SOLVED"];
                const curIdx = statuses.indexOf(cur);
                const isDone = i <= curIdx;
                const isCur = s === cur;
                const sm = getStatus(s);
                return (
                  <div
                    key={s}
                    className={`fv-tl-step ${isDone ? "fv-tl-done" : ""} ${isCur ? "fv-tl-cur" : ""}`}
                  >
                    <div
                      className="fv-tl-node"
                      style={
                        isCur
                          ? {
                              background: sm.dot,
                              boxShadow: `0 0 0 4px ${sm.bg}`,
                            }
                          : isDone
                            ? { background: sm.dot }
                            : {}
                      }
                    >
                      {isDone && !isCur && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="fv-tl-line" />
                    <div
                      className="fv-tl-label"
                      style={isCur ? { color: sm.color, fontWeight: 700 } : {}}
                    >
                      {getStatus(s).label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Media tab ── */}
      {tab === "media" && (
        <div className="fv-body fv-body-anim">
          {imgSrc && (
            <div className="fv-section">
              <div className="fv-section-head">Complaint Photo</div>
              <div className="fv-img-card" onClick={() => setImgZoom(true)}>
                <img src={imgSrc} alt="Complaint" className="fv-media-img" />
                <div className="fv-img-hint">Click to expand</div>
              </div>
            </div>
          )}
          {audioSrc && (
            <div className="fv-section">
              <div className="fv-section-head">Audio Recording</div>
              <AudioPlayer src={audioSrc} />
            </div>
          )}
          {adminSrc && (
            <div className="fv-section">
              <div className="fv-section-head">Resolution Proof</div>
              <div className="fv-img-card">
                <img src={adminSrc} alt="Resolution" className="fv-media-img" />
                <div className="fv-resolved-badge">✓ Resolved by Admin</div>
              </div>
            </div>
          )}
          {!imgSrc && !audioSrc && !adminSrc && (
            <div className="fv-empty-tab">
              <span>🎞️</span>
              <p>No media attachments yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── AI Report tab ── */}
      {tab === "report" && (
        <div className="fv-body fv-body-anim">
          {/* AI Text Analysis */}
          {hasAiText && (
            <div className="fv-section">
              <div className="fv-section-head">AI Analysis</div>
              <div className="fv-ai-card">
                <div className="fv-ai-badge-pill">🤖 AI</div>
                <p className="fv-ai-text">
                  {complaint.complaintDescriptionLLM}
                </p>
              </div>
            </div>
          )}

          {/* PDF Report */}
          <div className="fv-section">
            <div
              className="fv-section-head"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>AI PDF Report</span>
              {pdfSrc && (
                <a href={pdfSrc} download="report.pdf" className="fv-dl-btn">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
              )}
            </div>
            {pdfSrc ? (
              <div className="fv-pdf-shell">
                <iframe src={pdfSrc} title="AI Report" className="fv-pdf" />
              </div>
            ) : (
              <div className="fv-empty-tab">
                <span>📄</span>
                <p>PDF report will appear once the complaint is processed.</p>
              </div>
            )}
          </div>

          {/* Fallback if neither text nor pdf */}
          {!hasAiText && !hasPdf && (
            <div className="fv-empty-tab">
              <span>📄</span>
              <p>AI report will appear once the complaint is processed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   SKELETON
════════════════════════════════ */
function SkeletonRow() {
  return (
    <div className="mc-card mc-skel">
      <div className="mc-thumb skel" />
      <div className="mc-card-body">
        <div
          className="skel"
          style={{
            height: 13,
            width: "55%",
            borderRadius: 6,
            marginBottom: 10,
          }}
        />
        <div
          className="skel"
          style={{ height: 11, width: "85%", borderRadius: 6, marginBottom: 7 }}
        />
        <div
          className="skel"
          style={{ height: 11, width: "45%", borderRadius: 6 }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════
   LAZY THUMB
════════════════════════════════ */
function ComplaintThumb({ b64 }) {
  const [src, setSrc] = useState(null);
  const urlRef = useRef(null);
  useEffect(() => {
    if (!b64) return;
    const url = b64ToUrl(b64, guessImageMime(b64));
    urlRef.current = url;
    setSrc(url);
    return () => urlRef.current && URL.revokeObjectURL(urlRef.current);
  }, [b64]);
  if (!src) return <div className="mc-thumb mc-thumb-empty">📋</div>;
  return <img src={src} alt="" className="mc-thumb" loading="lazy" />;
}

/* ════════════════════════════════
   PAGE RANGE
════════════════════════════════ */
function pageRange(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, cur]);
  if (cur > 1) pages.add(cur - 1);
  if (cur < total - 2) pages.add(cur + 1);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
    result.push(p);
  });
  return result;
}

/* ════════════════════════════════
   MAIN
════════════════════════════════ */
export default function MyComplaints() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 1,
    totalComplaints: 0,
    isFirstPage: true,
    isLastPage: true,
    pageSize: 10,
  });
  const [sortBy, setSortBy] = useState("dateTime");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const listTopRef = useRef(null);

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
    fetchPage(0);
  }, [sortBy, sortOrder, pageSize]);

  async function fetchPage(page) {
    setLoading(true);
    setSelected(null);
    try {
      const res = await authFetch(
        `${API_BASE}/citizen/getMyComplaints?page=${page}&size=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      );
      if (res.status === 401) {
        clearAuthCookies();
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setComplaints(data.complaints ?? []);
      setPagination({
        currentPage: data.currentPage ?? page,
        totalPages: data.totalPages ?? 1,
        totalComplaints: data.totalComplaints ?? 0,
        isFirstPage: data.isFirstPage ?? page === 0,
        isLastPage: data.isLastPage ?? true,
        pageSize: data.pageSize ?? pageSize,
      });
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
      listTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        :root[data-theme="light"]{
          --bg:#f0f4ff;--bg-card:rgba(255,255,255,0.88);--bg-nav:rgba(240,244,255,0.92);
          --bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);
          --border-card:rgba(99,120,220,0.22);--text-primary:#0f1b3d;--text-secondary:#3b4a7a;
          --text-muted:#6b7aaa;--accent:#2a52e8;--accent-glow:rgba(42,82,232,0.15);
          --accent-badge:rgba(42,82,232,0.09);--shadow:0 8px 32px rgba(42,82,232,0.11);
          --shadow-card:0 2px 12px rgba(42,82,232,0.08);
        }
        :root[data-theme="dark"]{
          --bg:#080e24;--bg-card:rgba(14,22,58,0.85);--bg-nav:rgba(8,14,36,0.92);
          --bg-input:rgba(10,17,46,0.90);--border:rgba(80,120,255,0.15);
          --border-card:rgba(80,120,255,0.22);--text-primary:#e8eeff;--text-secondary:#a0b0e8;
          --text-muted:#5a6a9a;--accent:#5b8aff;--accent-glow:rgba(91,138,255,0.20);
          --accent-badge:rgba(91,138,255,0.12);--shadow:0 8px 32px rgba(0,0,0,0.50);
          --shadow-card:0 2px 12px rgba(0,0,0,0.40);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}

        .mc-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
        .mc-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
        .mc-logo-icon{width:34px;height:34px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;font-weight:800;}
        .mc-nav-right{display:flex;align-items:center;gap:8px;}
        .mc-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'DM Sans',sans-serif;}
        .mc-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
        .mc-nav-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.3);}
        .mc-nav-btn.danger:hover{background:rgba(239,68,68,0.08);border-color:#ef4444;}
        .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;}

        .mc-page{padding:80px 5vw 60px;max-width:900px;margin:0 auto;}
        .mc-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:6px;animation:fadeUp .4s ease both;}
        .mc-toolbar-title{font-family:'Outfit',sans-serif;font-size:1.55rem;font-weight:800;color:var(--text-primary);}
        .mc-toolbar-title span{color:var(--accent);}
        .mc-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .mc-select{padding:8px 12px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-input);color:var(--text-primary);font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;outline:none;cursor:pointer;transition:border .2s;}
        .mc-select:focus{border-color:var(--accent);}
        .mc-info{font-size:.78rem;color:var(--text-muted);margin-bottom:18px;animation:fadeUp .4s ease .05s both;}

        .mc-list{display:flex;flex-direction:column;gap:12px;margin-bottom:28px;}
        .mc-card{display:flex;align-items:flex-start;gap:16px;background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-card);border-radius:20px;padding:16px;box-shadow:var(--shadow-card);cursor:pointer;transition:transform .22s,box-shadow .22s,border-color .22s;animation:fadeUp .4s ease both;position:relative;overflow:hidden;}
        .mc-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--accent-badge) 0%,transparent 60%);opacity:0;transition:opacity .22s;}
        .mc-card:hover::before{opacity:1;}
        .mc-card:hover{transform:translateY(-3px) scale(1.005);box-shadow:var(--shadow);border-color:var(--accent);}
        .mc-skel{cursor:default;pointer-events:none;}
        .mc-thumb{width:92px;height:92px;border-radius:14px;object-fit:cover;flex-shrink:0;}
        .mc-thumb-empty{width:92px;height:92px;border-radius:14px;background:var(--accent-badge);display:flex;align-items:center;justify-content:center;font-size:1.9rem;flex-shrink:0;}
        .mc-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;position:relative;z-index:1;}
        .mc-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
        .mc-card-dept{font-family:'Outfit',sans-serif;font-size:.84rem;font-weight:700;color:var(--accent);}
        .status-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700;border:1px solid transparent;white-space:nowrap;flex-shrink:0;}
        .status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
        .mc-card-text{font-size:.88rem;color:var(--text-primary);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .mc-card-footer{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
        .mc-meta{font-size:.73rem;color:var(--text-muted);}

        .skel{background:var(--border-card);animation:shimmer 1.4s ease infinite;}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.85}}

        .mc-empty{text-align:center;padding:72px 24px;animation:fadeUp .5s ease both;}
        .mc-empty-icon{font-size:3.5rem;margin-bottom:14px;display:block;animation:float 3s ease-in-out infinite;}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .mc-empty h3{font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:700;margin-bottom:8px;}
        .mc-empty p{font-size:.88rem;color:var(--text-secondary);max-width:340px;margin:0 auto 20px;}
        .mc-file-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 26px;border-radius:14px;background:var(--accent);color:#fff;font-family:'Outfit',sans-serif;font-size:.92rem;font-weight:700;text-decoration:none;box-shadow:0 6px 24px var(--accent-glow);transition:all .2s;}
        .mc-file-btn:hover{opacity:.88;transform:translateY(-2px);}

        .mc-pagination{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:8px 0;animation:fadeUp .4s ease .1s both;}
        .pg-btn{min-width:38px;height:38px;padding:0 10px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.84rem;font-weight:700;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;}
        .pg-btn:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
        .pg-btn.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 4px 14px var(--accent-glow);}
        .pg-btn:disabled{opacity:.35;cursor:not-allowed;}
        .pg-ellipsis{color:var(--text-muted);font-size:.9rem;align-self:center;}

        /* Detail view */
        .fv-root{position:fixed;inset:0;z-index:300;background:var(--bg);overflow-y:auto;animation:fvIn .28s cubic-bezier(.4,0,.2,1) both;}
        @keyframes fvIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .fv-topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 24px;height:60px;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border-card);}
        .fv-backbtn{display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.84rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;flex-shrink:0;}
        .fv-backbtn:hover{border-color:var(--accent);color:var(--accent);}
        .fv-topbar-center{display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:700;color:var(--text-primary);overflow:hidden;}
        .fv-topbar-dept{white-space:nowrap;}
        .fv-topbar-dot{color:var(--text-muted);}
        .fv-topbar-district{color:var(--text-muted);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .fv-status-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;font-size:.75rem;font-weight:700;border:1px solid;white-space:nowrap;flex-shrink:0;}
        .fv-status-dot{width:7px;height:7px;border-radius:50%;animation:pulse-dot 2s ease infinite;}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}
        .fv-hero{position:relative;width:100%;height:260px;overflow:hidden;background:var(--bg-card);}
        .fv-hero-img{width:100%;height:100%;object-fit:cover;}
        .fv-hero-blank{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem;background:var(--bg-card);}
        .fv-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,var(--bg) 0%,transparent 50%);}
        .fv-hero-text{position:absolute;bottom:20px;left:24px;}
        .fv-hero-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:3px;}
        .fv-hero-date{font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);}
        .fv-zoom-btn{position:absolute;bottom:20px;right:20px;display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;}
        .fv-tabs{display:flex;align-items:center;gap:0;padding:0 24px;border-bottom:1px solid var(--border-card);background:var(--bg-nav);backdrop-filter:blur(16px);}
        .fv-tab{padding:14px 20px;font-size:.86rem;font-weight:600;color:var(--text-muted);border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all .2s;font-family:'DM Sans',sans-serif;position:relative;}
        .fv-tab:hover{color:var(--text-primary);}
        .fv-tab-active{color:var(--accent);border-bottom-color:var(--accent);font-weight:700;}
        .fv-tab-disabled{opacity:.35;cursor:not-allowed;}
        .fv-tab-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);position:absolute;top:10px;right:10px;}
        .fv-body{max-width:760px;margin:0 auto;padding:32px 24px 64px;display:flex;flex-direction:column;gap:32px;}
        .fv-body-anim{animation:fadeUp .3s ease both;}
        .fv-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .fv-meta-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:14px 16px;transition:border-color .2s;}
        .fv-meta-card:hover{border-color:var(--accent);}
        .fv-meta-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:5px;}
        .fv-meta-value{font-size:.9rem;font-weight:600;color:var(--text-primary);}
        .fv-section{display:flex;flex-direction:column;gap:14px;}
        .fv-section-head{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px;}
        .fv-section-head::after{content:'';flex:1;height:1px;background:var(--border-card);}
        .fv-desc{font-size:.9rem;color:var(--text-secondary);line-height:1.75;background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:18px 20px;}
        .fv-timeline{display:flex;align-items:flex-start;gap:0;padding:4px 0;}
        .fv-tl-step{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
        .fv-tl-node{width:28px;height:28px;border-radius:50%;background:var(--border-card);border:2px solid var(--border-card);display:flex;align-items:center;justify-content:center;z-index:1;transition:all .3s;}
        .fv-tl-done .fv-tl-node{background:var(--text-muted);border-color:var(--text-muted);}
        .fv-tl-line{position:absolute;top:14px;left:calc(50% + 14px);right:calc(-50% + 14px);height:2px;background:var(--border-card);z-index:0;}
        .fv-tl-step:last-child .fv-tl-line{display:none;}
        .fv-tl-done .fv-tl-line{background:var(--text-muted);}
        .fv-tl-label{font-size:.7rem;font-weight:600;color:var(--text-muted);margin-top:8px;text-align:center;}
        .fv-img-card{border-radius:18px;overflow:hidden;border:1px solid var(--border-card);cursor:pointer;position:relative;background:var(--bg-card);}
        .fv-media-img{width:100%;max-height:420px;object-fit:contain;display:block;}
        .fv-img-hint{position:absolute;bottom:12px;right:12px;padding:5px 12px;border-radius:8px;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);color:#fff;font-size:.72rem;font-weight:600;}
        .fv-resolved-badge{position:absolute;top:12px;right:12px;padding:5px 14px;border-radius:999px;background:rgba(52,211,153,0.2);border:1px solid rgba(52,211,153,0.4);color:#34d399;font-size:.74rem;font-weight:700;}

        /* ── AI Report card ── */
        .fv-ai-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .fv-ai-badge-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a78bfa;font-size:.72rem;font-weight:700;align-self:flex-start;}
        .fv-ai-text{font-size:.9rem;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;margin:0;}

        .fv-pdf-shell{border-radius:16px;overflow:hidden;border:1px solid var(--border-card);background:var(--bg-card);}
        .fv-pdf{width:100%;height:620px;border:none;display:block;}
        .fv-dl-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;background:var(--accent);color:#fff;font-size:.78rem;font-weight:700;text-decoration:none;transition:opacity .2s;}
        .fv-dl-btn:hover{opacity:.85;}
        .fv-empty-tab{text-align:center;padding:60px 24px;color:var(--text-muted);}
        .fv-empty-tab span{font-size:3rem;display:block;margin-bottom:12px;}
        .fv-empty-tab p{font-size:.88rem;}

        .zoom-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease both;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .zoom-img{max-width:90vw;max-height:90vh;border-radius:16px;object-fit:contain;box-shadow:0 32px 80px rgba(0,0,0,0.7);}
        .zoom-close{position:absolute;top:24px;right:24px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;}

        .ap-shell{background:var(--bg-card);border:1px solid var(--border-card);border-radius:20px;padding:20px 22px;display:flex;flex-direction:column;gap:16px;}
        .ap-wave{display:flex;align-items:center;justify-content:center;gap:3px;height:60px;}
        .ap-bar{width:4px;border-radius:999px;background:var(--accent);transition:height .08s ease;flex-shrink:0;}
        .ap-bar-live{animation:barBounce .6s ease-in-out infinite alternate;}
        @keyframes barBounce{from{transform:scaleY(1)}to{transform:scaleY(1.15)}}
        .ap-controls{display:flex;align-items:center;gap:14px;}
        .ap-playbtn{width:46px;height:46px;border-radius:50%;background:var(--accent);border:none;color:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px var(--accent-glow);transition:transform .15s,opacity .15s;}
        .ap-playbtn:hover{transform:scale(1.08);}
        .ap-playbtn-pause{background:var(--text-muted);}
        .ap-scrub-wrap{flex:1;display:flex;flex-direction:column;gap:5px;}
        .ap-scrub{width:100%;accent-color:var(--accent);cursor:pointer;height:4px;}
        .ap-timestamps{display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-muted);}
        .ap-vol{display:flex;align-items:center;gap:7px;}
        .ap-vol-range{width:72px;accent-color:var(--accent);cursor:pointer;height:3px;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .Toastify__toast{border-radius:14px!important;font-family:'DM Sans',sans-serif!important;}

        @media(max-width:700px){
          .mc-page{padding:76px 4vw 48px;}
          .mc-thumb,.mc-thumb-empty{width:74px;height:74px;}
          .fv-meta-grid{grid-template-columns:1fr 1fr;}
          .fv-hero{height:200px;}
          .fv-body{padding:24px 16px 56px;}
          .fv-topbar{padding:0 14px;}
          .fv-topbar-center{display:none;}
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme={dark ? "dark" : "light"}
      />

      {selected && (
        <ComplaintDetail
          complaint={selected}
          onBack={() => setSelected(null)}
        />
      )}

      <nav className="mc-nav">
        <a href="/citizen/dashboard" className="mc-logo">
          <span className="mc-logo-icon">CG</span>
          <span>CitizenGrievance</span>
        </a>
        <div className="mc-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          <a href="/citizen/dashboard" className="mc-nav-btn">
            Dashboard
          </a>
          <a href="/citizen/file-complaint" className="mc-nav-btn">
            + File Complaint
          </a>
          <button
            className="mc-nav-btn danger"
            onClick={() => {
              clearAuthCookies();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="mc-page" ref={listTopRef}>
        <div className="mc-toolbar">
          <div className="mc-toolbar-title">
            My Complaints <span>({pagination.totalComplaints})</span>
          </div>
          <div className="mc-controls">
            <select
              className="mc-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dateTime">Sort: Date</option>
              <option value="status">Sort: Status</option>
              <option value="department">Sort: Department</option>
            </select>
            <select
              className="mc-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">↓ Newest</option>
              <option value="asc">↑ Oldest</option>
            </select>
            <select
              className="mc-select"
              value={pageSize}
              onChange={(e) => setPageSize(+e.target.value)}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </div>

        <div className="mc-info">
          {!loading &&
            `Showing ${complaints.length} of ${pagination.totalComplaints} — Page ${pagination.currentPage + 1} of ${pagination.totalPages}`}
        </div>

        <div className="mc-list">
          {loading ? (
            Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
              <SkeletonRow key={i} />
            ))
          ) : complaints.length === 0 ? (
            <div className="mc-empty">
              <span className="mc-empty-icon">📭</span>
              <h3>No complaints yet</h3>
              <p>
                You haven't filed any complaints. Start by reporting a local
                issue.
              </p>
              <a href="/citizen/file-complaint" className="mc-file-btn">
                📝 File a Complaint
              </a>
            </div>
          ) : (
            complaints.map((c, i) => {
              const st = getStatus(c.status);
              return (
                <div
                  key={i}
                  className="mc-card"
                  onClick={() => setSelected(c)}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <ComplaintThumb b64={c.imageComplaint} />
                  <div className="mc-card-body">
                    <div className="mc-card-top">
                      <span className="mc-card-dept">
                        {DEPT_ICONS[c.department] ?? "📋"} {c.department} ·{" "}
                        {c.district}
                      </span>
                      <span
                        className="status-chip"
                        style={{
                          color: st.color,
                          background: st.bg,
                          borderColor: `${st.dot}44`,
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{ background: st.dot }}
                        />
                        {st.label}
                      </span>
                    </div>
                    <p className="mc-card-text">{c.complaintInWords ?? "—"}</p>
                    <div className="mc-card-footer">
                      {c.dateTime && (
                        <span className="mc-meta">
                          🗓️{" "}
                          {new Date(c.dateTime).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {c.landmark && (
                        <span className="mc-meta">📌 {c.landmark}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && pagination.totalPages > 1 && (
          <div className="mc-pagination">
            <button
              className="pg-btn"
              disabled={pagination.isFirstPage}
              onClick={() => fetchPage(pagination.currentPage - 1)}
            >
              ← Prev
            </button>
            {pageRange(pagination.currentPage, pagination.totalPages).map(
              (p, i) =>
                p === "..." ? (
                  <span key={`el${i}`} className="pg-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`pg-btn${p === pagination.currentPage ? " active" : ""}`}
                    onClick={() => fetchPage(p)}
                  >
                    {p + 1}
                  </button>
                ),
            )}
            <button
              className="pg-btn"
              disabled={pagination.isLastPage}
              onClick={() => fetchPage(pagination.currentPage + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
