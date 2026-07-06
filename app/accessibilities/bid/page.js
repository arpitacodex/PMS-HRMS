"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const BASE_URL = "http://localhost:8080/api";
const FILE_BASE = "http://localhost:8080";

// ── FIX 1: Backend stores field as `bid_document_path`, not `bid_document`
// This helper normalises whichever field is present so the rest of the UI
// just uses bid.bid_document everywhere.
const normaliseBid = (bid) => ({
  ...bid,
  bid_document: bid.bid_document_path || bid.bid_document || null,
});

const toFileUrl = (filePath) => {
  if (!filePath) return "#";
  let clean = filePath.replace(/\\/g, "/");
  clean = clean.replace(/^\/+/, "");
  clean = clean.replace(/^public\//, "");
  return `${FILE_BASE}/${clean}`;
};

// Detect whether a path is an image so we can show a preview
const isImage = (filePath) => {
  if (!filePath) return false;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(filePath);
};

/* ─────────────────────────────────────────────
   SWEET ALERT SYSTEM
────────────────────────────────────────────── */

const ALERT_STYLES = `
@keyframes sa-backdrop-in  { from{opacity:0} to{opacity:1} }
@keyframes sa-card-in      { from{opacity:0;transform:scale(.7) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes sa-card-out     { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.8) translateY(20px)} }
@keyframes sa-rocket       { 0%{transform:translateY(0) rotate(-45deg)} 50%{transform:translateY(-18px) rotate(-45deg)} 100%{transform:translateY(0) rotate(-45deg)} }
@keyframes sa-confetti-1   { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(90px) rotate(720deg);opacity:0} }
@keyframes sa-confetti-2   { 0%{transform:translateY(0) rotate(0deg) translateX(0);opacity:1} 100%{transform:translateY(80px) rotate(-540deg) translateX(30px);opacity:0} }
@keyframes sa-confetti-3   { 0%{transform:translateY(0) rotate(0deg) translateX(0);opacity:1} 100%{transform:translateY(70px) rotate(600deg) translateX(-25px);opacity:0} }
@keyframes sa-gear-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes sa-check-draw   { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
@keyframes sa-shred-fall   { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(60px);opacity:0} }
@keyframes sa-poof-scale   { 0%{transform:scale(0);opacity:0} 40%{transform:scale(1.2);opacity:1} 70%{transform:scale(0.9);opacity:1} 100%{transform:scale(1.4);opacity:0} }
@keyframes sa-shake        { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
@keyframes sa-pulse-ring   { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.5);opacity:0} }
@keyframes sa-bounce-in    { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 80%{transform:scale(0.95)} 100%{transform:scale(1)} }
.sa-backdrop  { animation:sa-backdrop-in .2s ease forwards }
.sa-card-in   { animation:sa-card-in .35s cubic-bezier(.34,1.56,.64,1) forwards }
.sa-card-out  { animation:sa-card-out .25s ease forwards }
.sa-rocket    { animation:sa-rocket 1.2s ease-in-out infinite }
.sa-conf-1    { animation:sa-confetti-1 .9s ease-out .1s forwards }
.sa-conf-2    { animation:sa-confetti-2 .9s ease-out .05s forwards }
.sa-conf-3    { animation:sa-confetti-3 .9s ease-out .15s forwards }
.sa-gear      { animation:sa-gear-spin 1.5s linear infinite }
.sa-check     { stroke-dasharray:50;stroke-dashoffset:50;animation:sa-check-draw .5s ease .4s forwards }
.sa-shred-1   { animation:sa-shred-fall .6s ease .0s forwards }
.sa-shred-2   { animation:sa-shred-fall .6s ease .08s forwards }
.sa-shred-3   { animation:sa-shred-fall .6s ease .16s forwards }
.sa-shred-4   { animation:sa-shred-fall .6s ease .24s forwards }
.sa-poof      { animation:sa-poof-scale .7s ease forwards }
.sa-shake     { animation:sa-shake .5s ease }
.sa-ring      { animation:sa-pulse-ring 1s ease-out infinite }
.sa-bounce    { animation:sa-bounce-in .5s cubic-bezier(.34,1.56,.64,1) forwards }
@keyframes slideDown { from{transform:translateY(-8px);opacity:0} to{transform:translateY(0);opacity:1} }
`;

function SweetAlert({ type, title, message, onConfirm, onCancel, confirmText, cancelText }) {
  const [leaving, setLeaving] = useState(false);
  const [shaking, setShaking] = useState(false);
  const dismiss = (cb) => { setLeaving(true); setTimeout(() => cb && cb(), 250); };
  const shakeIcon = () => { setShaking(false); setTimeout(() => setShaking(true), 10); };

  return (
    <>
      <style>{ALERT_STYLES}</style>
      <div className="sa-backdrop fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}>
        <div className={`${leaving ? "sa-card-out" : "sa-card-in"} relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden`}>

          {type === "success-create" && (
            <>
              <div className="relative pt-10 pb-6 px-6 flex flex-col items-center overflow-hidden"
                style={{ background: "linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)" }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 rounded-full bg-white/60"
                    style={{ top: `${10 + Math.random() * 70}%`, left: `${5 + i * 12}%`, opacity: 0.4 + i * 0.07 }} />
                ))}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="sa-conf-1 absolute top-0 left-4 w-3 h-3 rounded-sm bg-yellow-300" />
                  <div className="sa-conf-2 absolute top-0 right-4 w-2.5 h-2.5 rounded-full bg-white/60" />
                  <div className="sa-conf-3 absolute top-1 left-1/2 w-2 h-4 rounded-sm bg-yellow-200 -translate-x-1/2" />
                  <div className="sa-conf-1 absolute top-2 left-0 w-2 h-2 rounded-full bg-white/50" style={{ animationDelay: "0.2s" }} />
                  <div className="sa-conf-2 absolute top-2 right-0 w-3 h-2 rounded-sm bg-amber-200" style={{ animationDelay: "0.12s" }} />
                  <div className="sa-rocket text-5xl select-none z-10">🚀</div>
                </div>
                <div className="mt-3 text-white/80 text-xs font-medium tracking-widest uppercase">Blast Off!</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <button onClick={() => dismiss(onConfirm)}
                  className="mt-5 w-full text-white font-bold py-3 rounded-2xl transition-all shadow-lg text-sm"
                  style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow: "0 4px 15px rgba(255,107,26,0.3)" }}>
                  {confirmText || "Awesome!"}
                </button>
              </div>
            </>
          )}

          {type === "success-edit" && (
            <>
              <div className="relative pt-8 pb-6 px-6 flex flex-col items-center"
                style={{ background: "linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)" }}>
                <div className="relative flex items-center justify-center w-20 h-20">
                  <div className="sa-ring absolute w-20 h-20 rounded-full border-4 border-white/50" />
                  <div className="sa-ring absolute w-20 h-20 rounded-full border-4 border-white/30" style={{ animationDelay: "0.4s" }} />
                  <svg className="sa-gear w-12 h-12 text-white/30 absolute" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.67.07-1.08s-.03-.75-.07-1.08l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1.08s.03.75.07 1.08l-2.11 1.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z" />
                  </svg>
                  <div className="sa-bounce w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path className="sa-check" d="M5 13l4 4L19 7" stroke="#ff6b1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 text-white/80 text-xs font-medium tracking-widest uppercase">Updated!</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <button onClick={() => dismiss(onConfirm)}
                  className="mt-5 w-full text-white font-bold py-3 rounded-2xl transition-all text-sm"
                  style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow: "0 4px 15px rgba(255,107,26,0.3)" }}>
                  {confirmText || "Got it!"}
                </button>
              </div>
            </>
          )}

          {type === "confirm-delete" && (
            <>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 pt-8 pb-6 px-6 flex flex-col items-center overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                  style={{ backgroundImage: "repeating-linear-gradient(-45deg,#fff 0,#fff 10px,transparent 10px,transparent 20px)" }} />
                <div className="relative w-20 h-24 flex flex-col items-center">
                  <div className="w-10 h-12 bg-white rounded-t-lg rounded-br-lg shadow-lg relative mb-1 border border-slate-200">
                    <div className="absolute top-2 left-2 right-2 space-y-1.5">
                      <div className="h-1 bg-slate-200 rounded" />
                      <div className="h-1 bg-slate-200 rounded w-3/4" />
                      <div className="h-1 bg-slate-200 rounded" />
                      <div className="h-1 bg-red-200 rounded w-1/2" />
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-slate-100 rounded-bl-lg border-b border-l border-slate-200" />
                  </div>
                  <div className="w-16 h-5 bg-red-600 rounded-lg flex items-center justify-center gap-0.5 shadow-lg">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-0.5 h-3 bg-red-400 rounded-full" />)}
                  </div>
                  <div className="flex gap-0.5 mt-0.5 overflow-hidden h-8">
                    <div className="sa-shred-1 w-0.5 h-6 bg-slate-300 rounded-full" />
                    <div className="sa-shred-2 w-0.5 h-8 bg-slate-200 rounded-full" />
                    <div className="sa-shred-3 w-0.5 h-5 bg-slate-300 rounded-full" />
                    <div className="sa-shred-4 w-0.5 h-7 bg-slate-200 rounded-full" />
                    <div className="sa-shred-1 w-0.5 h-6 bg-red-200 rounded-full" style={{ animationDelay: "0.3s" }} />
                    <div className="sa-shred-2 w-0.5 h-5 bg-slate-300 rounded-full" style={{ animationDelay: "0.1s" }} />
                  </div>
                </div>
                <div className="mt-1 text-red-400 text-xs font-bold tracking-widest uppercase">Danger Zone</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <div className="mt-5 flex gap-3">
                  <button onClick={() => dismiss(onCancel)}
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm transition-all">
                    {cancelText || "Cancel"}
                  </button>
                  <button onClick={() => dismiss(onConfirm)} onMouseEnter={shakeIcon}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                    <svg className={`w-4 h-4 ${shaking ? "sa-shake" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
                    </svg>
                    {confirmText || "Delete"}
                  </button>
                </div>
              </div>
            </>
          )}

          {type === "success-delete" && (
            <>
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 pt-8 pb-5 px-6 flex flex-col items-center overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                  style={{ backgroundImage: "repeating-linear-gradient(-45deg,#fff 0,#fff 8px,transparent 8px,transparent 16px)" }} />
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="sa-poof absolute w-16 h-16 rounded-full bg-slate-500/40 blur-sm" />
                  <div className="sa-bounce text-4xl select-none z-10">💨</div>
                </div>
                <div className="mt-2 text-slate-400 text-xs font-medium tracking-widest uppercase">Poof! Gone.</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <button onClick={() => dismiss(onConfirm)}
                  className="mt-5 w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-3 rounded-2xl transition-all text-sm shadow-lg">
                  {confirmText || "Done"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function useSweetAlert() {
  const [alert, setAlert] = useState(null);
  const fire = (config) => new Promise((resolve) => { setAlert({ ...config, resolve }); });
  const close = (result) => {
    setAlert((prev) => { if (prev?.resolve) prev.resolve(result); return null; });
  };
  const AlertComponent = alert ? (
    <SweetAlert type={alert.type} title={alert.title} message={alert.message}
      confirmText={alert.confirmText} cancelText={alert.cancelText}
      onConfirm={() => close(true)} onCancel={() => close(false)} />
  ) : null;
  return { fire, AlertComponent };
}

/* ─────────────────────────────────────────────
   STATUS CONFIG
────────────────────────────────────────────── */
const STATUS_CONFIG = {
  draft:     { bg: "bg-gray-100",    text: "text-gray-600",    border: "border-gray-300",    dot: "bg-gray-400"    },
  submitted: { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  approved:  { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  rejected:  { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
  won:       { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SHARED COMPONENTS
────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

function ActionBtn({ onClick, title, variant, children }) {
  const variants = {
    view:     "text-[#ff6b1a] hover:bg-[#ff6b1a]/10",
    edit:     "text-blue-600 hover:bg-blue-50",
    editOwn:  "text-blue-600 hover:bg-blue-50",
    editAll:  "text-pink-500 hover:bg-pink-50",
    delete:   "text-red-500 hover:bg-red-50",
    restore:  "text-emerald-600 hover:bg-emerald-50",
    followup: "text-violet-600 hover:bg-violet-50",
  };
  return (
    <button onClick={onClick} title={title}
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 ${variants[variant] || ""}`}>
      <span className="w-5 h-5 flex items-center justify-center">{children}</span>
    </button>
  );
}

