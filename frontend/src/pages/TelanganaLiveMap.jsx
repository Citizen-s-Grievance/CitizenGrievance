/**
 * TelanganaLiveMap.jsx  — FIXED (dots only from real backend coordinates)
 *
 * KEY FIX: Removed generateMockComplaints() entirely.
 * Dots now only appear when the backend supplies real lat/lng.
 * In demo/offline mode, no dots are shown (correct — we have no real coords).
 *
 * DEPENDENCIES:
 *   npm install @stomp/stompjs leaflet react-leaflet
 *
 * Add globally (once):
 *   @import "leaflet/dist/leaflet.css";
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
  CircleMarker,
  useMap,
} from "react-leaflet";

const API_BASE = "http://localhost:8080";
const WS_URL = "ws://localhost:8080/ws";
const TELANGANA_GEOJSON_URL = "/telangana.geojson";

/* ─── Smooth gradient heatmap: green → yellow → red (like reference image) ─── */
/* ─── Heatmap: yellow → orange → red ─── */
function heatColor(total, maxTotal) {
  if (!total || maxTotal === 0) return "rgba(20,20,20,0.35)";
  const t = Math.min(total / maxTotal, 1);

  let r, g, b;
  if (t < 0.5) {
    // yellow → orange
    const s = t / 0.5;
    r = Math.round(255); // 255 → 255
    g = Math.round(220 - s * 100); // 220 → 120
    b = Math.round(0); // 0   → 0
  } else {
    // orange → red
    const s = (t - 0.5) / 0.5;
    r = Math.round(255 - s * 55); // 255 → 200
    g = Math.round(120 - s * 110); // 120 → 10
    b = Math.round(0); // 0   → 0
  }
  const alpha = 0.6 + t * 0.35; // 0.60 → 0.95
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Dot colour by status */
const DOT_COLORS = {
  SENT: { fill: "#22d3ee", glow: "rgba(34,211,238,0.5)" },
  IN_PROGRESS: { fill: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  SOLVED: { fill: "#4ade80", glow: "rgba(74,222,128,0.5)" },
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function TelanganaLiveMap() {
  const [statsMap, setStatsMap] = useState({});
  const [geoData, setGeoData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null);
  const [maxTotal, setMaxTotal] = useState(1);
  const [isDark, setIsDark] = useState(true);
  const [complaints, setComplaints] = useState([]); // ONLY real lat/lng from backend
  const [showDots, setShowDots] = useState(true);
  const stompRef = useRef(null);

  /* Load GeoJSON */
  useEffect(() => {
    fetch(TELANGANA_GEOJSON_URL)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  /* Apply district stats (no dot generation here) */
  const applyStats = useCallback((arr) => {
    if (!Array.isArray(arr)) return;
    const map = {};
    let mx = 1;
    arr.forEach((d) => {
      map[d.district] = d;
      if (d.total > mx) mx = d.total;
    });
    setStatsMap(map);
    setMaxTotal(mx);
    setLastUpdated(new Date());
  }, []);

  /**
   * Convert a raw complaint object from the backend into our internal shape.
   * Accepts both naming conventions the backend might use.
   */
  const toComplaint = (c) => {
    const lat = c.latitude ?? c.lat;
    const lng = c.longitude ?? c.lng ?? c.lon;
    if (lat == null || lng == null) return null; // no coords → skip
    return {
      id: c.id || `${lat}-${lng}-${Date.now()}`,
      lat: Number(lat),
      lng: Number(lng),
      status: c.status || "SENT",
      district: c.district || "",
    };
  };

  /* Fetch complaint dots — runs on mount, then every 15 seconds */
  const fetchComplaints = useCallback(() => {
    fetch(`${API_BASE}/public/complaints`)
      .then((r) => r.json())
      .then((arr) => {
        if (!Array.isArray(arr)) return;
        const valid = arr.map(toComplaint).filter(Boolean);
        setComplaints(valid);
      })
      .catch(() => {
        // Backend offline → keep existing dots, don't wipe them
      });
  }, []);

  useEffect(() => {
    fetchComplaints(); // immediate load
    const id = setInterval(fetchComplaints, 15000); // refresh every 15 s
    return () => clearInterval(id);
  }, [fetchComplaints]);

  /* REST – district stats, polled every 15 s as fallback when WS is offline */
  useEffect(() => {
    const DEMO = [
      {
        district: "Hyderabad",
        total: 42,
        sent: 18,
        inProgress: 12,
        solved: 12,
      },
      {
        district: "Rangareddy",
        total: 28,
        sent: 10,
        inProgress: 8,
        solved: 10,
      },
      { district: "Medchal", total: 19, sent: 8, inProgress: 5, solved: 6 },
      { district: "Karimnagar", total: 15, sent: 7, inProgress: 4, solved: 4 },
      {
        district: "Warangal Urban",
        total: 22,
        sent: 9,
        inProgress: 7,
        solved: 6,
      },
      { district: "Nizamabad", total: 11, sent: 5, inProgress: 3, solved: 3 },
      { district: "Nalgonda", total: 17, sent: 8, inProgress: 4, solved: 5 },
      { district: "Khammam", total: 13, sent: 6, inProgress: 3, solved: 4 },
      { district: "Mahbubnagar", total: 9, sent: 4, inProgress: 2, solved: 3 },
      { district: "Sangareddy", total: 14, sent: 6, inProgress: 4, solved: 4 },
      { district: "Siddipet", total: 8, sent: 3, inProgress: 2, solved: 3 },
      { district: "Adilabad", total: 6, sent: 3, inProgress: 2, solved: 1 },
    ];
    const load = () =>
      fetch(`${API_BASE}/public/mapStats`)
        .then((r) => r.json())
        .then(applyStats)
        .catch(() => applyStats(DEMO));
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [applyStats]);

  /* WebSocket – real-time updates */
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new WebSocket(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        /* District stat updates */
        client.subscribe("/topic/mapStats", (msg) => {
          try {
            applyStats(JSON.parse(msg.body));
          } catch (_) {}
        });

        /* Real-time complaint dots — only accepted if backend sends real lat/lng */
        client.subscribe("/topic/complaints", (msg) => {
          try {
            const raw = JSON.parse(msg.body);
            const c = toComplaint(raw);
            if (!c) return; // no coords → discard
            setComplaints((prev) => [...prev.slice(-500), c]);
          } catch (_) {}
        });

        client.publish({ destination: "/app/requestStats", body: "" });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    client.activate();
    stompRef.current = client;
    return () => client.deactivate();
  }, [applyStats]);

  /* GeoJSON style */
  const style = useCallback(
    (feature) => {
      const name =
        feature.properties?.district || feature.properties?.DISTRICT || "";
      const stats = statsMap[name];
      return {
        fillColor: heatColor(stats?.total ?? 0, maxTotal),
        fillOpacity: 0.85,
        color: isDark ? "rgba(255,255,255,0.12)" : "rgba(80,40,120,0.25)",
        weight: 1.2,
      };
    },
    [statsMap, maxTotal, isDark],
  );

  /* Feature events */
  const onEachFeature = useCallback(
    (feature, layer) => {
      const name =
        feature.properties?.district || feature.properties?.DISTRICT || "";
      const d = statsMap[name];

      layer.bindTooltip(
        `<div class="district-tip">
          <div class="tip-name">${name}</div>
          <div class="tip-row"><span>Total</span><span class="tip-val">${d?.total ?? 0}</span></div>
          <div class="tip-row"><span>Sent</span><span class="tip-val" style="color:#22d3ee">${d?.sent ?? 0}</span></div>
          <div class="tip-row"><span>In Progress</span><span class="tip-val" style="color:#f59e0b">${d?.inProgress ?? 0}</span></div>
          <div class="tip-row"><span>Solved</span><span class="tip-val" style="color:#4ade80">${d?.solved ?? 0}</span></div>
        </div>`,
        {
          sticky: true,
          className: "district-tip",
          direction: "top",
          offset: [0, -4],
        },
      );

      layer.on({
        mouseover(e) {
          e.target.setStyle({
            weight: 2.5,
            color: isDark ? "#f0abfc" : "#7c3aed",
            fillOpacity: 0.95,
          });
          e.target.bringToFront();
        },
        mouseout(e) {
          e.target.setStyle(style(feature));
        },
        click() {
          setSelected(name);
        },
      });
    },
    [style, isDark, statsMap],
  );

  /* Totals */
  const totals = Object.values(statsMap).reduce(
    (a, d) => ({
      total: a.total + (d.total || 0),
      sent: a.sent + (d.sent || 0),
      inProgress: a.inProgress + (d.inProgress || 0),
      solved: a.solved + (d.solved || 0),
    }),
    { total: 0, sent: 0, inProgress: 0, solved: 0 },
  );
  const sel = selected ? statsMap[selected] : null;

  /* Tiles */
  const tileBase = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  const tileLabels = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";

  /* Theme tokens */
  const tk = isDark
    ? {
        bg: "#050816",
        headerBg: "rgba(5,8,22,0.95)",
        headerBorder: "rgba(139,92,246,0.2)",
        sidebarBg: "#080d1f",
        cardBg: "rgba(13,17,40,0.9)",
        cardBorder: "rgba(139,92,246,0.15)",
        textPrimary: "#e2e8f0",
        textSub: "#64748b",
        textMuted: "#475569",
        textFade: "#e2e8f0",
        divider: "rgba(139,92,246,0.12)",
        barTrack: "#111827",
        mapBorderRight: "rgba(139,92,246,0.15)",
        totalAccent: "#c4b5fd",
        sentAccent: "#22d3ee",
        progAccent: "#fbbf24",
        solvedAccent: "#4ade80",
        detailHdr:
          "linear-gradient(135deg,rgba(76,29,149,0.4),rgba(30,58,138,0.4))",
        detailBorder: "rgba(139,92,246,0.2)",
        legendBg: "rgba(13,17,40,0.9)",
        legendBorder: "rgba(139,92,246,0.15)",
        noDataColor: "#1e2a4a",
        hintBg: "rgba(5,8,22,0.85)",
        hintColor: "#64748b",
        tipBg: "#080d1f",
        tipBorder: "rgba(139,92,246,0.3)",
        tipColor: "#e2e8f0",
        tipSub: "#94a3b8",
        toggleBg: "rgba(139,92,246,0.1)",
        toggleColor: "#94a3b8",
      }
    : {
        bg: "#f5f3ff",
        headerBg: "rgba(255,255,255,0.96)",
        headerBorder: "rgba(139,92,246,0.15)",
        sidebarBg: "#ede9fe",
        cardBg: "rgba(255,255,255,0.9)",
        cardBorder: "rgba(139,92,246,0.2)",
        textPrimary: "#1e1b4b",
        textSub: "#6b7280",
        textMuted: "#9ca3af",
        textFade: "rgba(5,8,22,0.85)",
        divider: "rgba(139,92,246,0.1)",
        barTrack: "#e9d5ff",
        mapBorderRight: "rgba(139,92,246,0.15)",
        totalAccent: "#7c3aed",
        sentAccent: "#0891b2",
        progAccent: "#d97706",
        solvedAccent: "#059669",
        detailHdr:
          "linear-gradient(135deg,rgba(237,233,254,1),rgba(219,234,254,1))",
        detailBorder: "rgba(139,92,246,0.2)",
        legendBg: "rgba(255,255,255,0.9)",
        legendBorder: "rgba(139,92,246,0.15)",
        noDataColor: "#a78bfa",
        hintBg: "rgba(245,243,255,0.9)",
        hintColor: "#6b7280",
        tipBg: "#fff",
        tipBorder: "rgba(139,92,246,0.2)",
        tipColor: "#1e1b4b",
        tipSub: "#6b7280",
        toggleBg: "rgba(139,92,246,0.1)",
        toggleColor: "#4c1d95",
      };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .tlm-root {
          font-family: 'Outfit', sans-serif;
          background: ${tk.bg};
          min-height: 100vh;
          color: ${tk.textPrimary};
          display: flex;
          flex-direction: column;
          transition: background 0.35s, color 0.35s;
        }

        .tlm-header {
          padding: 0 28px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: ${tk.headerBg};
          border-bottom: 1px solid ${tk.headerBorder};
          position: sticky; top:0; z-index:9999;
          backdrop-filter: blur(20px);
          transition: background 0.35s, border-color 0.35s;
          gap: 16px;
        }
        .tlm-header-left  { display:flex; align-items:center; gap:16px; }
        .tlm-site-logo {
          background: #2a52e8; color:#fff; width:38px; height:38px;
          border-radius:11px; display:flex; align-items:center; justify-content:center;
          font-size:1rem; font-weight:800; flex-shrink:0;
          font-family:'Outfit',sans-serif; letter-spacing:-0.5px;
          box-shadow:0 0 18px rgba(42,82,232,0.4);
        }
        .tlm-logo-divider { width:1px; height:32px; background:${tk.headerBorder}; }
        .tlm-map-icon {
          width:38px; height:38px;
          background:linear-gradient(135deg,#7c3aed,#2563eb);
          border-radius:10px; display:flex; align-items:center; justify-content:center;
          font-size:18px; flex-shrink:0;
          box-shadow:0 0 16px rgba(124,58,237,0.35);
        }
        .tlm-title {
          font-size:20px; font-weight:900; letter-spacing:-0.5px;
          background:linear-gradient(90deg,#a855f7 0%,#ec4899 45%,#f97316 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text; line-height:1; margin-bottom:2px;
        }
        .tlm-subtitle {
          font-size:10.5px; color:${tk.textSub}; letter-spacing:1.4px;
          text-transform:uppercase; font-weight:500;
        }
        .tlm-header-right { display:flex; align-items:center; gap:10px; }

        .tlm-dot-toggle, .tlm-toggle {
          display:flex; align-items:center; gap:8px;
          background:${tk.toggleBg}; border:1px solid ${tk.cardBorder};
          border-radius:999px; padding:6px 14px; cursor:pointer;
          font-size:12.5px; font-weight:600; color:${tk.toggleColor};
          font-family:'Outfit',sans-serif; transition:all 0.2s; user-select:none;
        }
        .tlm-dot-toggle:hover, .tlm-toggle:hover { border-color:#a855f7; color:#a855f7; }

        .tlm-badge {
          display:flex; align-items:center; gap:6px; padding:6px 14px;
          border-radius:999px; font-size:11.5px; font-weight:700; letter-spacing:0.8px;
          font-family:'JetBrains Mono',monospace;
        }
        .tlm-badge.live    { background:${isDark ? "#052e16" : "#dcfce7"}; color:${isDark ? "#4ade80" : "#16a34a"}; border:1px solid ${isDark ? "#166534" : "#86efac"}; }
        .tlm-badge.offline { background:${isDark ? "#2d1515" : "#fee2e2"}; color:${isDark ? "#f87171" : "#dc2626"}; border:1px solid ${isDark ? "#7f1d1d" : "#fca5a5"}; }
        .tlm-badge .dot { width:8px; height:8px; border-radius:50%; }
        .tlm-badge.live .dot    { background:${isDark ? "#4ade80" : "#16a34a"}; box-shadow:0 0 8px ${isDark ? "#4ade80" : "#16a34a"}; animation:pulse 1.4s infinite; }
        .tlm-badge.offline .dot { background:${isDark ? "#f87171" : "#dc2626"}; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .tlm-body {
          flex:1; display:grid;
          grid-template-columns:1fr 340px;
          height:calc(100vh - 66px);
        }
        @media(max-width:900px){
          .tlm-body { grid-template-columns:1fr; grid-template-rows:55vh auto; }
        }

        .tlm-map-wrap { position:relative; overflow:hidden; border-right:1px solid ${tk.mapBorderRight}; }
        .tlm-map-wrap .leaflet-container { width:100%; height:100%; background:${tk.bg}; }

        .tlm-sidebar {
          background:${tk.sidebarBg}; overflow-y:auto; padding:20px 18px;
          display:flex; flex-direction:column; gap:18px;
          transition:background 0.35s;
        }

        .tlm-cards { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .tlm-card {
          background:${tk.cardBg}; border-radius:14px; padding:14px 16px;
          border:1px solid ${tk.cardBorder}; position:relative; overflow:hidden;
          transition:border-color 0.2s,transform 0.2s; backdrop-filter:blur(10px);
        }
        .tlm-card:hover { transform:translateY(-2px); border-color:var(--accent); }
        .tlm-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2.5px;
          background:var(--accent); border-radius:2px 2px 0 0;
        }
        .tlm-card-label { font-size:10px; color:${tk.textSub}; text-transform:uppercase; letter-spacing:1.3px; margin-bottom:6px; font-weight:600; }
        .tlm-card-val   { font-size:30px; font-weight:800; font-family:'JetBrains Mono',monospace; color:var(--accent); line-height:1; }
        .tlm-card-sub   { font-size:11px; color:${tk.textMuted}; margin-top:5px; font-weight:500; }
        .tlm-card.total  { --accent:${tk.totalAccent}; grid-column:1/-1; }
        .tlm-card.sent   { --accent:${tk.sentAccent}; }
        .tlm-card.prog   { --accent:${tk.progAccent}; }
        .tlm-card.solved { --accent:${tk.solvedAccent}; }

        .tlm-detail {
          background:${tk.cardBg}; border-radius:14px; border:1px solid ${tk.detailBorder};
          overflow:hidden; backdrop-filter:blur(10px);
        }
        .tlm-detail-header {
          padding:14px 18px; background:${tk.detailHdr};
          border-bottom:1px solid ${tk.detailBorder};
          display:flex; align-items:center; gap:10px;
        }
        .tlm-detail-name { font-size:15px; font-weight:700; color:${tk.textPrimary}; }
        .tlm-detail-hint { font-size:11px; color:${tk.textSub}; font-weight:500; }
        .tlm-detail-body { padding:16px 18px; }
        .tlm-detail-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:9px 0; border-bottom:1px solid ${tk.divider};
          font-size:13px; font-weight:500;
        }
        .tlm-detail-row:last-child { border-bottom:none; }
        .tlm-detail-row .label { display:flex; align-items:center; gap:8px; color:${tk.textSub}; }
        .tlm-detail-row .dot2  { width:9px; height:9px; border-radius:50%; }
        .tlm-detail-row .val   { font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:600; }
        .tlm-detail-bar { margin-top:14px; }
        .tlm-bar-label  { font-size:10px; color:${tk.textMuted}; margin-bottom:7px; text-transform:uppercase; letter-spacing:1.2px; font-weight:600; }
        .tlm-bar-track  { background:${tk.barTrack}; border-radius:6px; height:10px; overflow:hidden; display:flex; }
        .tlm-bar-seg    { height:100%; transition:width 0.6s ease; }

        .tlm-legend {
          background:${tk.legendBg}; border-radius:14px; border:1px solid ${tk.legendBorder};
          padding:16px 18px; backdrop-filter:blur(10px);
        }
        .tlm-legend-title  { font-size:10px; color:${tk.textSub}; text-transform:uppercase; letter-spacing:1.3px; margin-bottom:12px; font-weight:700; }
        .tlm-legend-row    { display:flex; align-items:center; gap:10px; font-size:12.5px; color:${tk.textSub}; margin-bottom:8px; font-weight:500; }
        .tlm-legend-swatch { width:24px; height:14px; border-radius:4px; flex-shrink:0; }
        .tlm-legend-status { display:flex; align-items:center; gap:9px; font-size:12.5px; margin-bottom:7px; color:${tk.textSub}; font-weight:500; }
        .tlm-legend-dot    { width:11px; height:11px; border-radius:50%; flex-shrink:0; box-shadow:0 0 6px currentColor; }
        .tlm-divider       { border:none; border-top:1px solid ${tk.divider}; margin:12px 0; }

        .tlm-ts { font-size:10.5px; color:${tk.textFade}; font-family:'JetBrains Mono',monospace; text-align:center; padding-bottom:4px; }

        .tlm-hint {
          position:absolute; bottom:20px; left:20px; z-index:800;
          background:${tk.hintBg}; border:1px solid ${tk.cardBorder};
          border-radius:8px; padding:8px 14px;
          font-size:12px; color:${tk.hintColor}; pointer-events:none;
          backdrop-filter:blur(8px); font-weight:500;
        }

        /* No-dots notice shown in sidebar when backend is offline */
        .tlm-no-dots-notice {
          background:${tk.cardBg}; border:1px solid ${tk.cardBorder};
          border-radius:12px; padding:12px 16px;
          font-size:12px; color:${tk.textMuted}; text-align:center;
          line-height:1.5; font-weight:500;
        }

        .district-tip {
          background:${tk.tipBg}; border:1px solid ${tk.tipBorder};
          color:${tk.tipColor}; font-family:'Outfit',sans-serif;
          font-size:13px; padding:10px 14px; border-radius:10px;
          box-shadow:0 8px 24px rgba(0,0,0,0.2);
        }
        .district-tip .tip-name { font-weight:800; margin-bottom:5px; font-size:14px; }
        .district-tip .tip-row  { display:flex; justify-content:space-between; gap:22px; font-size:12px; color:${tk.tipSub}; margin-top:3px; }
        .district-tip .tip-val  { font-family:'JetBrains Mono',monospace; color:${tk.tipColor}; font-weight:600; }

        .leaflet-interactive:focus      { outline:none !important; }
        path.leaflet-interactive:focus  { outline:none !important; box-shadow:none !important; }

        .tlm-sidebar::-webkit-scrollbar       { width:4px; }
        .tlm-sidebar::-webkit-scrollbar-track { background:transparent; }
        .tlm-sidebar::-webkit-scrollbar-thumb { background:${isDark ? "#1e293b" : "#ddd6fe"}; border-radius:2px; }

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
      `}</style>

      <div className="tlm-root">
        {/* ════ HEADER ════ */}
        <header className="tlm-header">
          <div className="tlm-header-left">
            {/* <div className="tlm-site-logo">CG</div> */}
            <a className="nav-logo" href="/">
              <span className="tlm-site-logo">CG</span>
              <span className="nav-logo-text">CitizenGrievance</span>
            </a>
            <div className="tlm-logo-divider" />
            <div className="tlm-map-icon">🗺️</div>
            <div>
              <div className="tlm-title">Telangana Grievance Live Map</div>
              <div className="tlm-subtitle">
                Real-time complaint tracker · All districts
              </div>
            </div>
          </div>

          <div className="tlm-header-right">
            <button
              className="tlm-dot-toggle"
              onClick={() => setShowDots((v) => !v)}
            >
              {showDots ? "🔵 Hide Dots" : "🔵 Show Dots"}
            </button>
            <button className="tlm-toggle" onClick={() => setIsDark((v) => !v)}>
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <div className={`tlm-badge ${connected ? "live" : "offline"}`}>
              <span className="dot" />
              {connected ? "LIVE" : "DEMO"}
            </div>
          </div>
        </header>

        {/* ════ BODY ════ */}
        <div className="tlm-body">
          {/* ── MAP ── */}
          <div className="tlm-map-wrap">
            {geoData ? (
              <MapContainer
                key={isDark ? "dark" : "light"}
                center={[17.8, 79.4]}
                zoom={7}
                minZoom={6}
                maxZoom={13}
                maxBounds={[
                  [15.0, 76.0],
                  [20.5, 82.5],
                ]}
                maxBoundsViscosity={1.0}
                zoomControl={false}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom
                doubleClickZoom
              >
                <ZoomControl position="topright" />
                <TileLayer
                  url={tileBase}
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  maxZoom={18}
                />
                <TileLayer
                  url={tileLabels}
                  attribution=""
                  maxZoom={18}
                  pane="overlayPane"
                />

                {/* District choropleth */}
                <GeoJSON
                  key={JSON.stringify(statsMap) + isDark}
                  data={geoData}
                  style={style}
                  onEachFeature={onEachFeature}
                />

                {/*
                  Complaint dots — ONLY rendered from real backend coordinates.
                  Each complaint must have genuine lat/lng supplied by the server.
                  The toComplaint() helper above rejects any object missing coordinates.
                */}
                {showDots &&
                  complaints.map((c) => {
                    const col = DOT_COLORS[c.status] || DOT_COLORS.SENT;
                    return (
                      <CircleMarker
                        key={c.id}
                        center={[c.lat, c.lng]}
                        radius={4.5}
                        pathOptions={{
                          fillColor: col.fill,
                          fillOpacity: 0.88,
                          color: col.fill,
                          weight: 1,
                          opacity: 0.6,
                        }}
                      />
                    );
                  })}
              </MapContainer>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: tk.noDataColor,
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Loading map…
              </div>
            )}
            <div className="tlm-hint">
              🖱 Click a district for details · Scroll to zoom
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="tlm-sidebar">
            {/* Stat cards */}
            <div className="tlm-cards">
              <div className="tlm-card total">
                <div className="tlm-card-label">Total Complaints</div>
                <div className="tlm-card-val">
                  {totals.total.toLocaleString()}
                </div>
                <div className="tlm-card-sub">All 33 districts</div>
              </div>
              <div className="tlm-card sent">
                <div className="tlm-card-label">Sent</div>
                <div className="tlm-card-val">
                  {totals.sent.toLocaleString()}
                </div>
                <div className="tlm-card-sub">Awaiting action</div>
              </div>
              <div className="tlm-card prog">
                <div className="tlm-card-label">In Progress</div>
                <div className="tlm-card-val">
                  {totals.inProgress.toLocaleString()}
                </div>
                <div className="tlm-card-sub">Being processed</div>
              </div>
              <div className="tlm-card solved">
                <div className="tlm-card-label">Solved</div>
                <div className="tlm-card-val">
                  {totals.solved.toLocaleString()}
                </div>
                <div className="tlm-card-sub">Resolved ✓</div>
              </div>
            </div>

            {/* Offline dot notice */}
            {!connected && showDots && (
              <div className="tlm-no-dots-notice">
                📍 Complaint dots appear once the backend is live —<br />
                each dot uses the exact GPS coordinates from the complaint
                record.
              </div>
            )}

            {/* District detail */}
            <div className="tlm-detail">
              <div className="tlm-detail-header">
                <span style={{ fontSize: 20 }}>📍</span>
                <div>
                  <div className="tlm-detail-name">
                    {selected || "Select a district"}
                  </div>
                  <div className="tlm-detail-hint">
                    {selected ? "District breakdown" : "Click on the map"}
                  </div>
                </div>
              </div>
              {sel ? (
                <div className="tlm-detail-body">
                  <div className="tlm-detail-row">
                    <span className="label">
                      <span
                        className="dot2"
                        style={{ background: "#a855f7" }}
                      />
                      Total
                    </span>
                    <span className="val" style={{ color: tk.totalAccent }}>
                      {sel.total}
                    </span>
                  </div>
                  <div className="tlm-detail-row">
                    <span className="label">
                      <span
                        className="dot2"
                        style={{ background: "#22d3ee" }}
                      />
                      Sent
                    </span>
                    <span className="val" style={{ color: tk.sentAccent }}>
                      {sel.sent}
                    </span>
                  </div>
                  <div className="tlm-detail-row">
                    <span className="label">
                      <span
                        className="dot2"
                        style={{ background: "#f59e0b" }}
                      />
                      In Progress
                    </span>
                    <span className="val" style={{ color: tk.progAccent }}>
                      {sel.inProgress}
                    </span>
                  </div>
                  <div className="tlm-detail-row">
                    <span className="label">
                      <span
                        className="dot2"
                        style={{ background: "#4ade80" }}
                      />
                      Solved
                    </span>
                    <span className="val" style={{ color: tk.solvedAccent }}>
                      {sel.solved}
                    </span>
                  </div>
                  {sel.total > 0 && (
                    <div className="tlm-detail-bar">
                      <div className="tlm-bar-label">Distribution</div>
                      <div className="tlm-bar-track">
                        <div
                          className="tlm-bar-seg"
                          style={{
                            width: `${(sel.sent / sel.total) * 100}%`,
                            background: "#22d3ee",
                          }}
                        />
                        <div
                          className="tlm-bar-seg"
                          style={{
                            width: `${(sel.inProgress / sel.total) * 100}%`,
                            background: "#f59e0b",
                          }}
                        />
                        <div
                          className="tlm-bar-seg"
                          style={{
                            width: `${(sel.solved / sel.total) * 100}%`,
                            background: "#4ade80",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: "24px 18px",
                    color: tk.noDataColor,
                    fontSize: "13px",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  ← Hover &amp; click any district on the map
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="tlm-legend">
              <div className="tlm-legend-title">
                Heat Map — Complaint Volume
              </div>

              {/* Gradient bar: green → yellow → red */}
              <div
                style={{
                  width: "100%",
                  height: 18,
                  borderRadius: 8,
                  background:
                    "linear-gradient(to right, rgba(255,220,0,0.75), rgba(255,120,0,0.88), rgba(200,10,0,0.95))",
                  marginBottom: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10.5,
                  color: tk.textSub,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                <span>0</span>
                <span style={{ color: tk.textMuted }}>complaints</span>
                <span>{maxTotal}+</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: tk.textMuted,
                  marginBottom: 4,
                }}
              >
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>

              <hr className="tlm-divider" />
              <div className="tlm-legend-title">Complaint Dots</div>
              {[
                { color: "#22d3ee", label: "Sent" },
                { color: "#f59e0b", label: "In Progress" },
                { color: "#4ade80", label: "Solved" },
              ].map((s) => (
                <div className="tlm-legend-status" key={s.label}>
                  <span
                    className="tlm-legend-dot"
                    style={{ background: s.color, color: s.color }}
                  />
                  {s.label}
                </div>
              ))}
            </div>

            {lastUpdated && (
              <div className="tlm-ts">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
