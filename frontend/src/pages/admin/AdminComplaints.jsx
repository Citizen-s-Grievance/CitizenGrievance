import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAuthToken,
  clearAuthCookies,
  isLoggedIn,
} from "../../utils/authCookie";

const BASE = "http://localhost:8080/admin";

async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: getAuthToken() ?? "",
      ...(options.headers ?? {}),
    },
  });
}

function b64ToUrl(b64, mime) {
  if (!b64 || typeof b64 !== "string") return null;
  try {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch {
    return null;
  }
}

function guessImgMime(b64) {
  if (!b64) return "image/jpeg";
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("R0lGO")) return "image/gif";
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
  "IN PROGRESS": {
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
  RESOLVED: {
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
const STATUS_TIMELINE = ["SENT", "PENDING", "IN_PROGRESS", "SOLVED"];

/* ── Audio Player ── */
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
    setBars(
      Array.from({ length: 40 }, (_, i) =>
        Math.max(
          0.05,
          dataRef.current
            .slice(i * slice, i * slice + slice)
            .reduce((a, b) => a + b, 0) / (slice * 255 || 1),
        ),
      ),
    );
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

/* ── Detail View ── */
function ComplaintDetail({ complaint: c, onBack, onUpdated }) {
  const imgUrl = useRef(null);
  const audioUrl = useRef(null);
  const pdfUrl = useRef(null);
  const adminUrl = useRef(null);
  const [ready, setReady] = useState(false);
  const [imgZoom, setImgZoom] = useState(false);
  const [tab, setTab] = useState("details");
  const [repairedImage, setRepairedImage] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);
  const st = getStatus(c.status);
  const isAlreadyResolved = ["SOLVED", "RESOLVED"].includes(
    c.status?.toUpperCase(),
  );

  useEffect(() => {
    imgUrl.current = b64ToUrl(c.userImage, guessImgMime(c.userImage));
    audioUrl.current = b64ToUrl(c.audioComplaint, "audio/mpeg");
    pdfUrl.current = b64ToUrl(c.pdfLLM, "application/pdf");
    adminUrl.current = b64ToUrl(
      c.administrationImage,
      guessImgMime(c.administrationImage),
    );
    setReady(true);
    return () =>
      [imgUrl, audioUrl, pdfUrl, adminUrl].forEach(
        (r) => r.current && URL.revokeObjectURL(r.current),
      );
  }, [c.complaintId]);

  const hasMedia =
    ready && (imgUrl.current || audioUrl.current || adminUrl.current);
  const hasReport = ready && (pdfUrl.current || c.complaintDescriptionLLM);

  async function handleResolve() {
    setResolving(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("status", "SOLVED");
      if (repairedImage) fd.append("repaired-image", repairedImage);
      const res = await fetch(`${BASE}/complaint/resolve/${c.complaintId}`, {
        method: "PUT",
        headers: { Authorization: getAuthToken() },
        body: fd,
      });
      if (res.ok) {
        setMsg("✅ Marked as Resolved!");
        setTimeout(() => {
          onBack();
          onUpdated();
        }, 1200);
      } else setMsg("❌ " + (await res.text()));
    } catch {
      setMsg("❌ Network error.");
    }
    setResolving(false);
  }

  return (
    <div className="fv-root">
      {imgZoom && imgUrl.current && (
        <div className="zoom-overlay" onClick={() => setImgZoom(false)}>
          <img src={imgUrl.current} alt="Zoomed" className="zoom-img" />
          <button className="zoom-close" onClick={() => setImgZoom(false)}>
            ✕
          </button>
        </div>
      )}
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
            {DEPT_ICONS[c.department] ?? "📋"} {c.department}
          </span>
          <span className="fv-topbar-dot">·</span>
          <span className="fv-topbar-district">{c.district}</span>
          <span className="fv-topbar-dot">·</span>
          <span className="fv-topbar-district">#{c.complaintId}</span>
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

      <div className="fv-hero">
        {ready && imgUrl.current ? (
          <img src={imgUrl.current} alt="Complaint" className="fv-hero-img" />
        ) : (
          <div className="fv-hero-blank">
            <span>{DEPT_ICONS[c.department] ?? "📋"}</span>
          </div>
        )}
        <div className="fv-hero-overlay" />
        <div className="fv-hero-text">
          <div className="fv-hero-label">
            Filed by {c.userName ?? "Unknown"}
          </div>
          <div className="fv-hero-date">
            {c.dateTime
              ? new Date(c.dateTime).toLocaleString("en-IN", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : "—"}
          </div>
        </div>
        {ready && imgUrl.current && (
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

      <div className="fv-tabs">
        {[
          { key: "details", label: "Details", disabled: false },
          { key: "citizen", label: "Citizen", disabled: false },
          { key: "media", label: "Media", disabled: !hasMedia },
          {
            key: "report",
            label: "AI Report",
            disabled: !hasReport,
            dot: hasReport,
          },
          {
            key: "resolve",
            label: isAlreadyResolved ? "✓ Resolved" : "Resolve",
            disabled: false,
            accent: true,
          },
        ].map((t) => (
          <button
            key={t.key}
            className={`fv-tab ${tab === t.key ? "fv-tab-active" : ""} ${t.disabled ? "fv-tab-disabled" : ""} ${t.accent ? "fv-tab-resolve" : ""}`}
            onClick={() => !t.disabled && setTab(t.key)}
          >
            {t.label}
            {t.dot && <span className="fv-tab-dot" />}
          </button>
        ))}
      </div>

      {/* Details */}
      {tab === "details" && (
        <div className="fv-body fv-body-anim">
          <div className="fv-meta-grid">
            {[
              [
                "Department",
                `${DEPT_ICONS[c.department] ?? ""} ${c.department}`,
              ],
              ["District", c.district],
              ["Landmark", c.landmark],
              ["Status", st.label],
              ["Citizen", c.userName],
              ["Phone", c.userPhone],
              [
                "Filed On",
                c.dateTime
                  ? new Date(c.dateTime).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null,
              ],
              [
                "Time",
                c.dateTime
                  ? new Date(c.dateTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null,
              ],
              [
                "Coordinates",
                c.latitude ? `${c.latitude}, ${c.longitude}` : null,
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
              {c.complaintInWords ?? "No description provided."}
            </div>
          </div>
          {c.complaintDescriptionLLM && (
            <div className="fv-section">
              <div className="fv-section-head">AI Summary</div>
              <div className="fv-desc">
                <span className="fv-ai-badge">✦ AI</span>
                {c.complaintDescriptionLLM}
              </div>
            </div>
          )}
          <div className="fv-section">
            <div className="fv-section-head">Status Timeline</div>
            <div className="fv-timeline">
              {STATUS_TIMELINE.map((s, i) => {
                const curIdx = STATUS_TIMELINE.findIndex(
                  (x) => x === c.status?.toUpperCase().replace(" ", "_"),
                );
                const isDone = i <= curIdx;
                const isCur = i === curIdx;
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
                    {i < STATUS_TIMELINE.length - 1 && (
                      <div className="fv-tl-line" />
                    )}
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

      {/* Citizen */}
      {tab === "citizen" && (
        <div className="fv-body fv-body-anim">
          <div className="fv-section">
            <div className="fv-section-head">Citizen Information</div>
            <div className="fv-citizen-card">
              <div className="fv-citizen-avatar">
                {c.userName?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="fv-citizen-info">
                <div className="fv-citizen-name">{c.userName ?? "—"}</div>
                <div className="fv-citizen-meta">
                  📞 {c.userPhone ?? "Not provided"}
                </div>
              </div>
            </div>
          </div>
          {c.latitude && c.longitude && (
            <div className="fv-section">
              <div className="fv-section-head">Location</div>
              <div className="fv-location-card">
                <div className="fv-location-coords">
                  <div className="fv-coord-item">
                    <span className="fv-coord-label">Latitude</span>
                    <span className="fv-coord-val">{c.latitude}</span>
                  </div>
                  <div className="fv-coord-divider" />
                  <div className="fv-coord-item">
                    <span className="fv-coord-label">Longitude</span>
                    <span className="fv-coord-val">{c.longitude}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fv-map-btn"
                >
                  🗺️ Open in Maps
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {tab === "media" && ready && (
        <div className="fv-body fv-body-anim">
          {imgUrl.current && (
            <div className="fv-section">
              <div className="fv-section-head">Complaint Photo</div>
              <div className="fv-img-card" onClick={() => setImgZoom(true)}>
                <img
                  src={imgUrl.current}
                  alt="Complaint"
                  className="fv-media-img"
                />
                <div className="fv-img-hint">Click to expand</div>
              </div>
            </div>
          )}
          {audioUrl.current && (
            <div className="fv-section">
              <div className="fv-section-head">Audio Recording</div>
              <AudioPlayer src={audioUrl.current} />
            </div>
          )}
          {adminUrl.current && (
            <div className="fv-section">
              <div className="fv-section-head">Resolution Proof</div>
              <div className="fv-img-card">
                <img
                  src={adminUrl.current}
                  alt="Resolution"
                  className="fv-media-img"
                />
                <div className="fv-resolved-badge">✓ Resolved by Admin</div>
              </div>
            </div>
          )}
          {!imgUrl.current && !audioUrl.current && !adminUrl.current && (
            <div className="fv-empty-tab">
              <span>🎞️</span>
              <p>No media attachments yet.</p>
            </div>
          )}
        </div>
      )}

      {/* AI Report */}
      {tab === "report" && ready && (
        <div className="fv-body fv-body-anim">
          {c.complaintDescriptionLLM && (
            <div className="fv-section">
              <div className="fv-section-head">AI Analysis</div>
              <div className="fv-desc" style={{ whiteSpace: "pre-wrap" }}>
                <span className="fv-ai-badge">✦ AI</span>
                {c.complaintDescriptionLLM}
              </div>
            </div>
          )}
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
              {pdfUrl.current && (
                <a
                  href={pdfUrl.current}
                  download="ai-report.pdf"
                  className="fv-dl-btn"
                >
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
            {pdfUrl.current ? (
              <div className="fv-pdf-shell">
                <iframe
                  src={pdfUrl.current}
                  title="AI Report"
                  className="fv-pdf"
                />
              </div>
            ) : (
              <div className="fv-not-generated">
                <span>📄</span>
                <p>PDF not yet generated.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolve — only SOLVED, no status picker */}
      {tab === "resolve" && (
        <div className="fv-body fv-body-anim">
          {isAlreadyResolved ? (
            <div className="fv-resolved-panel">
              <div className="fv-resolved-panel-icon">✅</div>
              <div className="fv-resolved-panel-title">Already Resolved</div>
              <div className="fv-resolved-panel-sub">
                This complaint has been marked as resolved.
              </div>
              {adminUrl.current && (
                <div
                  className="fv-section"
                  style={{ width: "100%", marginTop: 20 }}
                >
                  <div className="fv-section-head">Uploaded Proof</div>
                  <div className="fv-img-card">
                    <img
                      src={adminUrl.current}
                      alt="Resolution"
                      className="fv-media-img"
                    />
                    <div className="fv-resolved-badge">✓ Proof uploaded</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="fv-section">
              <div className="fv-section-head">Mark as Resolved</div>
              <div className="fv-resolve-card">
                <div className="fv-resolve-current">
                  <span className="fv-resolve-current-label">
                    Status change
                  </span>
                  <span
                    className="fv-status-chip"
                    style={{
                      color: st.color,
                      background: st.bg,
                      borderColor: `${st.dot}33`,
                    }}
                  >
                    <span
                      className="fv-status-dot"
                      style={{ background: st.dot }}
                    />
                    {st.label}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span
                    className="fv-status-chip"
                    style={{
                      color: "#34d399",
                      background: "rgba(52,211,153,0.12)",
                      borderColor: "rgba(52,211,153,0.33)",
                    }}
                  >
                    <span
                      className="fv-status-dot"
                      style={{ background: "#34d399" }}
                    />
                    Resolved
                  </span>
                </div>
                <div className="fv-resolve-field">
                  <label className="fv-resolve-field-label">
                    Resolution Proof Image{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "var(--text-muted)",
                        marginLeft: 6,
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  {repairedImage && (
                    <div className="fv-img-card" style={{ marginBottom: 12 }}>
                      <img
                        src={URL.createObjectURL(repairedImage)}
                        alt="preview"
                        className="fv-media-img"
                      />
                      <div
                        className="fv-resolved-badge"
                        style={{
                          background: "rgba(56,189,248,0.2)",
                          borderColor: "rgba(56,189,248,0.4)",
                          color: "#38bdf8",
                        }}
                      >
                        New image selected
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setRepairedImage(e.target.files[0] || null)
                    }
                  />
                  <button
                    className="fv-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {repairedImage
                      ? "Change Image"
                      : "Upload Before/After Proof"}
                  </button>
                </div>
                {msg && (
                  <div
                    className="fv-msg"
                    style={{
                      color: msg.startsWith("✅") ? "#34d399" : "#f87171",
                    }}
                  >
                    {msg}
                  </div>
                )}
                <button
                  className="fv-save-btn"
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  {resolving ? (
                    <span className="fv-save-spinner" />
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Mark as Resolved
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
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

function ComplaintThumb({ b64 }) {
  const [src, setSrc] = useState(null);
  const urlRef = useRef(null);
  useEffect(() => {
    if (!b64) return;
    const url = b64ToUrl(b64, guessImgMime(b64));
    urlRef.current = url;
    setSrc(url);
    return () => urlRef.current && URL.revokeObjectURL(urlRef.current);
  }, [b64]);
  if (!src) return <div className="mc-thumb mc-thumb-empty">📋</div>;
  return <img src={src} alt="" className="mc-thumb" loading="lazy" />;
}

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

export default function AdminComplaints() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 1,
    total: 0,
  });
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
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
    fetchProfile();
    fetchPage(0);
  }, [sortOrder, pageSize]);

  async function fetchProfile() {
    try {
      const res = await authFetch(`${BASE}/profile`);
      if (res.ok) setProfile(await res.json());
    } catch {}
  }

  async function fetchPage(page) {
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await authFetch(
        `${BASE}/complaints?page=${page}&size=${pageSize}&sortBy=dateTime&sortOrder=${sortOrder}`,
      );
      if (res.status === 401) {
        clearAuthCookies();
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.complaints)
          ? data.complaints
          : Array.isArray(data?.content)
            ? data.content
            : [];
      setComplaints(list);
      setPagination({
        currentPage: data.currentPage ?? data.number ?? page,
        totalPages: data.totalPages ?? 1,
        total: data.totalComplaints ?? data.totalElements ?? list.length,
      });
    } catch (e) {
      setError("Failed to load: " + e.message);
    }
    setLoading(false);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filtered = useMemo(() => {
    const safe = Array.isArray(complaints) ? complaints : [];
    if (filterStatus === "all") return safe;
    return safe.filter((c) => {
      const s = (c.status ?? "").toUpperCase().replace(" ", "_");
      const f = filterStatus.toUpperCase().replace(" ", "_");
      return (
        s === f ||
        (f === "SOLVED" && s === "RESOLVED") ||
        (f === "RESOLVED" && s === "SOLVED")
      );
    });
  }, [complaints, filterStatus]);

  const statusCounts = useMemo(
    () =>
      complaints.reduce((acc, c) => {
        const s = c.status?.toUpperCase().replace(" ", "_") ?? "UNKNOWN";
        const key = s === "RESOLVED" ? "SOLVED" : s;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    [complaints],
  );

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
    :root[data-theme="light"]{--bg:#f0f4ff;--bg-card:rgba(255,255,255,0.88);--bg-nav:rgba(240,244,255,0.92);--bg-input:rgba(255,255,255,0.95);--border:rgba(99,120,220,0.15);--border-card:rgba(99,120,220,0.22);--text-primary:#0f1b3d;--text-secondary:#3b4a7a;--text-muted:#6b7aaa;--accent:#7c3aed;--accent-glow:rgba(124,58,237,0.15);--accent-badge:rgba(124,58,237,0.09);--shadow:0 8px 32px rgba(124,58,237,0.11);--shadow-card:0 2px 12px rgba(124,58,237,0.08);}
    :root[data-theme="dark"]{--bg:#080e24;--bg-card:rgba(14,22,58,0.85);--bg-nav:rgba(8,14,36,0.92);--bg-input:rgba(10,17,46,0.90);--border:rgba(167,139,250,0.15);--border-card:rgba(167,139,250,0.22);--text-primary:#e8eeff;--text-secondary:#a0b0e8;--text-muted:#5a6a9a;--accent:#a78bfa;--accent-glow:rgba(167,139,250,0.20);--accent-badge:rgba(167,139,250,0.12);--shadow:0 8px 32px rgba(0,0,0,0.50);--shadow-card:0 2px 12px rgba(0,0,0,0.40);}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}
    .mc-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:var(--bg-nav);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
    .mc-logo{display:flex;align-items:center;gap:10px;font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);text-decoration:none;}
    .mc-logo-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.9rem;font-weight:800;}
    .mc-admin-tag{font-size:.7rem;font-weight:700;background:var(--accent-badge);color:var(--accent);border-radius:20px;padding:3px 10px;border:1px solid var(--border-card);}
    .mc-nav-right{display:flex;align-items:center;gap:8px;}
    .mc-nav-btn{padding:7px 14px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.82rem;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;font-family:'DM Sans',sans-serif;}
    .mc-nav-btn:hover{border-color:var(--accent);color:var(--accent);}
    .mc-nav-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.3);}
    .mc-nav-btn.danger:hover{background:rgba(239,68,68,0.08);border-color:#ef4444;}
    .theme-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;}
    .mc-profile-chip{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);}
    .mc-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;color:#fff;}
    .mc-chip-name{font-size:.82rem;font-weight:600;color:var(--text-primary);}
    .mc-chip-dept{font-size:.7rem;color:var(--text-muted);}
    .mc-page{padding:80px 5vw 60px;max-width:980px;margin:0 auto;}
    .mc-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:22px;animation:fadeUp .4s ease both;}
    .mc-stat-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:14px;padding:14px 16px;cursor:pointer;transition:all .2s;}
    .mc-stat-card:hover{border-color:var(--accent);transform:translateY(-2px);}
    .mc-stat-card.active{border-color:var(--accent);background:var(--accent-badge);}
    .mc-stat-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:5px;display:flex;align-items:center;gap:5px;}
    .mc-stat-dot{width:6px;height:6px;border-radius:50%;display:inline-block;}
    .mc-stat-value{font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:800;color:var(--text-primary);}
    .mc-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:6px;animation:fadeUp .4s ease both;}
    .mc-toolbar-title{font-family:'Outfit',sans-serif;font-size:1.55rem;font-weight:800;color:var(--text-primary);}
    .mc-toolbar-title span{color:var(--accent);}
    .mc-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .mc-select{padding:8px 12px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-input);color:var(--text-primary);font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;outline:none;cursor:pointer;transition:border .2s;}
    .mc-select:focus{border-color:var(--accent);}
    .mc-info{font-size:.78rem;color:var(--text-muted);margin-bottom:18px;}
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
    .mc-action-badge{font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);}
    .mc-proof-badge{font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.25);}
    .skel{background:var(--border-card);animation:shimmer 1.4s ease infinite;}
    @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.85}}
    .mc-empty{text-align:center;padding:72px 24px;}
    .mc-empty-icon{font-size:3.5rem;margin-bottom:14px;display:block;}
    .mc-empty h3{font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:700;margin-bottom:8px;}
    .mc-empty p{font-size:.88rem;color:var(--text-secondary);}
    .mc-pagination{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:8px 0;}
    .pg-btn{min-width:38px;height:38px;padding:0 10px;border-radius:10px;border:1.5px solid var(--border-card);background:var(--bg-card);color:var(--text-primary);font-size:.84rem;font-weight:700;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;}
    .pg-btn:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
    .pg-btn.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 4px 14px var(--accent-glow);}
    .pg-btn:disabled{opacity:.35;cursor:not-allowed;}
    .pg-ellipsis{color:var(--text-muted);font-size:.9rem;align-self:center;}
    .mc-error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:.88rem;}
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
    .fv-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,var(--bg) 0%,transparent 55%);}
    .fv-hero-text{position:absolute;bottom:20px;left:24px;}
    .fv-hero-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:3px;}
    .fv-hero-date{font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;color:var(--text-primary);}
    .fv-zoom-btn{position:absolute;bottom:20px;right:20px;display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:.75rem;font-weight:600;cursor:pointer;}
    .fv-tabs{display:flex;align-items:center;padding:0 24px;border-bottom:1px solid var(--border-card);background:var(--bg-nav);backdrop-filter:blur(16px);}
    .fv-tab{padding:14px 18px;font-size:.86rem;font-weight:600;color:var(--text-muted);border:none;background:transparent;cursor:pointer;border-bottom:2.5px solid transparent;transition:all .2s;font-family:'DM Sans',sans-serif;position:relative;}
    .fv-tab:hover{color:var(--text-primary);}
    .fv-tab-active{color:var(--accent);border-bottom-color:var(--accent);font-weight:700;}
    .fv-tab-disabled{opacity:.35;cursor:not-allowed;}
    .fv-tab-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);position:absolute;top:10px;right:10px;}
    .fv-tab-resolve{color:#34d399;}
    .fv-tab-resolve.fv-tab-active{color:#34d399;border-bottom-color:#34d399;}
    .fv-body{max-width:780px;margin:0 auto;padding:32px 24px 64px;display:flex;flex-direction:column;gap:32px;}
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
    .fv-ai-badge{display:inline-block;font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--accent);color:#fff;margin-right:8px;vertical-align:middle;}
    .fv-timeline{display:flex;align-items:flex-start;padding:4px 0;}
    .fv-tl-step{display:flex;flex-direction:column;align-items:center;flex:1;position:relative;}
    .fv-tl-node{width:28px;height:28px;border-radius:50%;background:var(--border-card);border:2px solid var(--border-card);display:flex;align-items:center;justify-content:center;z-index:1;transition:all .3s;}
    .fv-tl-done .fv-tl-node{background:var(--text-muted);border-color:var(--text-muted);}
    .fv-tl-line{position:absolute;top:14px;left:calc(50% + 14px);right:calc(-50% + 14px);height:2px;background:var(--border-card);z-index:0;}
    .fv-tl-done .fv-tl-line{background:var(--text-muted);}
    .fv-tl-label{font-size:.7rem;font-weight:600;color:var(--text-muted);margin-top:8px;text-align:center;}
    .fv-citizen-card{display:flex;align-items:center;gap:16px;background:var(--bg-card);border:1px solid var(--border-card);border-radius:18px;padding:20px;}
    .fv-citizen-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#fff;flex-shrink:0;}
    .fv-citizen-info{display:flex;flex-direction:column;gap:6px;}
    .fv-citizen-name{font-family:'Outfit',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text-primary);}
    .fv-citizen-meta{font-size:.84rem;color:var(--text-secondary);}
    .fv-location-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:16px;}
    .fv-location-coords{display:flex;align-items:center;}
    .fv-coord-item{flex:1;display:flex;flex-direction:column;gap:4px;}
    .fv-coord-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);}
    .fv-coord-val{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;color:var(--text-primary);}
    .fv-coord-divider{width:1px;height:40px;background:var(--border-card);margin:0 20px;}
    .fv-map-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;background:var(--accent-badge);border:1.5px solid var(--border-card);color:var(--accent);font-size:.84rem;font-weight:700;text-decoration:none;transition:all .2s;align-self:flex-start;}
    .fv-map-btn:hover{border-color:var(--accent);background:var(--accent);color:#fff;}
    .fv-img-card{border-radius:18px;overflow:hidden;border:1px solid var(--border-card);cursor:pointer;position:relative;background:var(--bg-card);}
    .fv-media-img{width:100%;max-height:420px;object-fit:contain;display:block;}
    .fv-img-hint{position:absolute;bottom:12px;right:12px;padding:5px 12px;border-radius:8px;background:rgba(0,0,0,0.4);backdrop-filter:blur(6px);color:#fff;font-size:.72rem;font-weight:600;}
    .fv-resolved-badge{position:absolute;top:12px;right:12px;padding:5px 14px;border-radius:999px;background:rgba(52,211,153,0.2);border:1px solid rgba(52,211,153,0.4);color:#34d399;font-size:.74rem;font-weight:700;}
    .fv-pdf-shell{border-radius:16px;overflow:hidden;border:1px solid var(--border-card);background:var(--bg-card);}
    .fv-pdf{width:100%;height:600px;border:none;display:block;}
    .fv-dl-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;background:var(--accent);color:#fff;font-size:.78rem;font-weight:700;text-decoration:none;}
    .fv-empty-tab{text-align:center;padding:60px 24px;color:var(--text-muted);}
    .fv-empty-tab span{font-size:3rem;display:block;margin-bottom:12px;}
    .fv-empty-tab p{font-size:.88rem;}
    .fv-not-generated{display:flex;flex-direction:column;align-items:center;gap:10px;padding:36px 24px;background:var(--bg-card);border:1px dashed var(--border-card);border-radius:16px;text-align:center;color:var(--text-muted);}
    .fv-not-generated span{font-size:2.5rem;}
    .fv-resolve-card{background:var(--bg-card);border:1px solid var(--border-card);border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:24px;}
    .fv-resolve-current{display:flex;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid var(--border-card);flex-wrap:wrap;}
    .fv-resolve-current-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);}
    .fv-resolve-field{display:flex;flex-direction:column;gap:10px;}
    .fv-resolve-field-label{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);}
    .fv-upload-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:14px;border:1.5px dashed var(--border-card);background:transparent;color:var(--text-secondary);font-size:.88rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;align-self:flex-start;}
    .fv-upload-btn:hover{border-color:var(--accent);color:var(--accent);}
    .fv-msg{font-size:.88rem;font-weight:600;padding:10px 14px;border-radius:10px;background:var(--bg-input);}
    .fv-save-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:16px 32px;border-radius:16px;background:linear-gradient(135deg,#34d399,#059669);border:none;color:#fff;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;cursor:pointer;box-shadow:0 6px 24px rgba(52,211,153,0.25);transition:all .2s;width:100%;}
    .fv-save-btn:hover:not(:disabled){opacity:.88;transform:translateY(-2px);}
    .fv-save-btn:disabled{opacity:.5;cursor:not-allowed;}
    .fv-save-spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fv-resolved-panel{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px 24px;text-align:center;}
    .fv-resolved-panel-icon{font-size:4rem;}
    .fv-resolved-panel-title{font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:800;color:#34d399;}
    .fv-resolved-panel-sub{font-size:.88rem;color:var(--text-muted);}
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
    .ap-playbtn{width:46px;height:46px;border-radius:50%;background:var(--accent);border:none;color:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px var(--accent-glow);transition:transform .15s;}
    .ap-playbtn:hover{transform:scale(1.08);}
    .ap-playbtn-pause{background:var(--text-muted);}
    .ap-scrub-wrap{flex:1;display:flex;flex-direction:column;gap:5px;}
    .ap-scrub{width:100%;accent-color:var(--accent);cursor:pointer;height:4px;}
    .ap-timestamps{display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-muted);}
    .ap-vol{display:flex;align-items:center;gap:7px;}
    .ap-vol-range{width:72px;accent-color:var(--accent);cursor:pointer;height:3px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:700px){.mc-page{padding:76px 4vw 48px;}.mc-thumb,.mc-thumb-empty{width:74px;height:74px;}.fv-meta-grid{grid-template-columns:1fr 1fr;}.fv-hero{height:200px;}.fv-body{padding:24px 16px 56px;}.fv-topbar{padding:0 14px;}.fv-topbar-center{display:none;}}
  `;

  return (
    <>
      <style>{CSS}</style>

      {selected && (
        <ComplaintDetail
          complaint={selected}
          onBack={() => setSelected(null)}
          onUpdated={() => fetchPage(pagination.currentPage)}
        />
      )}

      <nav className="mc-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin/dashboard" className="mc-logo">
            <span className="mc-logo-icon">CG</span>
            <span>CitizenGrievance</span>
          </a>
          <span className="mc-admin-tag">🏛 Admin</span>
        </div>
        <div className="mc-nav-right">
          <button className="theme-btn" onClick={() => setDark((d) => !d)}>
            {dark ? "☀️" : "🌙"}
          </button>
          {profile && (
            <div className="mc-profile-chip">
              <div className="mc-avatar">
                {(profile.name ?? profile.username ?? "A")[0].toUpperCase()}
              </div>
              <div>
                <div className="mc-chip-name">
                  {profile.name ?? profile.username}
                </div>
                <div className="mc-chip-dept">{profile.department}</div>
              </div>
            </div>
          )}
          <Link to="/admin/dashboard" className="mc-nav-btn">
            Dashboard
          </Link>
          <Link to="/admin/profile" className="mc-nav-btn">
            Profile
          </Link>
          <button
            className="mc-nav-btn danger"
            onClick={() => {
              clearAuthCookies();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="mc-page" ref={listTopRef}>
        <div className="mc-toolbar">
          <div className="mc-toolbar-title">
            Complaints <span>({pagination.total})</span>
          </div>
          <div className="mc-controls">
            <select
              className="mc-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {/* <option value="SENT">Sent</option> */}
              <option value="SENT">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SOLVED">Resolved</option>
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
            `Showing ${filtered.length} of ${pagination.total} — Page ${pagination.currentPage + 1} of ${pagination.totalPages}`}
        </div>
        {error && <div className="mc-error">{error}</div>}

        <div className="mc-list">
          {loading ? (
            Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : filtered.length === 0 ? (
            <div className="mc-empty">
              <span className="mc-empty-icon">📭</span>
              <h3>No complaints found</h3>
              <p>No complaints match the current filter.</p>
            </div>
          ) : (
            filtered.map((c, i) => {
              const st = getStatus(c.status);
              const isResolved = ["SOLVED", "RESOLVED"].includes(
                c.status?.toUpperCase(),
              );
              const needsAction = ["SENT", "PENDING"].includes(
                c.status?.toUpperCase(),
              );
              return (
                <div
                  key={c.complaintId ?? i}
                  className="mc-card"
                  onClick={() => setSelected(c)}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <ComplaintThumb b64={c.userImage} />
                  <div className="mc-card-body">
                    <div className="mc-card-top">
                      <span className="mc-card-dept">
                        {DEPT_ICONS[c.department] ?? "📋"} {c.department} ·{" "}
                        {c.district}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {needsAction && (
                          <span className="mc-action-badge">Action needed</span>
                        )}
                        {isResolved && c.isImageUploaded && (
                          <span className="mc-proof-badge">📸 Proof</span>
                        )}
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
                    </div>
                    <p className="mc-card-text">
                      {c.complaintInWords ?? c.complaintDescriptionLLM ?? "—"}
                    </p>
                    <div className="mc-card-footer">
                      {c.userName && (
                        <span className="mc-meta">👤 {c.userName}</span>
                      )}
                      {c.userPhone && (
                        <span className="mc-meta">📞 {c.userPhone}</span>
                      )}
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
              disabled={pagination.currentPage === 0}
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
                    className={`pg-btn ${p === pagination.currentPage ? "active" : ""}`}
                    onClick={() => fetchPage(p)}
                  >
                    {p + 1}
                  </button>
                ),
            )}
            <button
              className="pg-btn"
              disabled={pagination.currentPage >= pagination.totalPages - 1}
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