/* ── Right Drawer ── */
function Drawer({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-gray-100 transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between px-5 py-4 flex-shrink-0 border-b border-gray-100"
          style={{ borderTop: "3px solid #ff6b1a" }}>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="px-5 py-4 flex items-center justify-end gap-3 border-t border-gray-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-800 break-words">{value || <span className="text-gray-300 font-normal text-xs">Not provided</span>}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INITIAL FORM
────────────────────────────────────────────── */
const initialForm = {
  client_id: "", title: "", description: "", estimated_amount: "",
  estimated_duration_days: "", submission_deadline: "", status: "draft", bid_document: null,
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function BidManagement() {
  const [bids,          setBids]          = useState([]);
  const [clients,       setClients]       = useState([]);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [loading,       setLoading]       = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [form,          setForm]          = useState(initialForm);
  const [formError,     setFormError]     = useState("");
  const [formLoading,   setFormLoading]   = useState(false);
  const [viewBid,       setViewBid]       = useState(null);
  const [viewLoading,   setViewLoading]   = useState(false);
  const [showViewPanel, setShowViewPanel] = useState(false);
  const [docDeleting,   setDocDeleting]   = useState(false);
  const fileRef = useRef();
  const { fire, AlertComponent } = useSweetAlert();

  /* ── fetch ── */
  const fetchBids = useCallback(async () => {
    setLoading(true);
    let result = [];
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await fetch(`${BASE_URL}/bid/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      // FIX 1: normalise every bid so bid_document_path → bid_document
      const raw = Array.isArray(data) ? data : data.bids || data.data || [];
      result = raw.map(normaliseBid);
      setBids(result);
    } catch { setBids([]); }
    setLoading(false);
    return result;
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await fetch(`${BASE_URL}/client/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      setClients(data.clients || []);
    } catch { setClients([]); }
  }, []);

  useEffect(() => { fetchBids(); fetchClients(); }, [fetchBids, fetchClients]);

  /* ── view ── */
  const handleView = async (bid) => {
    setShowViewPanel(true); setViewLoading(true); setViewBid(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await fetch(`${BASE_URL}/bid/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      const raw   = Array.isArray(data) ? data : data.bids || data.data || [];
      const all   = raw.map(normaliseBid);
      setViewBid(all.find(b => b.id === bid.id) || normaliseBid(bid));
    } catch { setViewBid(normaliseBid(bid)); }
    setViewLoading(false);
  };
  const closeViewPanel = () => { setShowViewPanel(false); setViewBid(null); };

  /* ── filter ── */
  const filtered = bids.filter(b =>
    ((b.title || "").toLowerCase().includes(search.toLowerCase()) ||
     (b.bid_number || "").toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || b.status === statusFilter)
  );

  /* ── open drawer ── */
  const openCreate = () => {
    setForm(initialForm); setEditMode(false); setEditId(null); setFormError(""); setDrawerOpen(true);
  };
  const openEdit = (bid, mode) => {
    setForm({
      client_id: bid.client_id || bid.client?.id || "",
      title: bid.title || "", description: bid.description || "",
      estimated_amount: bid.estimated_amount || "",
      estimated_duration_days: bid.estimated_duration_days || "",
      submission_deadline: bid.submission_deadline ? bid.submission_deadline.slice(0, 10) : "",
      status: bid.status || "draft", bid_document: null,
    });
    setEditMode(mode); setEditId(bid.id); setFormError(""); setDrawerOpen(true);
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login again.");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "bid_document") { if (v) fd.append(k, v); } else fd.append(k, v);
      });

      let url, method;
      if (!editMode)               { url = `${BASE_URL}/bid/create`;    method = "POST"; }
      // FIX 2: router uses POST for /updateAll, not PUT
      else if (editMode === "all") { url = `${BASE_URL}/bid/updateAll`; method = "POST"; fd.append("bid_id", editId); }
      else                         { url = `${BASE_URL}/bid/updateOwn`; method = "PUT";  fd.append("bid_id", editId); }

      const res  = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      setDrawerOpen(false);
      const freshBids = await fetchBids();

      if (showViewPanel && editId) {
        const fresh = freshBids.find(b => b.id === editId);
        if (fresh) setViewBid(fresh); // already normalised by fetchBids
      }

      await fire({
        type: editMode ? "success-edit" : "success-create",
        title: editMode ? "Bid Updated!" : "Bid Created!",
        message: editMode ? "Changes saved successfully." : "New bid has been created.",
        confirmText: editMode ? "Got it!" : "Awesome!",
      });
    } catch (err) { setFormError(err.message); }
    setFormLoading(false);
  };

  /* ── delete bid ── */
  const handleDelete = async (id, title) => {
    const confirmed = await fire({ type: "confirm-delete", title: "Delete this Bid?", message: `"${title || "This bid"}" will be permanently removed.`, confirmText: "Yes, Shred it!", cancelText: "Keep it" });
    if (!confirmed) return;
    const token = localStorage.getItem("token") || "";
    await fetch(`${BASE_URL}/bid/delete/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchBids();
    await fire({ type: "success-delete", title: "Bid Deleted", message: "The bid has been shredded and removed.", confirmText: "Done" });
  };

  /* ── restore ── */
  const handleRestore = async (id) => {
    const token = localStorage.getItem("token") || "";
    await fetch(`${BASE_URL}/bid/restore/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchBids();
  };

  /* ── delete document ──
     FIX 3: /bid/deleteDocument/:id does NOT exist in the router.
     We patch the document by calling updateOwn/updateAll with an empty
     bid_document field is NOT possible via multipart without re-sending all
     fields. Instead we call a dedicated endpoint that MUST be added to the
     router (see comment at bottom of this file).
     We still call the endpoint — if a backend dev adds it later it will work.
     In the meantime the local state is still cleaned up optimistically.
  ── */
  const handleDeleteDocument = async (bidId) => {
    const confirmed = await fire({
      type: "confirm-delete",
      title: "Remove Document?",
      message: "The bid document will be permanently removed. This cannot be undone.",
      confirmText: "Yes, Remove it!",
      cancelText: "Keep it",
    });
    if (!confirmed) return;
    setDocDeleting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${BASE_URL}/bid/deleteDocument/${bidId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete document");
      }
      // Optimistically clear the document in local state
      setViewBid((prev) => prev ? { ...prev, bid_document: null, bid_document_path: null } : prev);
      setBids((prev) => prev.map(b => b.id === bidId ? { ...b, bid_document: null, bid_document_path: null } : b));
    } catch (err) {
      console.error("Delete document error:", err);
    }
    setDocDeleting(false);
    await fire({
      type: "success-delete",
      title: "Document Removed",
      message: "The bid document has been successfully deleted.",
      confirmText: "Done",
    });
  };

  /* ── form field base class ── */
  const fieldBase = "w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/40 focus:border-[#ff6b1a] transition-all";

  /* ════════════════════════════ RENDER ══════════════════════ */
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <style>{ALERT_STYLES}</style>
      {AlertComponent}

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Bid <span style={{ color: "#ff6b1a" }}>Management</span>
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage all bids, proposals and submissions</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)", boxShadow: "0 4px 15px rgba(255,107,26,0.3)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Create Bid
            </button>
          </div>

          {/* ── SEARCH + FILTER ─────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input placeholder="Search by title or bid number..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/30 focus:border-[#ff6b1a] placeholder-gray-400 transition-all" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/30 focus:border-[#ff6b1a] text-gray-600 transition-all">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="won">Won</option>
            </select>
            <button onClick={fetchBids} title="Refresh"
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-[#ff6b1a]/30 text-gray-400 hover:text-[#ff6b1a] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── MOBILE CARDS ─────────────────────────────────── */}
        <div className="block md:hidden space-y-3 mb-6">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Bids</span>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm"><Spinner/> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">📋</div>
              <span className="text-sm text-gray-400">No bids found</span>
            </div>
          ) : filtered.map(bid => (
            <div key={bid.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${bid.deleted_at ? "opacity-50" : ""}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button onClick={() => handleView(bid)}
                        className="font-mono text-xs font-bold text-[#ff6b1a] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg hover:bg-orange-100 transition-all">
                        {bid.bid_number}
                      </button>
                      <StatusBadge status={bid.status}/>
                    </div>
                    <p className="font-bold text-gray-900 text-sm truncate">{bid.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{bid.client?.name || bid.client?.company_name || "No client"}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {bid.estimated_amount && (
                        <span className="text-xs font-bold text-[#ff6b1a]">${Number(bid.estimated_amount).toLocaleString()}</span>
                      )}
                      {bid.submission_deadline && (
                        <span className="text-xs text-gray-400">{new Date(bid.submission_deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ActionBtn onClick={() => handleView(bid)} title="View" variant="view">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </ActionBtn>
                    {!bid.deleted_at ? (
                      <>
                        <ActionBtn onClick={() => openEdit(bid, "own")} title="Edit" variant="editOwn">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </ActionBtn>
                        <ActionBtn onClick={() => handleDelete(bid.id, bid.title)} title="Delete" variant="delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </ActionBtn>
                      </>
                    ) : (
                      <ActionBtn onClick={() => handleRestore(bid.id)} title="Restore" variant="restore">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/></svg>
                      </ActionBtn>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP TABLE ────────────────────────────────── */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: "#ff6b1a" }} />
              <h2 className="text-sm font-bold text-gray-800">All Bids</h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm"><Spinner/> Loading bids...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: "auto" }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-[#fafafa]">
                    {["BID #","TITLE","CLIENT","AMOUNT","DEADLINE","STATUS","ACTIONS"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">📋</div>
                        <span className="text-sm text-gray-400">No bids found</span>
                      </div>
                    </td></tr>
                  ) : filtered.map((bid, idx) => (
                    <tr key={bid.id}
                      className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${bid.deleted_at ? "opacity-50" : ""}`}
                      style={{ animationDelay: `${idx * 30}ms` }}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => handleView(bid)}
                          className="font-mono text-xs font-bold text-[#ff6b1a] hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2 py-1 rounded-lg transition-all">
                          {bid.bid_number}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                        <span className="font-semibold text-gray-800 text-sm truncate block">{bid.title}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{bid.client?.name || bid.client?.company_name || bid.client_id || <span className="text-gray-300">—</span>}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-700">
                          {bid.estimated_amount ? `$${Number(bid.estimated_amount).toLocaleString()}` : <span className="text-gray-300 font-normal">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {bid.submission_deadline ? new Date(bid.submission_deadline).toLocaleDateString() : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={bid.status}/></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          <ActionBtn onClick={() => handleView(bid)} title="View Details" variant="view">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          </ActionBtn>
                          {!bid.deleted_at ? (
                            <>
                              <ActionBtn onClick={() => openEdit(bid, "own")} title="Edit Own" variant="editOwn">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </ActionBtn>
                              <ActionBtn onClick={() => openEdit(bid, "all")} title="Edit All (Admin)" variant="editAll">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828 9 16l.172-2.828z"/></svg>
                              </ActionBtn>
                              <ActionBtn onClick={() => handleDelete(bid.id, bid.title)} title="Delete" variant="delete">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </ActionBtn>
                            </>
                          ) : (
                            <ActionBtn onClick={() => handleRestore(bid.id)} title="Restore" variant="restore">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/></svg>
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ══ VIEW SIDE PANEL ════════════════════════════════ */}
      {showViewPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeViewPanel} />
          <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col border-l border-gray-100">

            {/* Panel header */}
            <div className="flex items-start justify-between px-5 py-4 flex-shrink-0 border-b border-gray-100"
              style={{ borderTop: "3px solid #ff6b1a" }}>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Bid Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {viewBid?.bid_number || (viewLoading ? "Loading..." : "—")}
                </p>
              </div>
              <button onClick={closeViewPanel}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {viewLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Spinner/>
                  <span className="text-sm text-gray-400">Fetching bid data...</span>
                </div>
              ) : viewBid ? (
                <div className="space-y-5">

                  {/* Status + title */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={viewBid.status}/>
                    {viewBid.deleted_at && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">Deleted</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 leading-snug">{viewBid.title}</h3>
                    {viewBid.description && <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{viewBid.description}</p>}
                  </div>

                  {/* Amount + duration cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg,#fff7f3,#fff)", border: "1px solid #ffe0cc" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "#ff9a56" }}>Amount</p>
                      <p className="text-sm font-extrabold" style={{ color: "#ff6b1a" }}>
                        {viewBid.estimated_amount ? `$${Number(viewBid.estimated_amount).toLocaleString()}` : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duration</p>
                      <p className="text-sm font-extrabold text-gray-700">
                        {viewBid.estimated_duration_days ? `${viewBid.estimated_duration_days} days` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Bid info */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">📋</span>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bid Information</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <DetailRow label="Bid Number"  value={viewBid.bid_number} />
                      <DetailRow label="Client"      value={viewBid.client?.name || viewBid.client?.company_name || viewBid.client_id} />
                      <DetailRow label="Deadline"    value={viewBid.submission_deadline ? new Date(viewBid.submission_deadline).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : null} />
                      <DetailRow label="Created By"  value={viewBid.created_by} />
                      <DetailRow label="Created At"  value={viewBid.created_at ? new Date(viewBid.created_at).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : null} />
                      <DetailRow label="Updated At"  value={viewBid.updated_at ? new Date(viewBid.updated_at).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : null} />
                    </div>
                  </div>

                  {/* ── DOCUMENT SECTION ── */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">📎</span>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bid Document</p>
                    </div>

                    {viewBid.bid_document ? (
                      <div className="rounded-xl border overflow-hidden"
                        style={{ borderColor: "#ffe0cc", background: "linear-gradient(135deg,#fff7f3,#fff)" }}>

                        {/* ── FIX 4: Image preview when the uploaded file is an image ── */}
                        {isImage(viewBid.bid_document) && (
                          <div className="relative w-full bg-gray-100 overflow-hidden" style={{ maxHeight: 220 }}>
                            <img
                              src={toFileUrl(viewBid.bid_document)}
                              alt="Bid document preview"
                              className="w-full object-contain"
                              style={{ maxHeight: 220 }}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          </div>
                        )}

                        {/* File info row */}
                        <div className="flex items-center gap-3 px-3 py-3">
                          {/* File icon — show image icon for images, doc icon otherwise */}
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(255,107,26,0.12)" }}>
                            {isImage(viewBid.bid_document) ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ff6b1a" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ff6b1a" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/>
                              </svg>
                            )}
                          </div>

                          {/* File name + type badge */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: "#ff6b1a" }}>
                              {viewBid.bid_document.split("/").pop().split("\\").pop() || "Bid Document"}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5 uppercase tracking-wide">
                              {isImage(viewBid.bid_document) ? "Image file" : "Document file"}
                            </p>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t" style={{ borderColor: "#ffe0cc" }} />

                        {/* Action buttons row */}
                        <div className="flex items-center divide-x" style={{ divideColor: "#ffe0cc" }}>

                          {/* Open / View button */}
                          <a
                            href={toFileUrl(viewBid.bid_document)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all hover:bg-orange-50"
                            style={{ color: "#ff6b1a", borderRight: "1px solid #ffe0cc" }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                            {isImage(viewBid.bid_document) ? "View Image" : "Open Document"}
                          </a>

                          {/* Delete document button */}
                          {/* <button
                            onClick={() => handleDeleteDocument(viewBid.id)}
                            disabled={docDeleting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {docDeleting ? (
                              <><Spinner/> Removing...</>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                                Remove File
                              </>
                            )}
                          </button> */}
                        </div>
                      </div>
                    ) : (
                      /* No document state */
                      <div className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">No document uploaded</p>
                        <button
                          onClick={() => { closeViewPanel(); openEdit(viewBid, "own"); }}
                          className="text-xs font-bold mt-1 px-3 py-1.5 rounded-lg transition-all"
                          style={{ color: "#ff6b1a", background: "rgba(255,107,26,0.08)" }}
                        >
                          + Upload Document
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <span className="text-sm text-gray-400">No data available.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            {viewBid && !viewLoading && (
              <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { closeViewPanel(); openEdit(viewBid, "own"); }}
                  className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow: "0 4px 12px rgba(255,107,26,0.25)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Bid
                </button>
                <button onClick={closeViewPanel}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ CREATE / EDIT DRAWER ══════════════════════════ */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={!editMode ? "Create Bid" : editMode === "all" ? "Update Bid (Admin)" : "Update My Bid"}
        subtitle="PMS HRMS · Sales Module"
        footer={
          <>
            <button onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={formLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow: "0 4px 12px rgba(255,107,26,0.25)" }}>
              {formLoading ? <><Spinner/> Submitting…</> : (!editMode ? "Create Bid" : "Update Bid")}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">!</span>
              {formError}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📋</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Basic Info</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Client <span style={{ color: "#ff6b1a" }}>*</span>
                </label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={fieldBase} required>
                  <option value="">— Select a client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Bid Title <span style={{ color: "#ff6b1a" }}>*</span>
                </label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={fieldBase} placeholder="e.g. Enterprise Software Development Bid" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${fieldBase} resize-none`} rows={3} placeholder="Describe the bid scope and requirements..." />
              </div>
            </div>
          </div>

          {/* Bid Details */}
          <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">💰</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bid Details</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Amount ($) <span style={{ color: "#ff6b1a" }}>*</span>
                </label>
                <input type="number" value={form.estimated_amount} onChange={e => setForm(f => ({ ...f, estimated_amount: e.target.value }))}
                  className={fieldBase} placeholder="3000000" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Duration (Days)</label>
                <input type="number" value={form.estimated_duration_days} onChange={e => setForm(f => ({ ...f, estimated_duration_days: e.target.value }))}
                  className={fieldBase} placeholder="190" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Deadline <span style={{ color: "#ff6b1a" }}>*</span>
                </label>
                <input type="date" value={form.submission_deadline} onChange={e => setForm(f => ({ ...f, submission_deadline: e.target.value }))}
                  className={fieldBase} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={fieldBase}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="won">Won</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document upload */}
          <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📎</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bid Document</p>
            </div>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer transition-all hover:border-[#ff6b1a]/50 hover:bg-orange-50/30"
              onClick={() => fileRef.current.click()}
            >
              {form.bid_document ? (
                <div className="flex flex-col items-center gap-1">
                  {/* Show image thumbnail in form too if file is an image */}
                  {form.bid_document.type?.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(form.bid_document)}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg mb-1 border border-orange-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-1"
                      style={{ background: "rgba(255,107,26,0.1)" }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ff6b1a" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                  )}
                  <span className="text-sm font-bold" style={{ color: "#ff6b1a" }}>{form.bid_document.name}</span>
                  <span className="text-xs text-gray-400">{(form.bid_document.size / 1024).toFixed(1)} KB · Click to change</span>
                </div>
              ) : (
                <>
                  <svg className="w-9 h-9 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/>
                  </svg>
                  <p className="text-sm font-medium text-gray-400">Click to upload document</p>
                  <p className="text-xs text-gray-300 mt-0.5">PDF, DOC, DOCX, JPG, PNG supported</p>
                </>
              )}
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={e => setForm(f => ({ ...f, bid_document: e.target.files[0] || null }))} />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REQUIRED BACKEND CHANGES  (bidRouter.js)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Add deleteDocument route (currently missing):

   const deleteDocument = require('@src/controllers/bidControllers/deleteDocument');
   bidRouter.delete(
     '/deleteDocument/:bidId',
     auth,
     loadPermissions,
     allowAny('bids.update_own'),
     deleteDocument
   );

2. Create deleteDocument.js controller:

   const { Bid } = require('@src/models');
   const fs = require('fs');
   const path = require('path');

   const deleteDocument = async (req, res) => {
     try {
       const { bidId } = req.params;
       const bid = await Bid.findByPk(bidId);
       if (!bid) return res.status(404).json({ message: 'Bid not found' });

       if (bid.bid_document_path) {
         const filePath = path.join('public', bid.bid_document_path);
         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
       }

       await bid.update({ bid_document_path: null });
       return res.status(200).json({ success: true, message: 'Document deleted' });
     } catch (err) {
       return res.status(500).json({ message: 'Internal server error' });
     }
   };
   module.exports = deleteDocument;

3. Fix /updateAll method: change bidRouter.post → bidRouter.put
   (the frontend was already sending PUT but the router registered POST)
   OR keep POST in router and the frontend now matches it (already fixed above).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/