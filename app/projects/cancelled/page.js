"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, ArrowUpRight, Briefcase, TrendingUp, Clock,
  CheckCircle2, Circle, AlertCircle, Activity, ChevronRight,
  ArrowLeft, Building2, Mail, Phone, Hash,
  DollarSign, Target, CalendarDays, X, Flag, Layers, Sparkles
} from "lucide-react";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = "http://localhost:8080/api/project";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const formatCurrency = (amount, currency = "INR") => {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(parseFloat(amount));
};
const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / 86400000);
};

// ─── Status / Priority ────────────────────────────────────────────────────────
const STATUS_CFG = {
  planning:    { label: "Planning",    icon: Circle,       accent: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  in_progress: { label: "In Progress", icon: Activity,     accent: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  completed:   { label: "Completed",   icon: CheckCircle2, accent: "#10b981", bg: "rgba(16,185,129,0.12)" },
  on_hold:     { label: "On Hold",     icon: AlertCircle,  accent: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  cancelled:   { label: "Cancelled",   icon: X,            accent: "#f87171", bg: "rgba(248,113,113,0.12)" },
};
const PRIORITY_CFG = {
  low:      { label: "Low",      color: "#94a3b8", bar: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  medium:   { label: "Medium",   color: "#60a5fa", bar: "#3b82f6", bg: "rgba(96,165,250,0.12)" },
  high:     { label: "High",     color: "#f97316", bar: "#f97316", bg: "rgba(249,115,22,0.12)" },
  critical: { label: "Critical", color: "#ef4444", bar: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};
const getSCfg = (s) => STATUS_CFG[s]    || STATUS_CFG.planning;
const getPCfg = (p) => PRIORITY_CFG[p] || PRIORITY_CFG.medium;

// ─── CSS — improved light mode contrast & modern UI ────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ══════════════════════════════════════════════════════
   Light Mode (default) — crisp white background, soft shadows
   Dark Mode (html.dark) — deep slate with vibrant accents
══════════════════════════════════════════════════════ */

.cp-wrap {
  font-family: 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background: var(--bg-page);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background 0.2s ease, color 0.2s ease;
}

/* Light Mode Variables (default) */
.cp-wrap {
  --bg-page: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --input-bg: #ffffff;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -6px rgba(0,0,0,0.08);
  --card-hover-shadow: 0 12px 32px -12px rgba(0,0,0,0.12);
  --ring-color: rgba(249,115,22,0.2);
}

/* Dark Mode Variables */
html.dark .cp-wrap {
  --bg-page: #0a0c10;
  --bg-secondary: #11141c;
  --bg-tertiary: #1a1f2a;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #1e293b;
  --input-bg: #1e293b;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 8px 24px -6px rgba(0,0,0,0.4);
  --card-hover-shadow: 0 16px 40px -12px rgba(0,0,0,0.5);
  --ring-color: rgba(249,115,22,0.3);
}

/* ── Surface cards ── */
.cp-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.cp-card2 {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 18px;
}

/* Project card with refined hover */
.cp-pcard {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
}
.cp-pcard::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 0%, transparent 70%, rgba(249,115,22,0.2) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}
.cp-pcard:hover {
  border-color: rgba(249,115,22,0.3);
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-3px);
}
.cp-pcard:hover::before {
  opacity: 1;
}
.cp-pcard:hover .cp-ctitle { color: #f97316 !important; }

/* ── Topbar ── */
.cp-topbar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 30;
  backdrop-filter: blur(8px);
  background: var(--bg-secondary);
}

/* ── Progress bars ── */
.cp-prog    { height: 8px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden; }
.cp-prog-sm { height: 5px; background: var(--bg-tertiary); border-radius: 999px; overflow: hidden; }
.cp-prog-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(95deg, #f97316 0%, #fdba74 100%);
  transition: width 0.8s cubic-bezier(0.22, 0.97, 0.36, 1);
}

/* ── Inputs & Controls ── */
.cp-input {
  background: var(--input-bg) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 14px; padding: 10px 14px 10px 40px;
  font-size: 14px; outline: none; width: 100%;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}
.cp-input:focus {
  border-color: #f97316 !important;
  box-shadow: 0 0 0 3px var(--ring-color) !important;
}
.cp-select {
  background: var(--input-bg) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 14px; padding: 10px 32px 10px 14px;
  font-size: 14px; outline: none; appearance: none; cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}
.cp-select:focus { border-color: #f97316 !important; box-shadow: 0 0 0 3px var(--ring-color) !important; }

/* ── Badges & Chips ── */
.cp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 40px;
  font-size: 12px; font-weight: 600;
  border: none;
}
.cp-chip {
  background: var(--bg-tertiary);
  color: var(--text-secondary) !important;
  border-radius: 40px; padding: 2px 10px;
  font-size: 11px; font-weight: 500;
}
.cp-ibox {
  width: 40px; height: 40px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: var(--bg-tertiary);
  transition: transform 0.2s;
}
.cp-av {
  background: linear-gradient(135deg, #f97316 0%, #fdba74 100%);
  color: white !important;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0;
}
html.dark .cp-av {
  background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%);
}
.cp-divider { border-top: 1px solid var(--border-color); }

/* ── Buttons ── */
.cp-bbk {
  display: flex; align-items: center; gap: 8px;
  color: var(--text-secondary) !important; background: none; border: none;
  cursor: pointer; font-size: 14px; font-weight: 500; padding: 0;
  font-family: 'Inter', sans-serif; transition: color 0.2s;
}
.cp-bbk:hover { color: #f97316 !important; }
.cp-bbk .cp-bki {
  width: 32px; height: 32px; border-radius: 10px;
  border: 1px solid var(--border-color); background: var(--bg-tertiary);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.cp-bbk:hover .cp-bki { border-color: #f97316; background: rgba(249,115,22,0.1); }
.cp-bclr {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 14px;
  border: 1px solid var(--border-color); background: var(--bg-tertiary);
  color: var(--text-secondary) !important; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
}
.cp-bclr:hover { border-color: #f97316; color: #f97316 !important; background: rgba(249,115,22,0.08); }

/* ── Links ── */
.cp-plink {
  color: var(--text-secondary) !important; text-decoration: none;
  font-size: 12px; display: flex; align-items: center; gap: 4px;
  transition: color 0.2s;
}
.cp-plink:hover { color: #f97316 !important; }

/* ── Typography (improved hierarchy) ── */
.cp-T    { color: var(--text-primary) !important; font-weight: 600; }
.cp-T2   { color: var(--text-primary) !important; }
.cp-T3   { color: var(--text-secondary) !important; font-size: 13px; }
.cp-T4   { color: var(--text-muted) !important; font-size: 12px; }
.cp-Th2  { color: var(--text-primary) !important; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 24px; line-height: 1.3; letter-spacing: -0.02em; }
.cp-Th3  { color: var(--text-primary) !important; font-weight: 600; font-size: 15px; }
.cp-Tlbl { color: var(--text-muted) !important; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.cp-Torg { color: #f97316 !important; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }
.cp-Tmono{ font-family: 'JetBrains Mono', monospace; color: var(--text-muted) !important; font-size: 11px; background: var(--bg-tertiary); padding: 2px 6px; border-radius: 6px; }
.cp-Thero{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: var(--text-primary) !important; letter-spacing: -0.02em; }

/* ── Skeleton ── */
.cp-skel {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%; border-radius: 10px;
  animation: cpShimmer 1.5s infinite;
}
@keyframes cpShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Grids ── */
.cp-gcards  { display: grid; grid-template-columns: 1fr; gap: 20px; }
.cp-g3      { display: grid; grid-template-columns: 1fr; gap: 12px; }
.cp-gdetail { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media(min-width: 640px)  {
  .cp-gcards { grid-template-columns: repeat(2, 1fr); }
  .cp-g3     { grid-template-columns: repeat(2, 1fr); }
}
@media(min-width: 1024px) {
  .cp-gcards  { grid-template-columns: repeat(3, 1fr); }
  .cp-g3      { grid-template-columns: repeat(3, 1fr); }
  .cp-gdetail { grid-template-columns: 2fr 1fr; }
}

/* ── Calendar styles ── */
.cp-cday {
  text-align: center; font-size: 12px; padding: 6px 2px;
  border-radius: 40px; cursor: default;
  color: var(--text-primary) !important; transition: all 0.12s;
  font-weight: 500;
}
.cp-cday:not(.cp-cs):not(.cp-ce):not(.cp-ca):not(.cp-cr):hover { background: var(--bg-tertiary); }
.cp-cs { background: #f97316 !important; color: white !important; font-weight: 700; }
.cp-ce { background: #10b981 !important; color: white !important; font-weight: 700; }
.cp-ca { background: #a855f7 !important; color: white !important; font-weight: 700; }
.cp-cr { background: rgba(249,115,22,0.15) !important; color: #f97316 !important; }
.cp-cbtn {
  width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border-color);
  background: var(--bg-tertiary); cursor: pointer; font-size: 16px;
  color: var(--text-secondary) !important;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.cp-cbtn:hover { background: var(--bg-secondary); border-color: #f97316; color: #f97316 !important; }

/* ── Animations ── */
.cp-fade { animation: cpFade 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
.cp-cent { animation: cpCent 0.4s ease-out both; }
@keyframes cpFade { from{ opacity: 0; transform: translateY(12px); } to{ opacity: 1; transform: translateY(0); } }
@keyframes cpCent { from{ opacity: 0; transform: scale(0.96) translateY(8px); } to{ opacity: 1; transform: scale(1) translateY(0); } }
`;

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ startDate, endDate, actualEndDate }) {
  const [cur, setCur] = useState(() => {
    const d = startDate ? new Date(startDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const yr = cur.getFullYear(), mo = cur.getMonth();
  const firstDay    = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const norm = (v) => {
    if (!v) return null;
    const x = new Date(v);
    return new Date(x.getFullYear(), x.getMonth(), x.getDate());
  };
  const nS = norm(startDate), nE = norm(endDate), nA = norm(actualEndDate);
  const cls = (day) => {
    const t = new Date(yr, mo, day).getTime();
    if (nS && t === nS.getTime()) return "cp-cs";
    if (nA && t === nA.getTime()) return "cp-ca";
    if (nE && t === nE.getTime()) return "cp-ce";
    if (nS && nE && t > nS.getTime() && t < nE.getTime()) return "cp-cr";
    return "";
  };
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="cp-card2">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 16 }}>
        <button className="cp-cbtn" onClick={() => setCur(new Date(yr, mo-1, 1))}>‹</button>
        <p className="cp-T" style={{ fontSize: 15 }}>{MN[mo]} {yr}</p>
        <button className="cp-cbtn" onClick={() => setCur(new Date(yr, mo+1, 1))}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign:"center", fontSize: 10, fontWeight: 700, color:"var(--text-muted)", padding:"4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap: 4 }}>
        {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_,i) => (
          <div key={i} className={`cp-cday ${cls(i+1)}`}>{i+1}</div>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop:"1px solid var(--border-color)", display:"flex", flexWrap:"wrap", gap: 12 }}>
        {nS && <span style={{ display:"flex", alignItems:"center", gap: 4, fontSize: 10, color:"var(--text-secondary)" }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#f97316", display:"inline-block" }}/>Start</span>}
        {nE && <span style={{ display:"flex", alignItems:"center", gap: 4, fontSize: 10, color:"var(--text-secondary)" }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#10b981", display:"inline-block" }}/>Planned End</span>}
        {nA && <span style={{ display:"flex", alignItems:"center", gap: 4, fontSize: 10, color:"var(--text-secondary)" }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#a855f7", display:"inline-block" }}/>Actual End</span>}
      </div>
    </div>
  );
}

// ─── InfoCard ─────────────────────────────────────────────────────────────────
function InfoCard({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="cp-card2" style={{ transition: "transform 0.15s", cursor: "default" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap: 14 }}>
        <div className="cp-ibox">
          <Icon size={18} style={{ color: "#f97316" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="cp-Tlbl">{label}</p>
          <p className="cp-T" style={{ fontSize: 15, marginTop: 4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
          {sub && <p className="cp-T4" style={{ marginTop: 3 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── PersonCard ───────────────────────────────────────────────────────────────
function PersonCard({ label, person }) {
  const initial = person ? `${person.first_name?.[0] || ""}${person.last_name?.[0] || ""}` : "?";
  return (
    <div className="cp-card2">
      <p className="cp-Tlbl" style={{ marginBottom: 12 }}>{label}</p>
      <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
        <div className="cp-av" style={{ width: 42, height: 42, borderRadius: "50%", fontSize: 15, fontWeight: 600 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="cp-T" style={{ fontSize: 14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {person ? `${person.first_name} ${person.last_name}` : "—"}
          </p>
          {person?.email && <p className="cp-T4" style={{ marginTop: 2, overflow:"hidden", textOverflow:"ellipsis" }}>{person.email}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack }) {
  const sc = getSCfg(project.status);
  const pc = getPCfg(project.priority);
  const StatusIcon = sc.icon;
  const progress = parseFloat(project.progress_percentage) || 0;
  const daysLeft = getDaysRemaining(project.end_date);
  const totalDays = project.start_date && project.end_date
    ? Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / 86400000) : null;

  return (
    <div className="cp-fade">
      {/* Topbar */}
      <div className="cp-topbar">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap: 12, padding:"12px 0", flexWrap:"wrap" }}>
            <button className="cp-bbk" onClick={onBack}>
              <div className="cp-bki"><ArrowLeft size={14} /></div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Back to Projects</span>
            </button>
            <ChevronRight size={12} style={{ color:"var(--text-muted)" }} />
            <span className="cp-Tmono">{project.project_code}</span>
            <span className="cp-T2" style={{ fontSize: 14, overflow:"hidden", textOverflow:"ellipsis", maxWidth: 260, fontWeight: 500 }}>
              {project.name}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <span className="cp-badge" style={{ color: sc.accent, background: sc.bg }}>
                <span style={{ width: 6, height: 6, borderRadius:"50%", background: sc.accent, display:"inline-block" }} />
                {sc.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 56px" }}>
        {/* Hero Section */}
        <div className="cp-card" style={{ padding: 28, marginBottom: 28, borderRadius: 24 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap: 20, justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: pc.color, display:"flex", alignItems:"center", gap: 5, background: pc.bg, padding: "3px 10px", borderRadius: 40 }}>
                  <Flag size={11}/> {pc.label} Priority
                </span>
                <span style={{ color:"var(--border-color)" }}>·</span>
                <span className="cp-T3" style={{ fontWeight: 500 }}>{project.project_type}</span>
              </div>
              <h2 className="cp-Th2" style={{ fontSize: 28, marginBottom: 8 }}>{project.name}</h2>
              {project.description && <p className="cp-T3" style={{ marginTop: 6, lineHeight: 1.6, maxWidth: 640 }}>{project.description}</p>}
            </div>
            <div style={{ textAlign:"right", flexShrink: 0, background: "linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(249,115,22,0.02) 100%)", padding: "16px 24px", borderRadius: 20 }}>
              <p className="cp-Tlbl" style={{ marginBottom: 6 }}>Budget</p>
              <p className="cp-Torg" style={{ fontSize: 28 }}>{formatCurrency(project.budget, project.currency)}</p>
              <p className="cp-T4" style={{ marginTop: 4 }}>Spent: {formatCurrency(project.actual_cost, project.currency)}</p>
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop:"1px solid var(--border-color)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 10 }}>
              <p className="cp-Tlbl">Overall Progress</p>
              <span className="cp-Torg" style={{ fontSize: 22, fontWeight: 700 }}>{progress.toFixed(0)}%</span>
            </div>
            <div className="cp-prog">
              <div className="cp-prog-fill" style={{ width:`${progress}%` }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop: 8 }}>
              <p className="cp-T4">{formatDate(project.start_date)}</p>
              {daysLeft !== null && (
                <p style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 40, background: daysLeft < 0 ? "rgba(239,68,68,0.1)" : daysLeft < 7 ? "rgba(245,158,11,0.1)" : "transparent", color: daysLeft < 0 ? "#ef4444" : daysLeft < 7 ? "#f59e0b" : "var(--text-secondary)" }}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d remaining`}
                </p>
              )}
              <p className="cp-T4">{formatDate(project.end_date)}</p>
            </div>
          </div>
        </div>

        {/* 2-col layout */}
        <div className="cp-gdetail">
          {/* Left Column */}
          <div style={{ display:"flex", flexDirection:"column", gap: 24 }}>
            <div className="cp-g3">
              <InfoCard icon={CalendarDays} label="Start Date"   value={formatDate(project.start_date)}      sub="Project kickoff" />
              <InfoCard icon={Target}       label="Planned End"  value={formatDate(project.end_date)}        sub={totalDays ? `${totalDays} day project` : undefined} />
              <InfoCard icon={CheckCircle2} label="Actual End"   value={formatDate(project.actual_end_date)} sub="Completion date" />
              <InfoCard icon={DollarSign}   label="Budget"       value={formatCurrency(project.budget, project.currency)} sub={project.currency} />
              <InfoCard icon={TrendingUp}   label="Actual Cost"  value={formatCurrency(project.actual_cost, project.currency)} sub="Spent so far" />
              <InfoCard icon={Layers}       label="Project Type" value={project.project_type || "—"}         sub="Category" />
            </div>

            {/* Timeline */}
            <div className="cp-card" style={{ padding: 24 }}>
              <h3 className="cp-Th3" style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 20 }}>
                <Clock size={16} style={{ color:"#f97316" }}/> Project Timeline
              </h3>
              {[
                { label:"Project Created",  date: project.created_at,       color:"var(--text-muted)", done: true },
                { label:"Start Date",       date: project.start_date,       color:"#f97316",    done: project.start_date && new Date(project.start_date) <= new Date() },
                { label:"Planned End Date", date: project.end_date,         color:"#10b981",    done: project.end_date && new Date(project.end_date) <= new Date() },
                project.actual_end_date && { label:"Actual End Date", date: project.actual_end_date, color:"#a855f7", done: true },
              ].filter(Boolean).map((item, idx, arr) => (
                <div key={idx} style={{ display:"flex", gap: 16, marginBottom: idx < arr.length-1 ? 16 : 0 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                    <div style={{ width: 12, height: 12, borderRadius:"50%", marginTop: 2,
                      background: item.done ? item.color : "transparent",
                      border: item.done ? "none" : `2px solid var(--border-color)` }} />
                    {idx < arr.length-1 && <div style={{ width: 1, flex: 1, background:"var(--border-color)", marginTop: 6 }} />}
                  </div>
                  <div style={{ marginBottom: idx < arr.length-1 ? 4 : 0 }}>
                    <p className="cp-T" style={{ fontSize: 13, opacity: item.done ? 1 : 0.5 }}>{item.label}</p>
                    <p className="cp-T4" style={{ marginTop: 2 }}>{formatDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Client */}
            {project.client && (
              <div className="cp-card" style={{ padding: 24 }}>
                <h3 className="cp-Th3" style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 20 }}>
                  <Building2 size={16} style={{ color:"#f97316" }}/> Client Details
                </h3>
                <div style={{ display:"flex", alignItems:"center", gap: 16, flexWrap:"wrap" }}>
                  <div className="cp-av" style={{ width: 52, height: 52, borderRadius: 16, fontSize: 22, fontWeight: 700 }}>
                    {project.client.company_name?.[0] || "C"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="cp-T" style={{ fontSize: 16, marginBottom: 6 }}>{project.client.company_name}</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap: 16 }}>
                      {project.client.email && (
                        <a href={`mailto:${project.client.email}`} className="cp-plink">
                          <Mail size={12}/>{project.client.email}
                        </a>
                      )}
                      {project.client.phone && (
                        <span className="cp-T3" style={{ display:"flex", alignItems:"center", gap: 5 }}>
                          <Phone size={12}/>{project.client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display:"flex", flexDirection:"column", gap: 20 }}>
            <div>
              <p className="cp-Tlbl" style={{ marginBottom: 10, paddingLeft: 4 }}>Timeline Calendar</p>
              <MiniCalendar startDate={project.start_date} endDate={project.end_date} actualEndDate={project.actual_end_date} />
            </div>
            <div>
              <p className="cp-Tlbl" style={{ marginBottom: 10, paddingLeft: 4 }}>Team</p>
              <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
                <PersonCard label="Project Manager" person={project.project_manager} />
                <PersonCard label="Created By"      person={project.creator} />
              </div>
            </div>
            <div className="cp-card2">
              <p className="cp-Tlbl" style={{ marginBottom: 16 }}>Key Details</p>
              {[
                { label:"Project Code", value: project.project_code,           icon: Hash,         vc: null },
                { label:"Status",       value: sc.label,                       icon: StatusIcon,   vc: sc.accent },
                { label:"Priority",     value: pc.label,                       icon: Flag,         vc: pc.color },
                { label:"Currency",     value: project.currency,               icon: DollarSign,   vc: null },
                { label:"Created",      value: formatDate(project.created_at), icon: CalendarDays, vc: null },
              ].map(({ label, value, icon: Icon, vc }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 8, marginBottom: 14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                    <Icon size={13} style={{ color:"var(--text-muted)" }}/>
                    <span className="cp-T4">{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: vc || "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  const sc = getSCfg(project.status);
  const pc = getPCfg(project.priority);
  const progress = parseFloat(project.progress_percentage) || 0;
  const daysLeft = getDaysRemaining(project.end_date);

  return (
    <div className="cp-pcard" onClick={onClick}>
      <div style={{ height: 4, background: pc.bar }} />
      <div style={{ padding: 22 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap: 10, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <span className="cp-Tmono">{project.project_code}</span>
            <h3 className="cp-ctitle cp-T" style={{ fontSize: 16, marginTop: 6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", transition:"color 0.2s", fontWeight: 600 }}>
              {project.name}
            </h3>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, display:"flex", alignItems:"center", gap: 4, background: pc.bg, padding: "3px 8px", borderRadius: 40, flexShrink: 0 }}>
            <Flag size={10}/>{pc.label}
          </span>
        </div>

        {project.description && (
          <p className="cp-T3" style={{ fontSize: 12, lineHeight: 1.55, marginBottom: 16,
            display:"-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {project.description}
          </p>
        )}

        <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 18, flexWrap:"wrap" }}>
          <span className="cp-badge" style={{ color: sc.accent, background: sc.bg }}>
            <span style={{ width: 6, height: 6, borderRadius:"50%", background: sc.accent, display:"inline-block" }}/>
            {sc.label}
          </span>
          {project.project_type && <span className="cp-chip">{project.project_type}</span>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6 }}>
            <span className="cp-T4" style={{ fontWeight: 500 }}>Progress</span>
            <span className="cp-T" style={{ fontSize: 12 }}>{progress.toFixed(0)}%</span>
          </div>
          <div className="cp-prog-sm">
            <div className="cp-prog-fill" style={{ width:`${progress}%` }} />
          </div>
        </div>

        <div className="cp-divider" style={{ paddingTop: 14, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
          <div>
            <p className="cp-T4">{formatDate(project.start_date)}</p>
            {daysLeft !== null && (
              <p style={{ fontSize: 10, fontWeight: 600, marginTop: 3,
                color: daysLeft < 0 ? "#ef4444" : daysLeft < 7 ? "#f59e0b" : "var(--text-muted)" }}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
              </p>
            )}
          </div>
          <div style={{ textAlign:"right" }}>
            <p className="cp-Torg" style={{ fontSize: 15 }}>{formatCurrency(project.budget, project.currency)}</p>
            {project.client && <p className="cp-T4" style={{ marginTop: 3, maxWidth: 120, overflow:"hidden", textOverflow:"ellipsis" }}>{project.client.company_name}</p>}
          </div>
        </div>

        {project.project_manager && (
          <div className="cp-divider" style={{ paddingTop: 14, marginTop: 14, display:"flex", alignItems:"center", gap: 10 }}>
            <div className="cp-av" style={{ width: 28, height: 28, borderRadius:"50%", fontSize: 10, fontWeight: 600 }}>
              {(project.project_manager.first_name?.[0] || "") + (project.project_manager.last_name?.[0] || "")}
            </div>
            <p className="cp-T3" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex: 1 }}>
              {project.project_manager.first_name} {project.project_manager.last_name}
            </p>
            <ArrowUpRight size={12} style={{ color:"var(--text-muted)" }}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="cp-card" style={{ padding: 22 }}>
      <div className="cp-skel" style={{ height: 12, width: "35%", marginBottom: 14 }} />
      <div className="cp-skel" style={{ height: 16, width: "65%", marginBottom: 12 }} />
      <div className="cp-skel" style={{ height: 32, width: "100%", marginBottom: 16 }} />
      <div className="cp-skel" style={{ height: 5, width: "100%", marginBottom: 12 }} />
      <div className="cp-skel" style={{ height: 10, width: "50%", marginTop: 8 }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [priorityFilter, setPriority] = useState("all");
  const [selected, setSelected]       = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/all?status=cancelled`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter(p => {
    if (p.status !== "cancelled") return false;
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q) || p.project_code.toLowerCase().includes(q)) &&
      (priorityFilter === "all" || p.priority === priorityFilter)
    );
  });

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-wrap">
        {selected ? (
          <ProjectDetail project={selected} onBack={() => setSelected(null)} />
        ) : (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 56px" }}>

            {/* Header with gradient accent */}
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap: 16, marginBottom: 32 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap: 12, marginBottom: 6 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 14,
                    background: "linear-gradient(135deg, #f97316 0%, #fdba74 100%)",
                    display:"flex", alignItems:"center", justifyContent:"center", boxShadow: "0 4px 12px rgba(249,115,22,0.25)" }}>
                    <Sparkles size={20} style={{ color: "white" }}/>
                  </div>
                  <h1 className="cp-Thero" style={{ fontSize: 28 }}>
                    Cancelled <span style={{ color:"#f97316" }}>Projects</span>
                  </h1>
                </div>
                <p className="cp-T4" style={{ paddingLeft: 52 }}>PMS HRMS · Click any project to view detailed insights</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="cp-card" style={{ padding: 18, marginBottom: 24 }}>
              <div style={{ display:"flex", gap: 12, flexWrap:"wrap" }}>
                <div style={{ position:"relative", flex: 1, minWidth: 200 }}>
                  <Search size={16} style={{ position:"absolute", left: 14, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search completed projects by name, code, or description..."
                    className="cp-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
                <div style={{ position:"relative" }}>
                  <select value={priorityFilter} onChange={e => setPriority(e.target.value)} className="cp-select">
                    {[["all","All Priorities"],["low","Low Priority"],["medium","Medium Priority"],["high","High Priority"],["critical","Critical Priority"]].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position:"absolute", right: 12, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }}/>
                </div>
                {(search || priorityFilter !== "all") && (
                  <button className="cp-bclr" onClick={() => { setSearch(""); setPriority("all"); }}>
                    <X size={13}/> Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Results count */}
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p className="cp-T4">
                Showing <span className="cp-T" style={{ fontSize: 14, color: "#f97316" }}>{filtered.length}</span> completed project{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="cp-gcards">
                {Array.from({ length: 6 }).map((_,i) => <SkeletonCard key={i}/>)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="cp-card" style={{ padding: "80px 24px", textAlign:"center" }}>
                <Briefcase size={48} style={{ color:"var(--border-color)", margin:"0 auto 16px" }}/>
                <p className="cp-T" style={{ fontSize: 18, marginBottom: 6 }}>No projects found</p>
                <p className="cp-T4">Try adjusting your search or priority filter</p>
              </div>
            ) : (
              <div className="cp-gcards">
                {filtered.map((p,i) => (
                  <div key={p.id} className="cp-cent" style={{ animationDelay: `${i * 40}ms` }}>
                    <ProjectCard project={p} onClick={() => setSelected(p)}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}