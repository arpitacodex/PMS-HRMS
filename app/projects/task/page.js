"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ═══════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════
const BASE = "http://localhost:8080/api";

// ═══════════════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════════════
async function api(path, opts = {}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const r = await fetch(`${BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...opts,
    });
    const json = await r.json();
    return { ok: r.ok, ...json };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

// ═══════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════
const cx = (...args) => args.filter(Boolean).join(" ");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateShort = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${String(dt.getFullYear()).slice(2)}`;
};

const fmtMoney = (n, cur = "INR") =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtTimeAgo = (d) => {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return fmtDate(d);
};

const AVATAR_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899"];
const avatarBg = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const userInitials = (u) => {
  if (!u) return "?";
  return `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase() || "?";
};
const userName = (u) =>
  u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || `User #${u.id}` : "—";

// ═══════════════════════════════════════════════════════
//  STATUS / PRIORITY MAPS
// ═══════════════════════════════════════════════════════
const PROJECT_STATUS_MAP = {
  planning:    { label: "PLANNING",    bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
  in_progress: { label: "IN PROGRESS", bg: "bg-[#FFF7ED]", text: "text-[#EA580C]" },
  completed:   { label: "COMPLETED",   bg: "bg-[#F0FDF4]", text: "text-[#16A34A]" },
  on_hold:     { label: "ON HOLD",     bg: "bg-[#F8FAFC]", text: "text-[#64748B]" },
  cancelled:   { label: "CANCELLED",   bg: "bg-[#FFF1F2]", text: "text-[#E11D48]" },
};

const TASK_STATUS_MAP = {
  pending:     { label: "TO DO",       bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200" },
  in_progress: { label: "IN PROGRESS", bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200" },
  review:      { label: "REVIEW",      bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-200" },
  bug:         { label: "BUG",         bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200" },
  completed:   { label: "COMPLETED",   bg: "bg-green-50",   text: "text-green-600",   border: "border-green-200" },
  cancelled:   { label: "CANCELLED",   bg: "bg-gray-100",   text: "text-gray-500",    border: "border-gray-200" },
};


// const PRIORITY_MAP = {
//   low:      { label: "LOW",      text: "text-[#64748B]", flag: "#64748B", bg: "bg-slate-50",  border: "border-slate-200" },
//   medium:   { label: "MEDIUM",   text: "text-[#D97706]", flag: "#D97706", bg: "bg-amber-50",  border: "border-amber-200" },
//   high:     { label: "HIGH",     text: "text-[#DC2626]", flag: "#DC2626", bg: "bg-red-50",    border: "border-red-200" },
//   critical: { label: "CRITICAL", text: "text-[#7C3AED]", flag: "#7C3AED", bg: "bg-purple-50", border: "border-purple-200" },
// };
const PRIORITY_MAP = {
  low:      { label: "LOW",      text: "text-[#475569]", flag: "#94A3B8", bg: "bg-slate-50",   border: "border-slate-200",  cardBg: "from-slate-50 to-white",    badgeBg: "bg-slate-100",    badgeText: "text-slate-600" },
  medium:   { label: "MEDIUM",   text: "text-[#B45309]", flag: "#F59E0B", bg: "bg-amber-50",   border: "border-amber-200",  cardBg: "from-amber-50 to-white",    badgeBg: "bg-amber-100",    badgeText: "text-amber-700" },
  high:     { label: "HIGH",     text: "text-[#C2410C]", flag: "#F97316", bg: "bg-orange-50",  border: "border-orange-200", cardBg: "from-orange-50 to-white",   badgeBg: "bg-orange-100",   badgeText: "text-orange-700" },
  critical: { label: "CRITICAL", text: "text-[#B91C1C]", flag: "#EF4444", bg: "bg-red-50",     border: "border-red-200",    cardBg: "from-red-50 to-white",      badgeBg: "bg-red-100",      badgeText: "text-red-700" },
};
// Kanban columns
const KANBAN_COLS = [
  {
    id: "pending", label: "TO DO", color: "#F97316", bg: "#FFF7ED", border: "#FDBA74", canAdd: true,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  },
  {
    id: "in_progress", label: "IN PROGRESS", color: "#3B82F6", bg: "#EFF6FF", border: "#93C5FD", canAdd: false,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  },
  {
    id: "review", label: "REVIEW", color: "#8B5CF6", bg: "#F5F3FF", border: "#C4B5FD", canAdd: false,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c-4.418 0-8-3.582-8-8V7l8-4 8 4v7c0 4.418-3.582 8-8 8z"/></svg>,
  },
  {
    id: "bug", label: "BUG", color: "#EF4444", bg: "#FFF1F2", border: "#FCA5A5", canAdd: false,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>,
  },
  {
    id: "cancelled", label: "CANCELLED", color: "#EF4444", bg: "#FFF1F2", border: "#FCA5A5", canAdd: false,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>,
  },
  {
    id: "completed", label: "COMPLETE", color: "#10B981", bg: "#F0FDF4", border: "#6EE7B7", canAdd: false,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
  },
];

// ═══════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════
function useToast() {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setList((p) => [...p, { id, msg, type }]);
    setTimeout(() => setList((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { list, success: (m) => push(m, "success"), error: (m) => push(m, "error") };
}

function Toasts({ list }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {list.map((t) => (
        <div key={t.id} style={{ animation: "toastIn .3s ease" }}
          className={cx("px-4 py-3 rounded-xl shadow-lg text-sm font-semibold pointer-events-auto flex items-center gap-2",
            t.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
          {t.type === "success"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 11 3 3 8-8"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6m0-6 6 6"/></svg>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ═══════════════════════════════════════════════════════
function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (message, onOk) => setState({ message, onOk });
  const Dialog = state ? (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setState(null)} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] mx-4">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="m10.29 3.86-8.6 14.9A2 2 0 0 0 3.42 22h17.16a2 2 0 0 0 1.73-3l-8.59-15.14a2 2 0 0 0-3.43.14z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h4 className="font-bold text-gray-900 mb-1 text-sm">Are you sure?</h4>
        <p className="text-sm text-gray-500 mb-5">{state.message}</p>
        <div className="flex gap-2">
          <button onClick={() => setState(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => { state.onOk(); setState(null); }} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Confirm</button>
        </div>
      </div>
    </div>
  ) : null;
  return { confirm, Dialog };
}
// ═══════════════════════════════════════════════════════
//  FILE VIEWER MODAL
// ═══════════════════════════════════════════════════════
function FileViewerModal({ doc, onClose }) {
  if (!doc) return null;
  const [imgError, setImgError] = useState(false);
  const ext = (doc.document_type || "").toLowerCase();
  const url = doc.file_url || doc.document_url || doc.url || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  const isPdf   = ext === "pdf";
  const isVideo = ["mp4", "webm", "ogg"].includes(ext);
  const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext);
  const isText  = ["txt", "md", "csv", "json", "xml", "html", "js", "ts", "css"].includes(ext);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] mx-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
              style={{ backgroundColor: ext === "pdf" ? "#EF4444" : ["png","jpg","jpeg","gif","webp"].includes(ext) ? "#3B82F6" : ["doc","docx"].includes(ext) ? "#2563EB" : ["xls","xlsx"].includes(ext) ? "#16A34A" : "#8B5CF6" }}>
              {(ext || "?").toUpperCase().slice(0, 4)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{doc.document_name}</p>
              <p className="text-xs text-gray-400">{ext.toUpperCase()} file</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" download={doc.document_name}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </a>
            )}
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 min-h-[400px] flex items-center justify-center">
          {!url ? (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-400 p-10">
              <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="text-sm font-semibold text-gray-500">No preview URL available</p>
              <p className="text-xs text-gray-400 text-center">This file cannot be previewed. Try downloading it instead.</p>
            </div>
) : isImage && !imgError ? (
            <img
              src={url}
              alt={doc.document_name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              onError={() => setImgError(true)}
            />
          ) : isImage && imgError ? (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-400 p-10">
              <svg className="w-12 h-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p className="text-sm font-semibold text-gray-500">Image could not be loaded</p>
              <p className="text-xs text-gray-400 text-center break-all px-4">{url}</p>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition mt-1">
                  Open in new tab
                </a>
              )}
            </div>
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[70vh] border-0" title={doc.document_name}
              onError={() => {}} />
          ) : isVideo ? (
            <video controls className="max-w-full max-h-[70vh] rounded-lg shadow-sm">
              <source src={url} type={`video/${ext}`} />
              Your browser does not support video playback.
            </video>
          ) : isAudio ? (
            <div className="p-10 flex flex-col items-center gap-4">
              <svg className="w-16 h-16 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <audio controls className="w-64"><source src={url} type={`audio/${ext}`} /></audio>
            </div>
          ) : (
            /* Unsupported format — show open/download prompt */
            <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-black"
                style={{ backgroundColor: "#8B5CF6" }}>
                {(ext || "?").toUpperCase().slice(0, 4)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-1">Preview not available for .{ext} files</p>
                <p className="text-xs text-gray-400">Use the Download or Open button above to view this file.</p>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" download={doc.document_name}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════
//  DRAWER
// ═══════════════════════════════════════════════════════
function Drawer({ open, onClose, title, width = "max-w-md", children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <div onClick={onClose} className={cx("fixed inset-0 bg-black/40 z-40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0 pointer-events-none")} />
      <div className={cx("fixed top-0 right-0 h-full w-full z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300", width, open ? "translate-x-0" : "translate-x-full")}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
//  FIELD / INPUT STYLES
// ═══════════════════════════════════════════════════════
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition";
const selectCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer";

// ═══════════════════════════════════════════════════════
//  SHARED UI
// ═══════════════════════════════════════════════════════
function StatusBadge({ status }) {
  const m = PROJECT_STATUS_MAP[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600" };
  return <span className={cx("px-2.5 py-1 rounded-md text-xs font-bold tracking-wide", m.bg, m.text)}>{m.label}</span>;
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function StatCard({ label, value, valueColor = "text-gray-800" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <span className={cx("text-3xl font-bold", valueColor)}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  PROJECT FORM
// ═══════════════════════════════════════════════════════
function ProjectForm({ initial, deals, users, onSubmit, submitting }) {
  const blank = {
    name: "", description: "", deal_id: "",
    start_date: "", end_date: "", actual_end_date: "",
    budget: "", actual_cost: "", currency: "INR",
    project_type: "Software Development",
    priority: "medium", status: "planning",
    progress_percentage: 0, project_manager_id: "",
  };
  // const [form, setForm] = useState(() => initial
  //   ? { ...blank, ...initial, start_date: initial.start_date?.slice(0, 10) || "", end_date: initial.end_date?.slice(0, 10) || "", actual_end_date: initial.actual_end_date?.slice(0, 10) || "" }
  //   : blank);
  // const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const [form, setForm] = useState(() => initial
  ? { ...blank, ...initial, start_date: initial.start_date?.slice(0, 10) || "", end_date: initial.end_date?.slice(0, 10) || "", actual_end_date: initial.actual_end_date?.slice(0, 10) || "" }
  : blank);

// ✅ FIX 1: Re-sync form whenever the project data refreshes (e.g. after status update)
useEffect(() => {
  setForm(initial
    ? { ...blank, ...initial, start_date: initial.start_date?.slice(0, 10) || "", end_date: initial.end_date?.slice(0, 10) || "", actual_end_date: initial.actual_end_date?.slice(0, 10) || "" }
    : blank);
}, [initial?.id, initial?.status, initial?.progress_percentage, initial?.priority]);

const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Field label="Project Name" required>
        <input className={inputCls} value={form.name} onChange={set("name")} required placeholder="e.g. Mobile Development Project" />
      </Field>
      <Field label="Description">
        <textarea className={inputCls} rows={3} value={form.description} onChange={set("description")} placeholder="Brief project overview…" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date" required><input type="date" className={inputCls} value={form.start_date} onChange={set("start_date")} required /></Field>
        <Field label="End Date" required><input type="date" className={inputCls} value={form.end_date} onChange={set("end_date")} required /></Field>
      </div>
      <Field label="Actual End Date"><input type="date" className={inputCls} value={form.actual_end_date} onChange={set("actual_end_date")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Budget" required><input type="number" className={inputCls} value={form.budget} onChange={set("budget")} required placeholder="300000" /></Field>
        <Field label="Actual Cost"><input type="number" className={inputCls} value={form.actual_cost} onChange={set("actual_cost")} placeholder="0" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency">
          <select className={selectCls} value={form.currency} onChange={set("currency")}>
            {["INR","USD","EUR","GBP","AED"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Project Type">
          <select className={selectCls} value={form.project_type} onChange={set("project_type")}>
            {["Software Development","Web Development","Mobile Development","UI/UX Design","Consulting","Marketing","Data Analytics","Other"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" required>
          <select className={selectCls} value={form.priority} onChange={set("priority")}>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="critical">Critical</option>
          </select>
        </Field>
        <Field label="Status" required>
          <select className={selectCls} value={form.status} onChange={set("status")}>
            <option value="planning">Planning</option><option value="in_progress">In Progress</option>
            <option value="completed">Completed</option><option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      </div>
      <Field label={`Progress — ${form.progress_percentage}%`}>
        <input type="range" min={0} max={100} step={1} value={form.progress_percentage}
          onChange={(e) => setForm((p) => ({ ...p, progress_percentage: Number(e.target.value) }))}
          className="w-full accent-orange-600" />
      </Field>
      <Field label="Project Manager" required>
        <select className={selectCls} value={form.project_manager_id} onChange={set("project_manager_id")} required>
          <option value="">Select manager…</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.first_name ? `${u.first_name} ${u.last_name || ""}` : `User #${u.id}`}</option>)}
        </select>
      </Field>
<button
  type="submit"
  disabled={submitting}
  className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition disabled:opacity-60 mt-2"
  style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
  onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
  onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
  {submitting ? "Saving…" : "Update Project"}
</button>
    </form>
  );
}


// ═══════════════════════════════════════════════════════
//  TASK CARD
// ═══════════════════════════════════════════════════════

function TaskCard({ task, onEdit, onDelete, onRestore, onOpen }) {
  const assignee = task.assignee;
  const isDeleted = !!task.deleted_at;
  const p = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
  const flagColor = p.flag;

  return (
    <div
      onClick={() => !isDeleted && onOpen?.(task)}
      className={cx(
        "relative rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer bg-gradient-to-br",
        p.cardBg, p.border,
        isDeleted && "opacity-50"
      )}
      style={{ borderLeft: `3px solid ${flagColor}` }}
    >
      {/* Priority badge */}
      <div className="flex items-center gap-1.5 mb-2" onClick={(e) => e.stopPropagation()}>
        <span className={cx("inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md", p.badgeBg, p.badgeText)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill={flagColor} stroke={flagColor} strokeWidth="1">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          {p.label}
        </span>
      </div>

      {/* Title + action buttons */}
      <div className="flex items-start gap-2 mb-1.5">
        <p className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition leading-snug line-clamp-2">
          {task.title}
        </p>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
          {!isDeleted ? (
            <>
              <button onClick={() => onEdit(task)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => onDelete(task.id)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
              </button>
            </>
          ) : (
            <button onClick={() => onRestore(task.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition" title="Restore">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {task.progress_percentage > 0 && (
        <div className="h-1 bg-white/70 rounded-full overflow-hidden mb-2.5 border border-white/50">
          <div className="h-full rounded-full transition-all" style={{ width: `${task.progress_percentage}%`, backgroundColor: flagColor }} />
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          {assignee ? (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ backgroundColor: avatarBg(assignee.id) }} title={userName(assignee)}>
              {userInitials(assignee)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          )}
          {(task.start_date || task.due_date) && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>
                {fmtDateShort(task.start_date) && fmtDateShort(task.due_date)
                  ? `${fmtDateShort(task.start_date)} - ${fmtDateShort(task.due_date)}`
                  : fmtDateShort(task.due_date) || fmtDateShort(task.start_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {task.task_number && (
        <div className="mt-1.5 pt-1.5 border-t border-white/60">
          <span className="text-[9px] font-mono text-gray-300">{task.task_number}</span>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════
//  TASK FORM
// ═══════════════════════════════════════════════════════
function TaskForm({ initial, projectMembers, onSubmit, submitting, onClose }) {
  const blank = {
    title: "", description: "", assigned_to: "",
    priority: "medium", status: "pending",
    due_date: "",
    progress_percentage: 0,
  };

  const [form, setForm] = useState(() => {
    if (!initial) return blank;
    return {
      ...blank, ...initial,
      assigned_to: initial.assigned_to ?? initial.assignee?.id ?? "",
      due_date: initial.due_date?.slice(0, 10) ?? "",
      progress_percentage: initial.progress_percentage ?? 0,
    };
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = { ...form };
    if (!cleaned.due_date) cleaned.due_date = null;
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Title" required>
        <input className={inputCls} value={form.title} onChange={set("title")} required placeholder="Task title…" />
      </Field>
      <Field label="Description">
        <textarea className={inputCls} rows={3} value={form.description} onChange={set("description")} placeholder="Describe the task…" />
      </Field>
      <Field label="Assigned To">
        <select className={selectCls} value={form.assigned_to} onChange={set("assigned_to")}>
          <option value="">Unassigned</option>
          {projectMembers.map((m) => {
            const u = m.user || m;
            return (
              <option key={u.id} value={u.id}>
                {u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : `User #${u.id}`}
              </option>
            );
          })}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" required>
          <select className={selectCls} value={form.priority} onChange={set("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={selectCls} value={form.status} onChange={set("status")}>
            <option value="pending">Pending (To Do)</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="bug">Bug</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      </div>
      <Field label="Due Date">
        <input type="date" className={inputCls} value={form.due_date} onChange={set("due_date")} />
      </Field>
 {/* ── Progress bar — edit mode only ── */}
      {initial && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</label>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
              {form.progress_percentage}%
            </span>
          </div>
          <div className="relative">
   
            <input
              type="range" min={0} max={100} step={1}
              value={form.progress_percentage}
              onChange={(e) => setForm((p) => ({ ...p, progress_percentage: Number(e.target.value) }))}
              className="w-full accent-orange-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      )}
    <div className="flex gap-2 pt-1">
  <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
  <button
    type="submit"
    disabled={submitting}
    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-60"
    style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
    onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
    onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
    {submitting ? "Saving…" : initial ? "Update Task" : "Add Task"}
  </button>
</div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════
//  TASK DETAIL MODAL (ClickUp-style)
// ═══════════════════════════════════════════════════════
function TaskDetailModal({ task, projectId, users, onClose, toast, onTaskUpdated }) {
  const [activeSection, setActiveSection] = useState("details");
  // Documents
  const [viewDoc, setViewDoc] = useState(null);   // ← ADD THIS
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(true);
  const [subForm, setSubForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", status: "pending", start_date: "", due_date: "", estimated_hours: "" });
  const [showSubForm, setShowSubForm] = useState(false);
  const [subSubmitting, setSubSubmitting] = useState(false);
  // Remarks
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(true);
  const [remarkText, setRemarkText] = useState("");
  const [remarkSubmitting, setRemarkSubmitting] = useState(false);
  const [editingRemark, setEditingRemark] = useState(null);
  const [editRemarkText, setEditRemarkText] = useState("");
  const remarksEndRef = useRef(null);
  const { confirm, Dialog } = useConfirm();

  const fmtSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  const EXT_COLORS = { pdf: "#EF4444", png: "#3B82F6", jpg: "#3B82F6", jpeg: "#3B82F6", doc: "#2563EB", docx: "#2563EB", xls: "#16A34A", xlsx: "#16A34A", zip: "#D97706", default: "#8B5CF6" };
  const extColor = (type) => EXT_COLORS[type?.toLowerCase()] || EXT_COLORS.default;

  // Load docs
  // const loadDocs = useCallback(async () => {
  //   setDocsLoading(true);
  //   const r = await api(`/project-tasks/${task.id}/documents`);
  //   setDocs((r.data || []).filter(Boolean));
  //   setDocsLoading(false);
  // }, [task.id]);
// const loadDocs = useCallback(async () => {
//   setDocsLoading(true);
//   const r = await api(`/project-tasks/${task.id}/documents`);
//   const rawDocs = (r.data || []).filter(Boolean).map((doc) => {
//     const rawPath = doc.file_url || doc.document_url || doc.url || doc.file_path || "";
//     const cleanPath = rawPath.replace(/\\\\/g, "/").replace(/\\/g, "/").replace(/^\//, "");
//     return { ...doc, file_url: cleanPath
//   ? `http://localhost:8080/${cleanPath.replace("public/", "")}`
//   : "" };
//   });
//   setDocs(rawDocs);
//   setDocsLoading(false);
// }, [task.id]);



const loadDocs = useCallback(async () => {
  setDocsLoading(true);
  const r = await api(`/project-tasks/${task.id}/documents`);

  // Handle whatever key the API returns the array under
  const rawList = r.data || r.documents || r.docs || r.files || [];

  const rawDocs = rawList.filter(Boolean).map((doc) => {
    const rawPath = doc.file_path || doc.file_url || doc.document_url || doc.url || "";
    const cleanPath = rawPath
      .replace(/\\/g, "/")       // fix Windows backslashes ← THIS IS CRITICAL
      .replace(/^\/+/, "")       // strip leading slashes
      .replace(/^public\//, ""); // strip "public/" prefix
    return {
      ...doc,
      file_url: cleanPath ? `http://localhost:8080/${cleanPath}` : "",
    };
  });

  setDocs(rawDocs);
  setDocsLoading(false);
}, [task.id]);

  // Load subtasks
  const loadSubtasks = useCallback(async () => {
    setSubtasksLoading(true);
    const r = await api(`/project-tasks/${projectId}/all`);
    const all = r.tasks || r.data || [];
    setSubtasks(all.filter((t) => t.parent_task_id === task.id || String(t.parent_task_id) === String(task.id)));
    setSubtasksLoading(false);
  }, [task.id, projectId]);

  // Load remarks
  const loadRemarks = useCallback(async () => {
    setRemarksLoading(true);
    const r = await api(`/project-tasks/task-remark/${task.id}`);
    setRemarks((r.data || r.remarks || []).filter(Boolean));
    setRemarksLoading(false);
  }, [task.id]);

  useEffect(() => { loadDocs(); loadSubtasks(); loadRemarks(); }, [loadDocs, loadSubtasks, loadRemarks]);
  useEffect(() => {
    if (activeSection === "remarks" && remarksEndRef.current) {
      setTimeout(() => remarksEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [activeSection, remarks]);

// In TaskDetailModal — replace uploadDoc:
const uploadDoc = async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  setUploading(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  let successCount = 0;

  for (const file of Array.from(files)) {
    const formData = new FormData();
    formData.append("file", file); // must match .single("file") in the route

    try {
      const response = await fetch(`${BASE}/project-tasks/${task.id}/upload`, {
        method: "POST",
        headers: {
          // ⚠️ Do NOT set Content-Type — browser must set the multipart boundary
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      // Always try to parse JSON. If server returned HTML (crash), catch it.
      let json = {};
      try {
        json = await response.json();
      } catch {
        toast.error(`Server error uploading: ${file.name}`);
        continue;
      }

    if (response.ok && (json.success || json.message?.toLowerCase().includes("success") || json.data)) {
  successCount++;
} else {
  toast.error(json.message || `Failed to upload: ${file.name}`);
}
    } catch {
      toast.error(`Network error uploading: ${file.name}`);
    }
  }

  if (successCount > 0) {
    toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded!`);
    loadDocs();
  }

  setUploading(false);
  if (e.target) e.target.value = "";
};
  // Delete doc
  const deleteDoc = (id) => confirm("Delete this document?", async () => {
    const r = await api(`/project-tasks/delete-document/${id}`, { method: "DELETE" });
    if (r.success || r.ok || r.message?.toLowerCase().includes("success")) { toast.success("Deleted!"); loadDocs(); }
    else toast.error(r.message || "Failed");
  });

  // Create subtask


  // Create remark
  const createRemark = async () => {
    if (!remarkText.trim()) return;
    setRemarkSubmitting(true);
    const r = await api(`/project-tasks/task-remark/create/${task.id}`, { method: "POST", body: JSON.stringify({ remark: remarkText }) });
    setRemarkSubmitting(false);
    if (r.message?.toLowerCase().includes("success") || r.data) {
      setRemarkText("");
      loadRemarks();
    } else toast.error(r.message || "Failed");
  };

  // Update remark
  const updateRemark = async (id) => {
    if (!editRemarkText.trim()) return;
    const r = await api(`/project-tasks/task-remark/update/${id}`, { method: "PUT", body: JSON.stringify({ remark: editRemarkText }) });
    if (r.message?.toLowerCase().includes("success") || r.data) {
      setEditingRemark(null);
      setEditRemarkText("");
      loadRemarks();
    } else toast.error(r.message || "Failed");
  };

  // Delete remark
 // Replace deleteRemark:
  const deleteRemark = (id) => confirm("Delete this remark?", async () => {
    const r = await api(`/project-tasks/task-remark/delete/${id}`, { method: "DELETE" });
    if (r.success || r.ok || r.message?.toLowerCase().includes("success")) {
      // Mark as deleted locally instead of removing
      setRemarks((prev) => prev.map((rem) =>
        rem.id === id ? { ...rem, deleted: true, remark: "__deleted__" } : rem
      ));
    } else toast.error(r.message || "Failed");
  });

  // In the remarks map, replace the remark bubble:
  {remarks.map((r) => {
    const isEdited = r.updated_at && r.created_at && new Date(r.updated_at).getTime() !== new Date(r.created_at).getTime();
    const displayTime = isEdited ? `Edited ${fmtTimeAgo(r.updated_at)}` : fmtTimeAgo(r.created_at);
    const user = r.user || { id: r.user_id, first_name: "User", last_name: "" };
    const isEditing = editingRemark === r.id;
    const isDeleted = r.deleted || r.remark === "__deleted__";
    return (
      <div key={r.id} className="flex items-start gap-3 group">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
          style={{ backgroundColor: avatarBg(user.id) }}>
          {userInitials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-800">{userName(user)}</span>
            <span className="text-[10px] text-gray-400">{displayTime}</span>
          </div>
          {isDeleted ? (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-400 italic flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
              You deleted this message
            </div>
          ) : isEditing ? (
            <div className="space-y-2">
              <textarea className={cx(inputCls, "resize-none")} rows={2} value={editRemarkText}
                onChange={(e) => setEditRemarkText(e.target.value)} autoFocus />
              <div className="flex gap-2">
                <button onClick={() => { setEditingRemark(null); setEditRemarkText(""); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={() => updateRemark(r.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition">Save</button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
              {r.remark}
            </div>
          )}
        </div>
        {!isEditing && !isDeleted && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition mt-1">
            <button onClick={() => { setEditingRemark(r.id); setEditRemarkText(r.remark); }}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => deleteRemark(r.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
            </button>
          </div>
        )}
      </div>
    );
  })}

  const statusInfo = TASK_STATUS_MAP[task.status] || { label: task.status, bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
  const priorityInfo = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
  const assignee = task.assignee;

  const SECTIONS = [
    { id: "details",  label: "Details" },
   
    { id: "files",    label: `Files (${docs.length})` },
    { id: "remarks",  label: `Remarks (${remarks.length})` },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-stretch justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {Dialog}
      {viewDoc && <FileViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
      {/* Modal panel */}
      <div className="relative bg-white w-full sm:w-[90vw] sm:max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {task.task_number && <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{task.task_number}</span>}
              <span className={cx("text-xs font-bold px-2 py-0.5 rounded-full border", statusInfo.bg, statusInfo.text, statusInfo.border)}>{statusInfo.label}</span>
              <span className={cx("text-xs font-bold px-2 py-0.5 rounded-full border", priorityInfo.bg, priorityInfo.border, priorityInfo.text)}>
                ⚑ {priorityInfo.label}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">{task.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-400 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto shrink-0 bg-white">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cx("px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition",
                activeSection === s.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600")}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
      <div className="flex-1 overflow-y-auto">

  {/* ── DETAILS ── */}
  {activeSection === "details" && (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Status", value: <span className={cx("text-xs font-bold px-2 py-0.5 rounded-full", statusInfo.bg, statusInfo.text)}>{statusInfo.label}</span> },
          { label: "Priority", value: <span className={cx("text-xs font-bold px-2 py-0.5 rounded-full", priorityInfo.bg, priorityInfo.text)}>⚑ {priorityInfo.label}</span> },
          { label: "Assigned To", value: assignee ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: avatarBg(assignee.id) }}>{userInitials(assignee)}</div>
              <span className="text-sm font-semibold text-gray-700">{userName(assignee)}</span>
            </div>
          ) : <span className="text-sm text-gray-400">Unassigned</span> },
          { label: "Due Date", value: <span className="text-sm text-gray-700">{fmtDate(task.due_date)}</span> },
          { label: "Progress", value: (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${task.progress_percentage || 0}%`, background: "linear-gradient(90deg, #F97316 0%, #EA580C 100%)" }} />
              </div>
              <span className="text-xs font-bold text-gray-700">{task.progress_percentage || 0}%</span>
            </div>
          )},
        ].map(({ label, value }) => (
          <div key={label} className="bg-orange-50/40 border border-orange-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wide mb-1">{label}</p>
            {value}
          </div>
        ))}
      </div>
      {task.description && (
        <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
    </div>
  )}

  {/* ── FILES ── */}
  {activeSection === "files" && (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Attachments</h3>
          <p className="text-xs text-gray-400 mt-0.5">{docs.length} file{docs.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
          {uploading
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={uploadDoc} />
      </div>

      {/* Drag & drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center mb-4 hover:border-orange-400 hover:bg-orange-50/30 transition cursor-pointer group">
        <svg className="w-8 h-8 mx-auto mb-2 text-orange-200 group-hover:text-orange-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p className="text-xs text-gray-400 group-hover:text-orange-500 transition">Click to upload files</p>
      </div>

      {docsLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <svg className="w-10 h-10 mb-2 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p className="text-sm font-semibold text-gray-500">No files attached</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const uploader = doc.uploader;
            return (
              <div key={doc.id}
                onClick={() => setViewDoc(doc)}
                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-orange-100 hover:shadow-sm transition-all group cursor-pointer">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ backgroundColor: extColor(doc.document_type) }}>
                  {(doc.document_type || "?").toUpperCase().slice(0, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{doc.document_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 flex-wrap">
                    <span>{fmtSize(doc.file_size)}</span>
                    <span className="text-gray-200">·</span>
                    <span>{fmtDate(doc.created_at || doc.uploaded_at)}</span>
                    {uploader && <><span className="text-gray-200">·</span><span>{uploader.first_name} {uploader.last_name}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewDoc(doc); }}
                    className="p-1.5 hover:bg-orange-50 rounded-lg text-gray-300 hover:text-orange-500 transition"
                    title="View">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition"
                    title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )}

  {/* ── REMARKS ── */}
  {activeSection === "remarks" && (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0" style={{ maxHeight: "calc(90vh - 280px)" }}>
        {remarksLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : remarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="text-sm font-semibold text-gray-500 mb-1">No remarks yet</p>
            <p className="text-xs text-gray-400">Be the first to add a remark</p>
          </div>
        ) : (
          remarks.map((r) => {
            const isEdited = r.updated_at && r.created_at && new Date(r.updated_at).getTime() !== new Date(r.created_at).getTime();
            const displayTime = isEdited ? `Edited ${fmtTimeAgo(r.updated_at)}` : fmtTimeAgo(r.created_at);
            const user = r.user || { id: r.user_id, first_name: "User", last_name: "" };
            const isEditing = editingRemark === r.id;
            return (
              <div key={r.id} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: avatarBg(user.id) }}>
                  {userInitials(user)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-800">{userName(user)}</span>
                    <span className="text-[10px] text-gray-400">{displayTime}</span>
                    {isEdited && <span className="text-[9px] text-orange-400 bg-orange-50 px-1 rounded">edited</span>}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        className={cx(inputCls, "resize-none")}
                        rows={2}
                        value={editRemarkText}
                        onChange={(e) => setEditRemarkText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingRemark(null); setEditRemarkText(""); }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                          Cancel
                        </button>
                        <button
                          onClick={() => updateRemark(r.id)}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-bold transition"
                          style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
                          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                      {r.remark}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition mt-1">
                    <button onClick={() => { setEditingRemark(r.id); setEditRemarkText(r.remark); }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deleteRemark(r.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={remarksEndRef} />
      </div>

      {/* Remark input box */}
      <div className="p-4 border-t border-orange-100 bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            className={cx(inputCls, "resize-none flex-1")}
            rows={2}
            placeholder="Write a remark…"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); createRemark(); } }}
          />
          <button
            onClick={createRemark}
            disabled={remarkSubmitting || !remarkText.trim()}
            className="w-10 h-10 flex items-center justify-center text-white rounded-xl transition disabled:opacity-40 shrink-0"
            style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
            onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
            onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
            {remarkSubmitting
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )}
</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  KANBAN BOARD
// ═══════════════════════════════════════════════════════
function KanbanBoard({ projectId, users, toast, externalOpen, onExternalClose }) {
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [drawerOpen, setDrawer]         = useState(false);
  const [editTask, setEditTask]         = useState(null);
  const [submitting, setSub]            = useState(false);
  const [detailTask, setDetailTask]     = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);  // ADD THIS
 
  const { confirm, Dialog }             = useConfirm();
// 1. ADD state alongside other states in ProjectTaskContent:


// 2. ADD fetch function alongside other callbacks:
const fetchProjectMembers = useCallback(async () => {
  if (!projectId) return;
  const r = await api(`/project/members/${projectId}`);
  setProjectMembers((r.data || r.members || []).filter(Boolean));
}, [projectId]);

// 3. ADD effect alongside other effects:
useEffect(() => { fetchProjectMembers(); }, [fetchProjectMembers]);

  const load = useCallback(async () => {
    setLoading(true);
    const [taskRes, memberRes] = await Promise.all([
      api(`/project-tasks/${projectId}/all`),
      api(`/project/members/${projectId}`),          // ADD THIS
    ]);
    const raw = taskRes.tasks || taskRes.data || [];
    const normalized = raw.filter(Boolean).map((t) => ({
      ...t,
      status:   t.status?.toLowerCase(),
      priority: t.priority?.toLowerCase(),
    }));
    setTasks(normalized);
    setProjectMembers((memberRes.data || memberRes.members || []).filter(Boolean)); // ADD THIS
    setLoading(false);
    window.dispatchEvent(new CustomEvent("taskStatsChanged"));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (externalOpen) { setEditTask(null); setDrawer(true); } }, [externalOpen]);

  const close = () => { setDrawer(false); onExternalClose?.(); };
  const openEdit = (t) => { setEditTask(t); setDrawer(true); };
  const byCol = (colId) => tasks.filter((t) => t.status === colId);

  const submit = async (form) => {
    setSub(true);
    const payload = editTask ? { ...editTask, ...form } : { ...form };
    delete payload.assignee; delete payload.created_at; delete payload.updated_at;
    delete payload.deleted_at; delete payload.task_number;
    const r = editTask
      ? await api(`/project-tasks/update/${editTask.id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await api(`/project-tasks/${projectId}/create`, { method: "POST", body: JSON.stringify(payload) });
    setSub(false);
    if (r.success || r.ok) { toast.success(editTask ? "Task updated!" : "Task created!"); close(); load(); }
    else toast.error(r.message || "Failed");
  };

  const del = (id) => confirm("Delete this task permanently?", async () => {
    const r = await api(`/project-tasks/delete/${id}`, { method: "DELETE" });
    if (r.success || r.ok) { toast.success("Task deleted!"); load(); }
    else toast.error(r.message || "Failed");
  });

  const restore = async (id) => {
    const r = await api(`/project-tasks/restore/${id}`, { method: "POST" });
    if (r.success || r.ok) { toast.success("Task restored!"); load(); }
    else toast.error(r.message || "Failed");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {Dialog}
      {/* {viewDoc && <FileViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />} */}
      {/* Task Detail Modal */}
      {detailTask && (
    <TaskDetailModal
      task={detailTask}
      projectId={projectId}
      projectMembers={projectMembers}   // ADD
      toast={toast}
      onClose={() => setDetailTask(null)}
      onTaskUpdated={load}
    />
  )}
      <style>{`.kanban-scroll::-webkit-scrollbar{height:4px}.kanban-scroll::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:99px}.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {KANBAN_COLS.map((col) => (
          <div key={col.id} className="flex items-center gap-1.5">
            <span style={{ color: col.color }}>{col.icon}</span>
            <span className="text-xs font-bold" style={{ color: col.color }}>{col.label}</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: col.color + "20", color: col.color }}>{byCol(col.id).length}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-400">{tasks.length} total tasks</span>
      </div>
      {/* Kanban columns */}
      <div className="kanban-scroll overflow-x-auto -mx-4 sm:-mx-0 pb-4">
        <div className="flex gap-4" style={{ minWidth: `${KANBAN_COLS.length * 240}px` }}>
          {KANBAN_COLS.map((col) => {
            const colTasks = byCol(col.id);
            return (
              <div key={col.id} className="flex flex-col" style={{ width: 232, flexShrink: 0 }}>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
                  style={{ backgroundColor: col.bg, border: `1px solid ${col.border}` }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: col.color }}>{col.icon}</span>
                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: col.color }}>{col.label}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: col.color + "22", color: col.color }}>{colTasks.length}</span>
                  </div>
       
                  {col.canAdd && (
  <button onClick={() => { setEditTask(null); setDrawer(true); }}
    className="flex items-center gap-1 text-xs font-bold hover:opacity-70 transition text-orange-500">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
    Add Task
  </button>
)}
                </div>
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[600px] pr-0.5">
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-200">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                      <p className="text-xs font-medium mt-1.5">Empty</p>
                    </div>
                  )}
                  {colTasks.map((t) => (
                    <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={del} onRestore={restore} onOpen={(task) => setDetailTask(task)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Drawer open={drawerOpen} onClose={close} title={editTask ? "Edit Task" : "New Task"} width="max-w-sm">
     <TaskForm
    key={editTask ? `edit-${editTask.id}` : "new"}
    initial={editTask}
    projectMembers={projectMembers}   // CHANGED from users
    onSubmit={submit}
    submitting={submitting}
    onClose={close}
  />
      </Drawer>
    </div>
  );
}

function TasksWrap({ projectId, users, toast }) {
  const [externalOpen, setExternalOpen] = useState(false);
  useEffect(() => {
    const h = () => setExternalOpen(true);
    window.addEventListener("openNewTask", h);
    return () => window.removeEventListener("openNewTask", h);
  }, []);
  return <KanbanBoard projectId={projectId} users={users} toast={toast} externalOpen={externalOpen} onExternalClose={() => setExternalOpen(false)} />;
}

// ═══════════════════════════════════════════════════════
//  CALENDAR TAB
// ═══════════════════════════════════════════════════════

function CalendarTab({ project, projectMembers = [], tasks = [] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Create calendar cells with empty padding
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const startDate = project?.start_date ? new Date(project.start_date) : null;
  const endDate   = project?.end_date   ? new Date(project.end_date)   : null;
  
  // Function to check if a date is within project range
  const isInRange = (d) => { 
    if (!startDate || !endDate) return false; 
    const cur = new Date(year, month, d); 
    return cur >= startDate && cur <= endDate; 
  };
  
  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    if (!day || !tasks || tasks.length === 0) return [];
    return tasks.filter(task => {
      if (!task.due_date && !task.start_date) return false;
      
      // Check if task has due date matching this day
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate.getFullYear() === year && 
            dueDate.getMonth() === month && 
            dueDate.getDate() === day) {
          return true;
        }
      }
      
      // Check if task has start date matching this day
      if (task.start_date) {
        const startDate = new Date(task.start_date);
        if (startDate.getFullYear() === year && 
            startDate.getMonth() === month && 
            startDate.getDate() === day) {
          return true;
        }
      }
      
      return false;
    });
  };

  return (
    <div className="space-y-4">
  {/* Project Info Card */}
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center gap-4">
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Project</p>
      <p className="text-sm font-bold text-gray-800">{project?.name || "—"}</p>
    </div>
    <div className="w-px h-8 bg-gray-100" />
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Team</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {projectMembers.length === 0 ? (
          <span className="text-xs text-gray-400">No members</span>
        ) : (
          <>
            {projectMembers.slice(0, 5).map((m, idx) => {
              const u = m.user || m;
              const name = u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : `User #${u.id}`;
              return (
                <div key={u.id || idx} className="flex items-center gap-1 bg-orange-50 rounded-full pl-0.5 pr-2 py-0.5"
                  title={name}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: avatarBg(u.id || idx) }}>
                    {((u.first_name?.[0] || "") + (u.last_name?.[0] || "")).toUpperCase() || "?"}
                  </div>
                  <span className="text-[11px] font-semibold text-orange-700">{name}</span>
                </div>
              );
            })}
            {projectMembers.length > 5 && (
              <span className="text-xs text-gray-400 font-medium">+{projectMembers.length - 5} more</span>
            )}
          </>
        )}
      </div>
    </div>
  </div>

  {/* Calendar */}
  <div className="bg-white rounded-xl border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-5">
      <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <h3 className="font-bold text-gray-800">{MONTHS[month]} {year}</h3>
      <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    {/* Day headers */}
    <div className="grid grid-cols-7 mb-2">
      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
        <div key={d} className="text-center text-xs font-bold text-orange-400 py-1">{d}</div>
      ))}
    </div>

    {/* Calendar grid */}
    <div className="grid grid-cols-7 gap-1">
      {cells.map((day, i) => {
        const dayTasks = day ? getTasksForDay(day) : [];
        const hasTasks = dayTasks.length > 0;
        const isStart = day && startDate && startDate.getFullYear() === year && startDate.getMonth() === month && startDate.getDate() === day;
        const isEnd = day && endDate && endDate.getFullYear() === year && endDate.getMonth() === month && endDate.getDate() === day;
        const isToday = day && today.getFullDate && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

        return (
          <div key={i} className={cx(
            "relative min-h-[80px] p-1 rounded-lg text-sm font-medium transition border",
            !day && "invisible",
            day && isStart && "text-white font-bold border-orange-500",
            day && isEnd && "bg-green-600 text-white font-bold border-green-600",
            day && isToday && !isStart && !isEnd && "bg-orange-50 text-orange-600 border-orange-200",
            day && isInRange(day) && !isStart && !isEnd && !isToday && "bg-orange-50/60 text-orange-700 border-orange-100",
            day && !isStart && !isEnd && !isToday && !isInRange(day) && "text-gray-700 hover:bg-orange-50/40 border-gray-100",
            hasTasks && !isStart && !isEnd && "border-l-4 border-l-orange-400"
          )}
          style={day && isStart ? { background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)", borderColor: "#EA580C" } : {}}>
            <span className="absolute top-1 left-1 text-xs">{day}</span>

            {/* Task indicators */}
            {hasTasks && dayTasks.length > 0 && (
              <div className="mt-5 space-y-1">
                {dayTasks.slice(0, 2).map(task => {
                  const assignee = task.assignee;
                  const assigneeName = assignee
                    ? (assignee.first_name ? `${assignee.first_name} ${assignee.last_name || ""}`.trim() : `User #${assignee.id}`)
                    : "Unassigned";
                  return (
                    <div
                      key={task.id}
                      className="text-[9px] p-1 rounded bg-white shadow-sm truncate cursor-help border-l-2 border-l-orange-300"
                      title={`${task.title} - Assigned to: ${assigneeName}`}>
                      <div className="flex items-center gap-1">
                        {assignee && (
                          <div
                            className="w-3 h-3 rounded-full flex items-center justify-center text-white text-[6px] font-bold shrink-0"
                            style={{ backgroundColor: avatarBg(assignee.id) }}>
                            {userInitials(assignee)}
                          </div>
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  );
                })}
                {dayTasks.length > 2 && (
                  <div className="text-[8px] text-orange-400 font-medium px-1">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Legend */}
    <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }} />
        <span>Start date</span>
      </div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-600" /><span>End date</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-50 ring-1 ring-orange-200" /><span>Today</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-50/60" /><span>Project range</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-l-4 border-l-orange-400" /><span>Has tasks</span></div>
    </div>
  </div>
</div>
  );
}

// ═══════════════════════════════════════════════════════
//  ANALYTICS TAB
// ═══════════════════════════════════════════════════════
function AnalyticsTab({ project }) {
  const budget    = Number(project?.budget || 0);
  const cost      = Number(project?.actual_cost || 0);
  const progress  = Number(project?.progress_percentage || 0);
  const remaining = budget - cost;
  const burnPct   = budget > 0 ? Math.round((cost / budget) * 100) : 0;
  const start     = project?.start_date ? new Date(project.start_date) : null;
  const end       = project?.end_date   ? new Date(project.end_date)   : null;
  const now       = new Date();
  const totalDays = start && end ? Math.ceil((end - start) / 86400000) : 0;
  const elapsed   = start ? Math.max(0, Math.ceil((now - start) / 86400000)) : 0;
  const timePct   = totalDays > 0 ? Math.min(100, Math.round((elapsed / totalDays) * 100)) : 0;
  const Bar = ({ label, pct, color }) => (
    <div>
      <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-500 font-medium">{label}</span><span className="font-bold text-gray-800">{pct}%</span></div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={cx("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} /></div>
    </div>
  );
  return (
   <div className="space-y-5">
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {[{ label: "Total Budget", val: fmtMoney(budget, project?.currency), color: "text-orange-500" },
      { label: "Actual Cost", val: fmtMoney(cost, project?.currency), color: "text-orange-600" },
      { label: "Remaining", val: fmtMoney(remaining, project?.currency), color: remaining >= 0 ? "text-green-600" : "text-red-600" }]
      .map(({ label, val, color }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
          <p className={cx("text-xl font-bold", color)}>{val}</p>
        </div>
      ))}
  </div>

  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
    <h4 className="font-bold text-gray-800 text-sm">Project Health</h4>
    <Bar label="Task Progress" pct={progress} color="bg-orange-500" />
    <Bar label="Budget Burn Rate" pct={burnPct} color={burnPct > 90 ? "bg-red-500" : burnPct > 70 ? "bg-amber-400" : "bg-green-500"} />
    <Bar label="Timeline Progress" pct={timePct} color={timePct > progress + 20 ? "bg-red-400" : "bg-emerald-500"} />
  </div>

  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h4 className="font-bold text-gray-800 text-sm mb-3">Timeline</h4>
    <div className="space-y-2 text-sm">
      {[["Start Date", fmtDate(project?.start_date)], ["End Date", fmtDate(project?.end_date)],
        ["Duration", totalDays ? `${totalDays} days` : "—"], ["Days Elapsed", elapsed ? `${elapsed} days` : "—"],
        ["Days Remaining", totalDays > elapsed ? `${totalDays - elapsed} days` : "⚠ Overdue"]]
        .map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-gray-400">{k}</span>
            <span className={cx("font-semibold", v === "⚠ Overdue" ? "text-red-500" : "text-gray-800")}>{v}</span>
          </div>
        ))}
    </div>
  </div>
</div>
  );
}

// ═══════════════════════════════════════════════════════
//  MEMBERS TAB
// ═══════════════════════════════════════════════════════
function MembersTab({ projectId, users, toast }) {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [addOpen, setAddOpen]   = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEM]     = useState(null);
  const [form, setForm]         = useState({ user_id: "", role_in_project: "" });
  const [editRole, setEditRole] = useState("");
  const [sub, setSub]           = useState(false);
  const { confirm, Dialog }     = useConfirm();

  const AVATAR_PALETTE = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899","#84CC16"];
  const getAvatarBg = (idx) => AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  const getMemberName = (m) => { if (!m) return "Unknown"; const u = m.user || m; if (u.first_name || u.last_name) return `${u.first_name || ""} ${u.last_name || ""}`.trim(); return `User #${m.user_id || u.id || "?"}`; };
  const getMemberInitials = (m) => { if (!m) return "?"; const u = m.user || m; return ((u.first_name?.[0] || "") + (u.last_name?.[0] || "")).toUpperCase() || "?"; };
  const getMemberEmail = (m) => (m?.user || m)?.email || "";
  const getMemberUserId = (m) => m?.user_id ?? m?.user?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api(`/project/members/${projectId}`);
    setMembers((r.members || r.data || []).filter(Boolean));
    setLoading(false);
    window.dispatchEvent(new CustomEvent("memberCountChanged"));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const addMember = async () => {
    if (!form.user_id || !form.role_in_project) { toast.error("Please fill all fields"); return; }
    setSub(true);
    const r = await api(`/project/members/add/${projectId}`, { method: "POST", body: JSON.stringify({ user_id: Number(form.user_id), role_in_project: form.role_in_project }) });
    setSub(false);
    if (r.success || r.ok) { toast.success("Member added!"); setAddOpen(false); setForm({ user_id: "", role_in_project: "" }); load(); }
    else toast.error(r.message || "Failed to add member");
  };

  const updateRole = async () => {
    if (!editRole.trim()) { toast.error("Role cannot be empty"); return; }
    setSub(true);
    const r = await api(`/project/${projectId}/members/update-role/${editMember.user_id}`, { method: "PUT", body: JSON.stringify({ role_in_project: editRole }) });
    setSub(false);
    if (r.success || r.ok) { toast.success("Role updated!"); setEditOpen(false); setEM(null); load(); }
    else toast.error(r.message || "Failed to update role");
  };

  const removeMember = (userId) => confirm("Remove this member from the project?", async () => {
    const r = await api(`/project/${projectId}/members/remove/${userId}`, { method: "DELETE" });
    if (r.success || r.ok || r.message?.toLowerCase().includes("removed")) { toast.success("Member removed!"); load(); }
    else toast.error(r.message || "Failed to remove member");
  });

  const ROLES = ["Project Manager","Frontend Developer","Backend Developer","UI/UX Designer","QA Engineer","DevOps","Scrum Master","Tech Lead"];

  return (
  <div>
  {Dialog}

  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-sm font-bold text-gray-800">Team Members</h3>
      <p className="text-xs text-gray-400 mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""} on this project</p>
    </div>
    <button
      onClick={() => { setForm({ user_id: "", role_in_project: "" }); setAddOpen(true); }}
      className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition shadow-sm"
      style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
      onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
      onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      Add Member
    </button>
  </div>

  {loading ? (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : members.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg className="w-14 h-14 mb-3 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
      <p className="text-sm font-semibold text-gray-500 mb-1">No members yet</p>
      <button
        onClick={() => setAddOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition mt-3"
        style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
        onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
        onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Add Member
      </button>
    </div>
  ) : (
    <div className="space-y-2.5">
      {members.map((m, idx) => {
        if (!m) return null;
        const uid = getMemberUserId(m);
        if (uid === null) return null;
        return (
          <div key={`member-${uid}-${idx}`} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-orange-100 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: getAvatarBg(idx) }}>{getMemberInitials(m)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm leading-tight">{getMemberName(m)}</p>
              {getMemberEmail(m) && <p className="text-xs text-gray-400 truncate mt-0.5">{getMemberEmail(m)}</p>}
              <span className="inline-block mt-1 text-[11px] bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-full tracking-wide">{m.role_in_project || "Member"}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setEM(m); setEditRole(m.role_in_project || ""); setEditOpen(true); }} className="p-2 hover:bg-orange-50 rounded-lg text-gray-400 hover:text-orange-500 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => removeMember(uid)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}

  <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Add Team Member" width="max-w-sm">
    <div className="space-y-4">
      <Field label="Select User" required>
        <select className={selectCls} value={form.user_id} onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}>
          <option value="">Choose a user…</option>
          {users.filter((u) => !members.some((m) => getMemberUserId(m) === u.id)).map((u) => (
            <option key={u.id} value={u.id}>{u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : `User #${u.id}`}{u.email ? ` — ${u.email}` : ""}</option>
          ))}
        </select>
      </Field>
      <Field label="Role in Project" required>
        <input className={inputCls} value={form.role_in_project} onChange={(e) => setForm((p) => ({ ...p, role_in_project: e.target.value }))} placeholder="e.g. Frontend Developer" />
      </Field>
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">Quick select:</p>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.slice(0, -1).map((role) => (
            <button key={role} type="button" onClick={() => setForm((p) => ({ ...p, role_in_project: role }))}
              className={cx("text-xs px-2.5 py-1 rounded-lg border font-medium transition",
                form.role_in_project === role
                  ? "text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
              )}
              style={form.role_in_project === role ? { background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" } : {}}>
              {role}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
        <button
          type="button" onClick={addMember} disabled={sub}
          className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
          {sub ? "Adding…" : "Add Member"}
        </button>
      </div>
    </div>
  </Drawer>

  <Drawer open={editOpen} onClose={() => { setEditOpen(false); setEM(null); }} title="Update Member Role" width="max-w-sm">
    <div className="space-y-4">
      {editMember && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: getAvatarBg(members.findIndex((m) => getMemberUserId(m) === getMemberUserId(editMember))) }}>{getMemberInitials(editMember)}</div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{getMemberName(editMember)}</p>
            <p className="text-xs text-gray-400">Current: <span className="font-medium text-orange-500">{editMember.role_in_project}</span></p>
          </div>
        </div>
      )}
      <Field label="New Role" required>
        <input className={inputCls} value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="e.g. Tech Lead" />
      </Field>
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">Quick select:</p>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((role) => (
            <button key={role} type="button" onClick={() => setEditRole(role)}
              className={cx("text-xs px-2.5 py-1 rounded-lg border font-medium transition",
                editRole === role
                  ? "text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
              )}
              style={editRole === role ? { background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" } : {}}>
              {role}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => { setEditOpen(false); setEM(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
        <button
          type="button" onClick={updateRole} disabled={sub}
          className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
          {sub ? "Updating…" : "Update Role"}
        </button>
      </div>
    </div>
  </Drawer>
</div>
  );
}

// ═══════════════════════════════════════════════════════
//  DOCUMENTS TAB
// ═══════════════════════════════════════════════════════
function DocumentsTab({ projectId, toast }) {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewDoc, setViewDoc]     = useState(null);
  const fileRef                   = useRef(null);
  const { confirm, Dialog }       = useConfirm();

  // const load = useCallback(async () => {
  //   setLoading(true);
  //   const r = await api(`/project-documents/list/${projectId}`);
  //   setDocs((r.data || []).filter(Boolean));
  //   setLoading(false);
  // }, [projectId]);

const load = useCallback(async () => {
  setLoading(true);
  const r = await api(`/project-documents/list/${projectId}`);
  const rawDocs = (r.data || []).filter(Boolean).map((doc) => {
    const rawPath = doc.file_url || doc.document_url || doc.url || doc.file_path || "";
    const cleanPath = rawPath.replace(/\\\\/g, "/").replace(/\\/g, "/").replace(/^\//, "");
    return { ...doc, file_url: cleanPath
  ? `http://localhost:8080/${cleanPath.replace("public/", "")}`
  : "" };
  });
  setDocs(rawDocs);
  setLoading(false);
}, [projectId]);

  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("documents", f));
    try {
      const r = await fetch(`${BASE}/project-documents/upload/${projectId}`, {
        method: "POST",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      const json = await r.json();
      if (json.success) { toast.success(`${json.count} file(s) uploaded!`); load(); }
      else toast.error(json.message || "Upload failed");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
    e.target.value = "";
  };

  const del = (id) => confirm("Delete this document permanently?", async () => {
    const r = await api(`/project-documents/delete/${id}`, { method: "DELETE" });
    if (r.success || r.ok) { toast.success("Document deleted!"); load(); }
    else toast.error(r.message || "Failed");
  });

  const restore = async (id) => {
    const r = await api(`/project-documents/restore/${id}`, { method: "POST" });
    if (r.success || r.ok) { toast.success("Document restored!"); load(); }
    else toast.error(r.message || "Failed");
  };

  const fmtSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const EXT_COLORS = { pdf: "#EF4444", png: "#3B82F6", jpg: "#3B82F6", jpeg: "#3B82F6", doc: "#2563EB", docx: "#2563EB", xls: "#16A34A", xlsx: "#16A34A", zip: "#D97706", default: "#8B5CF6" };
  const extColor = (type) => EXT_COLORS[type?.toLowerCase()] || EXT_COLORS.default;

  return (
   <div>
  {Dialog}
  {viewDoc && <FileViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />}

  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-sm font-bold text-gray-800">Project Documents</h3>
      <p className="text-xs text-gray-400 mt-0.5">{docs.length} document{docs.length !== 1 ? "s" : ""} uploaded</p>
    </div>
    <button
      onClick={() => fileRef.current?.click()} disabled={uploading}
      className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition shadow-sm disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
      onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
      onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
      {uploading
        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
      {uploading ? "Uploading…" : "Upload"}
    </button>
    <input ref={fileRef} type="file" multiple className="hidden" onChange={upload} />
  </div>

  {loading ? (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : docs.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg className="w-14 h-14 mb-3 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p className="text-sm font-semibold text-gray-500 mb-1">No documents yet</p>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition mt-3"
        style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
        onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
        onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Upload Document
      </button>
    </div>
  ) : (
    <div className="space-y-2.5">
      {docs.map((doc) => {
        const isDeleted = !!doc.deleted_at;
        const uploader = doc.uploader;
        return (
          <div key={doc.id}
            onClick={() => !isDeleted && setViewDoc(doc)}
            className={cx("flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-orange-100 hover:shadow-sm transition-all group", isDeleted && "opacity-50")}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ backgroundColor: extColor(doc.document_type) }}>
              {(doc.document_type || "?").toUpperCase().slice(0, 4)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{doc.document_name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">{fmtSize(doc.file_size)}</span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">{fmtDate(doc.uploaded_at)}</span>
                {uploader && <><span className="text-gray-200">·</span><span className="text-xs text-gray-400">{uploader.first_name} {uploader.last_name}</span></>}
                {isDeleted && <span className="text-[11px] bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded-full">Deleted</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
              {!isDeleted && (
                <button
                  onClick={(e) => { e.stopPropagation(); setViewDoc(doc); }}
                  className="p-2 hover:bg-orange-50 rounded-lg text-gray-400 hover:text-orange-500 transition"
                  title="View">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              )}
              {!isDeleted ? (
                <button
                  onClick={(e) => { e.stopPropagation(); del(doc.id); }}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); restore(doc.id); }}
                  className="p-2 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition"
                  title="Restore">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
  );
}

// ═══════════════════════════════════════════════════════
//  SETTINGS TAB
// ═══════════════════════════════════════════════════════
function SettingsTab({ project, onRefresh, deals, users, projectMembers = [], toast }) {
  const [status, setStatus]       = useState(project?.status || "planning");
  const [statusLoading, setStatL] = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [editLoading, setEditL]   = useState(false);
  const { confirm, Dialog }       = useConfirm();

  const updateStatus = async () => {
    setStatL(true);
    const r = await api(`/project/update-status/${project.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setStatL(false);
    if (r.success || r.ok) { toast.success("Status updated!"); onRefresh(); }
    else toast.error(r.message || "Failed");
  };

  const updateProject = async (form) => {
    setEditL(true);
    const payload = { ...form };
    delete payload.deal_id; delete payload.lead_id; delete payload.client_id;
    ['start_date', 'end_date', 'actual_end_date'].forEach(field => {
      if (!payload[field] || payload[field] === '' || payload[field] === 'Invalid date') payload[field] = null;
    });
    const r = await api(`/project/update/${project.id}`, { method: "PUT", body: JSON.stringify(payload) });
    setEditL(false);
    if (r.success || r.ok) { toast.success("Project updated!"); setEditOpen(false); onRefresh(); }
    else toast.error(r.message || "Failed");
  };

  const deleteProject = () => confirm("Delete this project permanently?", async () => {
    const r = await api(`/project/delete/${project.id}`, { method: "DELETE" });
    if (r.success || r.ok) { toast.success("Project deleted!"); window.location.href = "/projects/all"; }
    else toast.error(r.message || "Failed");
  });

  const restoreProject = async () => {
    const r = await api(`/project/restore/${project.id}`, { method: "POST" });
    if (r.success || r.ok) { toast.success("Project restored!"); onRefresh(); }
    else toast.error(r.message || "Failed");
  };

  return (
 <div className="space-y-5">
  {Dialog}

  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h4 className="font-bold text-gray-800 text-sm mb-3">Update Project Status</h4>
    <div className="flex gap-2">
      <select className={cx(selectCls, "flex-1")} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="planning">Planning</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="on_hold">On Hold</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button
        onClick={updateStatus} disabled={statusLoading}
        className="px-5 py-2 text-white text-sm font-bold rounded-lg transition disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
        onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
        onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
        {statusLoading ? "…" : "Update"}
      </button>
    </div>
  </div>

  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <h4 className="font-bold text-gray-800 text-sm mb-1">Edit Project Details</h4>
    <p className="text-xs text-gray-400 mb-3">Modify project name, dates, budget, and more.</p>
    <button
      onClick={() => setEditOpen(true)}
      className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 text-sm font-semibold rounded-lg hover:bg-orange-50 transition">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit Project
    </button>
  </div>

  <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
    <h4 className="font-bold text-red-600 text-sm mb-1">Danger Zone</h4>
    <p className="text-xs text-gray-400 mb-4">These actions are irreversible.</p>
    <div className="flex flex-wrap gap-2">
      <button onClick={deleteProject} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
        Delete Project
      </button>
      {project?.deleted_at && (
        <button onClick={restoreProject} className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          Restore Project
        </button>
      )}
    </div>
  </div>

  <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit Project" width="max-w-lg">
    <ProjectForm
      key={`edit-${project.id}-${project.status}`}
      initial={project}
      deals={deals}
      users={
        projectMembers.length > 0
          ? projectMembers
              .map((m) => m.user || m)
              .filter((u) => u && (
                (m => m?.role_in_project?.toLowerCase().includes("manager") || m?.role_in_project?.toLowerCase().includes("lead"))
                (projectMembers.find((m) => (m.user?.id || m.id) === u.id))
              ))
              .concat(
                projectMembers
                  .map((m) => m.user || m)
                  .filter((u) => u && (
                    (m => m?.role_in_project?.toLowerCase().includes("manager") || m?.role_in_project?.toLowerCase().includes("lead"))
                    (projectMembers.find((m) => (m.user?.id || m.id) === u.id))
                  )).length === 0
                  ? projectMembers.map((m) => m.user || m).filter(Boolean)
                  : []
              )
          : users
      }
      onSubmit={updateProject}
      submitting={editLoading}
    />
  </Drawer>
</div>
  );
}


function ProjectTaskContent() {
  const searchParams = useSearchParams();
  const projectId    = searchParams.get("id");

  const [project,     setProject]     = useState(null);
  const [users,       setUsers]       = useState([]);
  const [deals,       setDeals]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [tab,         setTab]         = useState("tasks");
  const [taskStats,   setTaskStats]   = useState({ total: 0, completed: 0, inProgress: 0 });
  const [memberCount, setMemberCount] = useState(0);
  const [projectMembers, setProjectMembers] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // ADD THIS for calendar
  const toast = useToast();

  const loadProject = useCallback(async () => {
    if (!projectId) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    const [pr, ur, dr] = await Promise.all([
      api(`/project/${projectId}`),
      api("/auth/all"),
      api("/deal/all"),
    ]);
    const proj = pr.project || pr.data;
    if (!proj) { setNotFound(true); setLoading(false); return; }
    setProject(proj);
    setUsers(ur.users || ur.data || []);
    setDeals(dr.deals || dr.data || []);
    setLoading(false);
  }, [projectId]);

  const fetchTaskStats = useCallback(async () => {
    if (!projectId) return;
    const r = await api(`/project-tasks/${projectId}/all`);
    const tasks = r.data || r.tasks || [];
    setTaskStats({ 
      total: tasks.length, 
      completed: tasks.filter((t) => t.status === "completed").length, 
      inProgress: tasks.filter((t) => t.status === "in_progress").length 
    });
    setAllTasks(tasks); // ADD THIS for calendar
  }, [projectId]);

  const fetchMemberCount = useCallback(async () => {
    if (!projectId) return;
    const r = await api(`/project/members/${projectId}`);
    const members = (r.members || r.data || []).filter(Boolean);
    setMemberCount(members.length);
    setProjectMembers(members);
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);
  useEffect(() => { fetchTaskStats(); fetchMemberCount(); }, [fetchTaskStats, fetchMemberCount]);
  useEffect(() => { 
    const h = () => fetchMemberCount(); 
    window.addEventListener("memberCountChanged", h); 
    return () => window.removeEventListener("memberCountChanged", h); 
  }, [fetchMemberCount]);
  useEffect(() => { 
    const h = () => fetchTaskStats(); 
    window.addEventListener("taskStatsChanged", h); 
    return () => window.removeEventListener("taskStatsChanged", h); 
  }, [fetchTaskStats]);

  const TABS = [
    { id: "tasks",     label: "Tasks",     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { id: "members",   label: "Members",   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg> },
    { id: "documents", label: "Documents", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { id: "calendar",  label: "Calendar",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: "analytics", label: "Analytics", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: "settings",  label: "Settings",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !project) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-gray-400">
      <svg className="w-16 h-16 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <p className="text-base font-semibold text-gray-500 mb-1">Project not found</p>
      <p className="text-sm mb-5">The project ID may be invalid or missing.</p>
      <Link href="/projects/all" className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back to Projects
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Toasts list={toast.list} />

      {/* Sticky Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/projects/all" className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-800 truncate">{project.name}</h1>
            <p className="text-xs text-gray-400 truncate hidden sm:block">{project.description || ""}</p>
          </div>
          {(() => {
            const m = PROJECT_STATUS_MAP[project.status] || { label: project.status, bg: "bg-gray-100", text: "text-gray-600" };
            return <span className={cx("px-2.5 py-1 rounded-md text-xs font-bold tracking-wide shrink-0", m.bg, m.text)}>{m.label}</span>;
          })()}
        </div>
          {tab === "tasks" && (
  <button onClick={() => window.dispatchEvent(new CustomEvent("openNewTask"))}
    className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition shrink-0"
    style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
    onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)"}
    onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
    <span className="hidden sm:inline">New Task</span>
  </button>
)}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Tasks"  value={taskStats.total}     valueColor="text-gray-800" />
            <StatCard label="Completed"    value={taskStats.completed}  valueColor="text-green-600" />
            <StatCard label="In Progress"  value={taskStats.inProgress} valueColor="text-orange-500" />
            <StatCard label="Team Members" value={memberCount}          valueColor="text-blue-600" />
          </div>

          {/* Project info strip */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 shadow-sm flex flex-wrap gap-4 text-xs text-gray-500">
            <div><span className="font-semibold text-gray-700">Type: </span>{project.project_type || "—"}</div>
            <div><span className="font-semibold text-gray-700">Priority: </span>
              <span className={cx(PRIORITY_MAP[project.priority]?.text || "")}>{(project.priority || "").toUpperCase()}</span>
            </div>
            <div><span className="font-semibold text-gray-700">Budget: </span>{fmtMoney(project.budget, project.currency)}</div>
            <div><span className="font-semibold text-gray-700">Start: </span>{fmtDate(project.start_date)}</div>
            <div><span className="font-semibold text-gray-700">End: </span>{fmtDate(project.end_date)}</div>
            <div className="flex-1">
              <div className="flex justify-between mb-1"><span className="font-semibold text-gray-700">Progress</span><span className="font-bold text-gray-800">{project.progress_percentage || 0}%</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, project.progress_percentage || 0))}%` }} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100 mb-5 overflow-x-auto">
            <div className="flex gap-0.5 min-w-max">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cx("flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-b-2 whitespace-nowrap",
                    tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {tab === "tasks"     && <TasksWrap projectId={project.id} users={users} toast={toast} />}
          {tab === "members"   && <MembersTab projectId={project.id} users={users} toast={toast} />}
          {tab === "documents" && <DocumentsTab projectId={project.id} toast={toast} />}
          {tab === "calendar"  && <CalendarTab project={project} projectMembers={projectMembers} tasks={allTasks} />}
          {tab === "analytics" && <AnalyticsTab project={project} />}
          {/* {tab === "settings"  && <SettingsTab project={project} onRefresh={loadProject} deals={deals} users={users} toast={toast} />} */}
          {tab === "settings"  && <SettingsTab project={project} onRefresh={loadProject} deals={deals} users={users} projectMembers={projectMembers} toast={toast} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  DEFAULT EXPORT
// ═══════════════════════════════════════════════════════
export default function ProjectTaskPage() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes toastIn { from { opacity:0; transform:translateY(-8px) scale(.96); } to { opacity:1; transform:none; } }
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ProjectTaskContent />
      </Suspense>
    </div>
  );
}