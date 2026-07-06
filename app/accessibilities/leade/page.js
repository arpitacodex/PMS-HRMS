"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

const BASE_URL      = "http://localhost:8080/api";
const FOLLOWUP_URL  = "http://localhost:8080/api/lead-followup";

/* ═══════════════════════════════════════════════════════════
   SWEET ALERT — orange brand theme
═══════════════════════════════════════════════════════════ */
const ALERT_CSS = `
@keyframes la-in      { from{opacity:0;transform:scale(.65) translateY(28px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes la-out     { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.78) translateY(18px)} }
@keyframes la-star    { 0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1} 100%{transform:translateY(-70px) rotate(400deg) scale(0);opacity:0} }
@keyframes la-twinkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.5)} }
@keyframes la-shoot   { 0%{transform:translateX(-30px) translateY(30px);opacity:0} 60%{opacity:1} 100%{transform:translateX(60px) translateY(-60px);opacity:0} }
@keyframes la-pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
@keyframes la-shield  { 0%{stroke-dashoffset:120} 100%{stroke-dashoffset:0} }
@keyframes la-check   { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
@keyframes la-fuse    { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
@keyframes la-shake   { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-10deg)} 40%{transform:rotate(10deg)} 60%{transform:rotate(-6deg)} 80%{transform:rotate(6deg)} }
@keyframes la-smoke1  { 0%{transform:scale(0) translateY(0);opacity:.8} 100%{transform:scale(2.5) translateY(-30px);opacity:0} }
@keyframes la-smoke2  { 0%{transform:scale(0) translateY(0);opacity:.6} 100%{transform:scale(2) translateY(-20px) translateX(15px);opacity:0} }
@keyframes la-phoenix { 0%{transform:translateY(20px) scale(.7);opacity:0} 60%{transform:translateY(-8px) scale(1.1);opacity:1} 100%{transform:translateY(0) scale(1);opacity:1} }
@keyframes la-ring    { 0%{transform:scale(.8);opacity:.9} 100%{transform:scale(1.7);opacity:0} }
@keyframes la-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
@keyframes la-backdrop{ from{opacity:0} to{opacity:1} }
@keyframes slideDown  { from{transform:translateY(-8px);opacity:0} to{transform:translateY(0);opacity:1} }
.la-backdrop {animation:la-backdrop .2s ease forwards}
.la-in       {animation:la-in .38s cubic-bezier(.34,1.56,.64,1) forwards}
.la-out      {animation:la-out .26s ease forwards}
.la-star     {animation:la-star .8s ease-out forwards}
.la-twinkle  {animation:la-twinkle 1.4s ease-in-out infinite}
.la-shoot    {animation:la-shoot .7s ease-out forwards}
.la-pulse    {animation:la-pulse 1.6s ease-in-out infinite}
.la-shield   {stroke-dasharray:120;stroke-dashoffset:120;animation:la-shield .6s ease .2s forwards}
.la-check    {stroke-dasharray:40;stroke-dashoffset:40;animation:la-check .45s ease .7s forwards}
.la-fuse     {stroke-dasharray:60;stroke-dashoffset:60;animation:la-fuse .8s ease forwards}
.la-shakeable{animation:la-shake .55s ease}
.la-smoke1   {animation:la-smoke1 .9s ease forwards}
.la-smoke2   {animation:la-smoke2 .9s ease .1s forwards}
.la-phoenix  {animation:la-phoenix .7s cubic-bezier(.34,1.56,.64,1) forwards}
.la-ring     {animation:la-ring 1.1s ease-out infinite}
.la-float    {animation:la-float 2.4s ease-in-out infinite}
`;

function LeadAlert({ type, title, message, confirmText, cancelText, onConfirm, onCancel }) {
  const [out, setOut]     = useState(false);
  const [shake, setShake] = useState(false);
  const go = (cb) => { setOut(true); setTimeout(() => cb?.(), 260); };
  const triggerShake = () => { setShake(false); setTimeout(() => setShake(true), 10); };

  const OrangeBtn = ({ onClick, children }) => (
    <button onClick={onClick}
      className="mt-5 w-full font-bold py-3 rounded-2xl transition-all text-sm active:scale-95 text-white"
      style={{ background: "linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow: "0 4px 15px rgba(255,107,26,0.3)" }}>
      {children}
    </button>
  );

  return (
    <>
      <style>{ALERT_CSS}</style>
      <div className="la-backdrop fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{ background: "rgba(10,17,40,0.6)", backdropFilter: "blur(5px)" }}>
        <div className={`${out ? "la-out" : "la-in"} relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden`}>

          {/* SUCCESS CREATE */}
          {type === "success-create" && (
            <>
              <div className="relative pt-10 pb-7 px-6 flex flex-col items-center overflow-hidden"
                style={{ background: "linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)" }}>
                {[...Array(6)].map((_,i) => (
                  <div key={i} className="la-twinkle absolute w-1 h-1 rounded-full bg-white"
                    style={{ top:`${15+i*13}%`, left:`${8+i*15}%`, animationDelay:`${i*0.22}s` }} />
                ))}
                <div className="la-shoot absolute top-4 left-4 w-16 h-0.5 bg-gradient-to-r from-transparent to-white rounded-full opacity-80" />
                <div className="la-shoot absolute top-8 left-8 w-10 h-0.5 bg-gradient-to-r from-transparent to-yellow-200 rounded-full" style={{ animationDelay:"0.18s" }} />
                <div className="la-float relative z-10 w-20 h-20 flex items-center justify-center">
                  {[...Array(5)].map((_,i) => (
                    <div key={i} className="la-star absolute text-lg"
                      style={{ top:`${20+(i%2)*30}%`, left:`${10+i*16}%`, animationDelay:`${0.05*i}s`, fontSize: i%2===0?"14px":"10px" }}>⭐</div>
                  ))}
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-lg">🎯</div>
                </div>
                <div className="mt-3 text-white/75 text-xs font-bold tracking-[0.2em] uppercase">Lead Captured!</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <OrangeBtn onClick={() => go(onConfirm)}>{confirmText || "Let's Go! 🚀"}</OrangeBtn>
              </div>
            </>
          )}

          {/* SUCCESS EDIT */}
          {type === "success-edit" && (
            <>
              <div className="relative pt-8 pb-7 px-6 flex flex-col items-center overflow-hidden"
                style={{ background: "linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)" }}>
                <div className="la-pulse relative w-20 h-20 flex items-center justify-center">
                  <div className="la-ring absolute w-20 h-20 rounded-full border-4 border-white/40" />
                  <div className="la-ring absolute w-20 h-20 rounded-full border-4 border-white/20" style={{ animationDelay:"0.5s" }} />
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
                      <path className="la-shield" d="M18 3 L32 9 L32 20 C32 27 25 32 18 34 C11 32 4 27 4 20 L4 9 Z"
                        stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
                      <path className="la-check" d="M11 18 L16 23 L25 13"
                        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 text-white/75 text-xs font-bold tracking-[0.2em] uppercase">Saved!</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <OrangeBtn onClick={() => go(onConfirm)}>{confirmText || "Perfect ✓"}</OrangeBtn>
              </div>
            </>
          )}

          {/* CONFIRM DELETE */}
          {type === "confirm-delete" && (
            <>
              <div className="relative bg-gradient-to-br from-zinc-900 via-red-950 to-zinc-900 pt-8 pb-7 px-6 flex flex-col items-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage:"repeating-linear-gradient(-55deg,#ef4444 0,#ef4444 1px,transparent 1px,transparent 12px)" }} />
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="la-ring absolute w-20 h-20 rounded-full border-2 border-red-500/40" />
                  <div className="relative w-16 h-16">
                    <svg className="absolute -top-4 left-9 w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <path className="la-fuse" d="M2 22 Q8 12 12 8 Q16 4 20 2" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="20" cy="2" r="2" fill="#fbbf24" className="la-twinkle" />
                    </svg>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 border-2 border-zinc-500 shadow-xl flex items-center justify-center ${shake ? "la-shakeable" : ""}`}
                      onMouseEnter={triggerShake}>
                      <div className="w-6 h-6 rounded-full bg-zinc-900/60 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 la-twinkle" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 text-xs font-black text-red-400 tracking-wider">BOOM?</div>
                </div>
                <div className="mt-2 text-red-400 text-xs font-bold tracking-[0.18em] uppercase">Danger Zone</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <div className="mt-5 flex gap-3">
                  <button onClick={() => go(onCancel)}
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-sm transition-all active:scale-95">
                    {cancelText || "Abort!"}
                  </button>
                  <button onClick={() => go(onConfirm)} onMouseEnter={triggerShake}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-1.5">
                    <span>💣</span> {confirmText || "Detonate"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* SUCCESS DELETE */}
          {type === "success-delete" && (
            <>
              <div className="relative bg-gradient-to-br from-slate-700 via-zinc-700 to-slate-800 pt-8 pb-7 px-6 flex flex-col items-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 10px)" }} />
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="la-smoke1 absolute w-14 h-14 rounded-full bg-slate-400/50 blur-md" />
                  <div className="la-smoke2 absolute w-10 h-10 rounded-full bg-zinc-400/40 blur-md" />
                  <div className="text-4xl la-float select-none z-10">🌫️</div>
                </div>
                <div className="mt-3 text-slate-400 text-xs font-bold tracking-[0.18em] uppercase">Vanished.</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <button onClick={() => go(onConfirm)}
                  className="mt-5 w-full bg-gradient-to-r from-slate-700 to-zinc-700 hover:from-slate-800 hover:to-zinc-800 text-white font-bold py-3 rounded-2xl transition-all text-sm active:scale-95">
                  {confirmText || "Gone ✓"}
                </button>
              </div>
            </>
          )}

          {/* SUCCESS RESTORE */}
          {type === "success-restore" && (
            <>
              <div className="relative pt-8 pb-7 px-6 flex flex-col items-center overflow-hidden"
                style={{ background: "linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)" }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage:"radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize:"20px 20px" }} />
                <div className="la-phoenix relative w-20 h-20 flex items-center justify-center">
                  <div className="la-ring absolute w-20 h-20 rounded-full border-4 border-white/50" />
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-lg">🔥</div>
                </div>
                <div className="mt-3 text-white/75 text-xs font-bold tracking-[0.18em] uppercase">Rising from Ashes!</div>
              </div>
              <div className="px-6 py-5 text-center">
                <h3 className="text-xl font-black text-gray-800 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                <OrangeBtn onClick={() => go(onConfirm)}>{confirmText || "Welcome Back! 🔥"}</OrangeBtn>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

function useLeadAlert() {
  const [alert, setAlert] = useState(null);
  const fire = (cfg) => new Promise((resolve) => setAlert({ ...cfg, resolve }));
  const close = (val) => setAlert((prev) => { prev?.resolve?.(val); return null; });
  const Alert = alert ? <LeadAlert {...alert} onConfirm={() => close(true)} onCancel={() => close(false)} /> : null;
  return { fire, Alert };
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const STATUS_OPTIONS = ["new","contacted","qualified","proposal","negotiation","won","lost"];
const SOURCE_OPTIONS = ["website","referral","cold_call","email","social_media","advertisement","other"];

const STATUS_CONFIG = {
  new:         { bg:"bg-gray-100",   text:"text-gray-600",    border:"border-gray-300",    dot:"bg-gray-400"    },
  contacted:   { bg:"bg-blue-50",    text:"text-blue-700",    border:"border-blue-200",    dot:"bg-blue-500"    },
  qualified:   { bg:"bg-violet-50",  text:"text-violet-700",  border:"border-violet-200",  dot:"bg-violet-500"  },
  proposal:    { bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   dot:"bg-amber-500"   },
  negotiation: { bg:"bg-orange-50",  text:"text-orange-700",  border:"border-orange-200",  dot:"bg-orange-500"  },
  won:         { bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200", dot:"bg-emerald-500" },
  lost:        { bg:"bg-red-50",     text:"text-red-600",     border:"border-red-200",     dot:"bg-red-500"     },
};

const FOLLOWUP_STATUS_CONFIG = {
  pending:     { bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200"   },
  completed:   { bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200" },
  rescheduled: { bg:"bg-blue-50",    text:"text-blue-700",    border:"border-blue-200"    },
};

const EMPTY_FORM = {
  title:"", bid_id:"", client_id:"", description:"", source:"",
  estimated_value:"", probability:"", expected_close_date:"",
  status:"new", assigned_to:"", lost_reason:"",
};

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status || "—"}
    </span>
  );
}

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
    view: "text-[#ff6b1a] hover:bg-[#ff6b1a]/10",
    edit: "text-amber-600 hover:bg-amber-50",
    delete: "text-red-500 hover:bg-red-50",
    restore: "text-emerald-600 hover:bg-emerald-50",
    followup: "text-violet-600 hover:bg-violet-50",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-10 h-10 flex items-center justify-center   /* 🔥 bigger button */
        rounded-lg
        transition-all duration-150
        hover:scale-105
        ${variants[variant] || ""}
      `}
    >
      {/* 🔥 bigger icon */}
      <span className="w-5 h-5 flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-gray-800 break-words">
        {value || <span className="text-gray-300 font-normal text-xs">Not provided</span>}
      </span>
    </div>
  );
}

/* ── Right Drawer — exact BidManagement style ── */
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
          <div className="px-5 py-4 flex items-center justify-end gap-3 border-t border-gray-100 flex-shrink-0">{footer}</div>
        )}
      </div>
    </>
  );
}

/* field styles — same as BidManagement */
const fieldBase = "w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/40 focus:border-[#ff6b1a] transition-all disabled:opacity-50 disabled:bg-gray-50";

/* ═══════════════════════════════════════════════════════════
   FOLLOW-UP API HELPERS
═══════════════════════════════════════════════════════════ */
const followupApi = {
  create:   (d)  => fetch(`${FOLLOWUP_URL}/create`,         { method:"POST",   headers:{ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` }, body:JSON.stringify(d) }),
  update:   (id,d)=> fetch(`${FOLLOWUP_URL}/update/${id}`,  { method:"PUT",    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` }, body:JSON.stringify(d) }),
  getByLead:(id)  => fetch(`${FOLLOWUP_URL}/${id}`,         { headers:{ Authorization:`Bearer ${localStorage.getItem("token")||""}` } }),
  delete:   (id)  => fetch(`${FOLLOWUP_URL}/delete/${id}`,  { method:"DELETE", headers:{ Authorization:`Bearer ${localStorage.getItem("token")||""}` } }),
  restore:  (id)  => fetch(`${FOLLOWUP_URL}/restore/${id}`, { method:"POST",   headers:{ Authorization:`Bearer ${localStorage.getItem("token")||""}` } }),
};

const EMPTY_FOLLOWUP = { lead_id:"", follow_up_date:"", notes:"", follow_up_type:"", status:"pending" };

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LeadManagement() {
  /* ── data ── */
  const [leads,        setLeads]        = useState([]);
  const [bids,         setBids]         = useState([]);
  const [clients,      setClients]      = useState([]);
  const [users,        setUsers]        = useState([]);
  const [followups,    setFollowups]    = useState([]);

  /* ── ui state ── */
  const [loading,       setLoading]      = useState(true);
  const [search,        setSearch]       = useState("");
  const [statusFilter,  setStatusFilter] = useState("");
  const [page,          setPage]         = useState(1);
  const PER_PAGE = 10;

  /* ── lead drawer ── */
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formError,    setFormError]    = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  /* ── view panel ── */
  const [viewOpen,     setViewOpen]     = useState(false);
  const [viewData,     setViewData]     = useState(null);
  const [viewLoading,  setViewLoading]  = useState(false);

  /* ── followup drawer ── */
  const [fuDrawerOpen,    setFuDrawerOpen]    = useState(false);
  const [editingFuId,     setEditingFuId]     = useState(null);
  const [fuForm,          setFuForm]          = useState(EMPTY_FOLLOWUP);

  const { fire, Alert } = useLeadAlert();

  /* ── client map ── */
  const clientMap = useMemo(() => {
    const m = {};
    clients.forEach(c => { m[String(c.id)] = c; });
    return m;
  }, [clients]);

  /* ── fetch dropdown data ── */
  const fetchDropdownData = useCallback(async () => {
    const token = localStorage.getItem("token") || "";
    try {
      const [bR, cR, uR] = await Promise.all([
        fetch(`${BASE_URL}/bid/all`,    { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${BASE_URL}/client/all`, { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${BASE_URL}/auth/all`,   { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      const [bd, cd, ud] = await Promise.all([bR.json(), cR.json(), uR.json()]);
      setBids(bd.bids || []);
      setClients(cd.clients || []);
      setUsers(ud.users || []);
    } catch (e) { console.error("Dropdown fetch error:", e); }
  }, []);

  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

  /* ── fetch leads ── */
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await fetch(`${BASE_URL}/lead/all`, { headers:{ Authorization:`Bearer ${token}` } });
      const data  = await res.json();
      setLeads(data.data ?? data.leads ?? []);
    } catch { setLeads([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  /* ── filter ── */
  const filtered = useMemo(() => {
    let r = leads;
    if (search)       r = r.filter(l => (l.title??"").toLowerCase().includes(search.toLowerCase()) || (l.lead_number??"").toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) r = r.filter(l => l.status === statusFilter);
    return r;
  }, [leads, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageSlice  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  /* ── helpers ── */
  const setField = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  /* ── create ── */
  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setFormError(""); setDrawerOpen(true);
  }

  /* ── edit ── */
  async function openEdit(id) {
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await fetch(`${BASE_URL}/lead/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      const data  = await res.json();
      const l     = data.data ?? data.lead ?? {};
      setForm({
        title:               l.title ?? "",
        bid_id:              l.bid_id ?? "",
        client_id:           l.client_id ?? "",
        description:         l.description ?? "",
        source:              l.source ?? "",
        estimated_value:     l.estimated_value ?? "",
        probability:         l.probability ?? "",
        expected_close_date: l.expected_close_date ? l.expected_close_date.slice(0,10) : "",
        status:              l.status ?? "new",
        assigned_to:         l.assigned_to ?? "",
        lost_reason:         l.lost_reason ?? "",
      });
      setEditingId(id); setFormError(""); setDrawerOpen(true);
    } catch { alert("Could not load lead data."); }
  }

  /* ── view ── */
  async function openView(id) {
    setViewOpen(true); setViewLoading(true); setViewData(null); setFollowups([]);
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await fetch(`${BASE_URL}/lead/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      const data  = await res.json();
      const lead  = data.data ?? data.lead ?? null;
      setViewData(lead);
      if (lead?.id) {
        const fRes  = await followupApi.getByLead(lead.id);
        const fData = await fRes.json();
        setFollowups(fData.data ?? fData.followups ?? []);
      }
    } catch { setViewData(null); }
    finally  { setViewLoading(false); }
  }

  /* ── submit lead ── */
  async function handleSubmit() {
    if (!form.title)                          { setFormError("Title is required."); return; }
    if (!editingId && !form.bid_id)           { setFormError("Bid is required."); return; }
    if (!editingId && !form.client_id)        { setFormError("Client is required."); return; }

    setSubmitting(true); setFormError("");
    try {
      const token = localStorage.getItem("token") || "";
      const body  = { ...form };
      ["bid_id","client_id","assigned_to","estimated_value","probability"].forEach(k => {
        if (body[k] !== "" && body[k] != null) body[k] = Number(body[k]); else delete body[k];
      });
      if (!body.expected_close_date) delete body.expected_close_date;
      if (!body.description)         delete body.description;
      if (!body.lost_reason)         delete body.lost_reason;

      const url    = editingId ? `${BASE_URL}/lead/update/${editingId}` : `${BASE_URL}/lead/create`;
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body:JSON.stringify(body) });
      const d      = await res.json();
      if (!res.ok) throw new Error(d.message ?? "Failed");

      setDrawerOpen(false);
      await fetchLeads();
      await fire(editingId
        ? { type:"success-edit",   title:"Lead Updated!", message:`"${form.title}" has been saved.`, confirmText:"Great! ✓" }
        : { type:"success-create", title:"Lead Created!", message:`"${form.title}" is now in your pipeline.`, confirmText:"Awesome! 🎯" }
      );
    } catch (e) { setFormError(e.message); }
    finally     { setSubmitting(false); }
  }

  /* ── delete ── */
  async function handleDelete(id, title) {
    const ok = await fire({ type:"confirm-delete", title:"Delete this Lead?", message:`"${title||"This lead"}" will be permanently removed.`, confirmText:"Yes, Delete it!", cancelText:"Keep it" });
    if (!ok) return;
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${BASE_URL}/lead/delete/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
      await fetchLeads();
      await fire({ type:"success-delete", title:"Lead Deleted", message:"The lead has been removed.", confirmText:"Done" });
    } catch (e) { console.error(e); }
  }

  /* ── restore ── */
  async function handleRestore(id, title) {
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`${BASE_URL}/lead/restore/${id}`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } });
      await fetchLeads();
      await fire({ type:"success-restore", title:"Lead Restored!", message:`"${title||"The lead"}" is back and active.`, confirmText:"Welcome Back! 🔥" });
    } catch (e) { alert(e.message); }
  }

  /* ── followup helpers ── */
  function openFollowup(leadId) {
    setFuForm({ ...EMPTY_FOLLOWUP, lead_id: leadId });
    setEditingFuId(null);
    setFuDrawerOpen(true);
  }

  async function handleFuSubmit() {
    try {
      const payload = { ...fuForm };
      let res;
      if (editingFuId) { delete payload.lead_id; res = await followupApi.update(editingFuId, payload); }
      else              { res = await followupApi.create(payload); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setFuDrawerOpen(false);
      if (viewData?.id) {
        const fRes  = await followupApi.getByLead(viewData.id);
        const fData = await fRes.json();
        setFollowups(fData.data ?? fData.followups ?? []);
      }
      await fire({ type: editingFuId ? "success-edit" : "success-create", title: editingFuId ? "Follow-up Updated!" : "Follow-up Added!", message:"Follow-up saved successfully.", confirmText:"OK" });
    } catch (e) { alert(e.message); }
  }

  async function handleDeleteFu(id) {
    const ok = await fire({ type:"confirm-delete", title:"Delete Follow-up?", message:"This follow-up will be removed.", confirmText:"Delete", cancelText:"Cancel" });
    if (!ok) return;
    await followupApi.delete(id);
    if (viewData?.id) {
      const fRes  = await followupApi.getByLead(viewData.id);
      const fData = await fRes.json();
      setFollowups(fData.data ?? fData.followups ?? []);
    }
    await fire({ type:"success-delete", title:"Deleted", message:"Follow-up removed.", confirmText:"Done" });
  }

  /* SVG icons */
  const EyeIcon   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
  const EditIcon  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
  const TrashIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
  const RestIcon  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/></svg>;
  const PlusIcon  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;

  /* ═══════════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <style>{ALERT_CSS}</style>
      {Alert}

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Lead <span style={{ color:"#ff6b1a" }}>Management</span>
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage your sales pipeline and follow-ups</p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              style={{ background:"linear-gradient(135deg,#ff6b1a 0%,#ff9a56 100%)", boxShadow:"0 4px 15px rgba(255,107,26,0.3)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Create Lead
            </button>
          </div>



          {/* ── SEARCH + FILTER ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input placeholder="Search by title or lead number..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/30 focus:border-[#ff6b1a] placeholder-gray-400 transition-all" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6b1a]/30 focus:border-[#ff6b1a] text-gray-600 transition-all">
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
            <button onClick={fetchLeads} title="Refresh"
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-[#ff6b1a]/30 text-gray-400 hover:text-[#ff6b1a] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.582 9H4"/></svg>
            </button>
          </div>
        </div>

        {/* ── MOBILE CARDS ── */}
        <div className="block lg:hidden space-y-3 mb-6">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Leads</span>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
              {loading ? "…" : `${filtered.length} result${filtered.length!==1?"s":""}`}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm"><Spinner/> Loading...</div>
          ) : pageSlice.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🎯</div>
              <span className="text-sm text-gray-400">No leads found</span>
            </div>
          ) : pageSlice.map(l => (
            <div key={l.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${l.deleted_at?"opacity-50":""}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button onClick={() => openView(l.id)}
                        className="font-mono text-xs font-bold text-[#ff6b1a] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg hover:bg-orange-100 transition-all">
                        {l.lead_number ?? `#${l.id}`}
                      </button>
                      <StatusBadge status={l.status}/>
                    </div>
                    <p className="font-bold text-gray-900 text-sm truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{clientMap[String(l.client_id)]?.contact_person_name ?? "No client"}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {l.estimated_value && <span className="text-xs font-bold text-[#ff6b1a]">${Number(l.estimated_value).toLocaleString()}</span>}
                      {l.probability != null && <span className="text-xs text-gray-400">{l.probability}% prob.</span>}
                      {l.expected_close_date && <span className="text-xs text-gray-400">{new Date(l.expected_close_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ActionBtn onClick={() => openView(l.id)} title="View" variant="view"><EyeIcon/></ActionBtn>
                    {!l.deleted_at ? (
                      <>
                        <ActionBtn onClick={() => openEdit(l.id)} title="Edit" variant="edit"><EditIcon/></ActionBtn>
                        <ActionBtn onClick={() => handleDelete(l.id, l.title)} title="Delete" variant="delete"><TrashIcon/></ActionBtn>
                      </>
                    ) : (
                      <ActionBtn onClick={() => handleRestore(l.id, l.title)} title="Restore" variant="restore"><RestIcon/></ActionBtn>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP TABLE ── */}
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background:"#ff6b1a" }} />
              <h2 className="text-sm font-bold text-gray-800">All Leads</h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
              {loading ? "…" : `${filtered.length} result${filtered.length!==1?"s":""}`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-0">
              {Array.from({length:5}).map((_,i) => (
                <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50">
                  {Array.from({length:8}).map((_,j) => (
                    <div key={j} className="h-3 bg-gray-100 rounded-full animate-pulse" style={{ width:`${40+j*8}%`, flex:1 }} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout:"auto" }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-[#fafafa]">
                    {["LEAD #","TITLE","CLIENT","PROBABILITY","CLOSE DATE","STATUS","ACTIONS"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.length === 0 ? (
                    <tr><td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🎯</div>
                        <span className="text-sm text-gray-400">No leads found</span>
                      </div>
                    </td></tr>
                  ) : pageSlice.map((l, idx) => (
                    <tr key={l.id}
                      className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${l.deleted_at?"opacity-50":""}`}
                      style={{ animationDelay:`${idx*30}ms` }}>

                      {/* LEAD # */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => openView(l.id)}
                          className="font-mono text-xs font-bold text-[#ff6b1a] hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2 py-1 rounded-lg transition-all">
                          {l.lead_number ?? `#${l.id}`}
                        </button>
                      </td>

                      {/* TITLE */}
                      <td className="px-4 py-3 whitespace-nowrap max-w-[160px]">
                        <span className="font-semibold text-gray-800 text-sm truncate block">{l.title}</span>
                      </td>

                      {/* CLIENT */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{clientMap[String(l.client_id)]?.contact_person_name || <span className="text-gray-300">—</span>}</span>
                      </td>

                      {/* VALUE */}
                      {/* <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-700">
                          {l.estimated_value ? `$${Number(l.estimated_value).toLocaleString()}` : <span className="text-gray-300 font-normal">—</span>}
                        </span>
                      </td> */}

                      {/* PROBABILITY */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {l.probability != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width:`${l.probability}%`, background:"#ff6b1a" }} />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{l.probability}%</span>
                          </div>
                        ) : <span className="text-gray-300 text-sm">—</span>}
                      </td>

                      {/* CLOSE DATE */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {l.expected_close_date ? new Date(l.expected_close_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={l.status}/></td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          <ActionBtn onClick={() => openView(l.id)} title="View Details" variant="view"><EyeIcon/></ActionBtn>
                          {!l.deleted_at ? (
                            <>
                              <ActionBtn onClick={() => { openView(l.id); setTimeout(()=>openFollowup(l.id),300); }} title="Add Follow-up" variant="followup"><PlusIcon/></ActionBtn>
                              <ActionBtn onClick={() => openEdit(l.id)} title="Edit" variant="edit"><EditIcon/></ActionBtn>
                              <ActionBtn onClick={() => handleDelete(l.id,l.title)} title="Delete" variant="delete"><TrashIcon/></ActionBtn>
                            </>
                          ) : (
                            <ActionBtn onClick={() => handleRestore(l.id,l.title)} title="Restore" variant="restore"><RestIcon/></ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-400">
                Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1.5">
                {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${n===page ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-500 hover:text-[#ff6b1a] hover:border-[#ff6b1a]/30"}`}
                    style={n===page ? { background:"#ff6b1a" } : {}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ VIEW SIDE PANEL ════════════════════════════════ */}
      {viewOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setViewOpen(false)} />
          <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col border-l border-gray-100">

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 flex-shrink-0 border-b border-gray-100"
              style={{ borderTop:"3px solid #ff6b1a" }}>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Lead Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">{viewData?.lead_number ?? (viewLoading?"Loading…":"—")}</p>
              </div>
              <button onClick={() => setViewOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {viewLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3"><Spinner/><span className="text-sm text-gray-400">Fetching lead data…</span></div>
              ) : viewData ? (
                <div className="space-y-5">

                  {/* Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={viewData.status}/>
                    {viewData.deleted_at && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">Deleted</span>}
                  </div>

                  {/* Title + desc */}
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{viewData.title}</h3>
                    {viewData.description && <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{viewData.description}</p>}
                  </div>

                  {/* Value + probability cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl px-4 py-3" style={{ background:"linear-gradient(135deg,#fff7f3,#fff)", border:"1px solid #ffe0cc" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color:"#ff9a56" }}>Est. Value</p>
                      <p className="text-sm font-extrabold" style={{ color:"#ff6b1a" }}>
                        {viewData.estimated_value ? `$${Number(viewData.estimated_value).toLocaleString()}` : "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Probability</p>
                      {viewData.probability != null ? (
                        <>
                          <div className="w-full h-1.5 rounded-full bg-gray-200 mb-1">
                            <div className="h-full rounded-full" style={{ width:`${viewData.probability}%`, background:"#ff6b1a" }} />
                          </div>
                          <p className="text-sm font-extrabold text-gray-700">{viewData.probability}%</p>
                        </>
                      ) : <p className="text-sm font-extrabold text-gray-700">—</p>}
                    </div>
                  </div>

                  {/* Detail grid */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">🎯</span>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lead Information</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <DetailRow label="Lead Number" value={viewData.lead_number} />
                      <DetailRow label="Source" value={viewData.source} />
                      <DetailRow label="Client" value={clientMap[String(viewData.client_id)]?.contact_person_name} />
                      <DetailRow label="Expected Close" value={viewData.expected_close_date ? new Date(viewData.expected_close_date).toLocaleDateString() : null} />
                    </div>
                  </div>

                  {/* Follow-ups */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📞</span>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Follow-ups</p>
                      </div>
                      <button onClick={() => openFollowup(viewData.id)}
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-white transition-all"
                        style={{ background:"linear-gradient(135deg,#ff6b1a,#ff9a56)" }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                        Add
                      </button>
                    </div>

                    {followups.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">No follow-ups yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {followups.map(f => {
                          const fCfg = FOLLOWUP_STATUS_CONFIG[f.status] || { bg:"bg-gray-50", text:"text-gray-600", border:"border-gray-200" };
                          return (
                            <div key={f.id} className={`rounded-xl p-3 border text-xs ${f.deleted_at ? "opacity-50 bg-red-50 border-red-200" : `${fCfg.bg} ${fCfg.border}`}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-bold capitalize ${f.deleted_at ? "text-red-600" : fCfg.text}`}>{f.follow_up_type}</span>
                                <span className="text-gray-400 text-[10px]">{f.follow_up_date}</span>
                              </div>
                              {f.notes && <p className="text-gray-500 mb-2 text-[11px]">{f.notes}</p>}
                              <div className="flex items-center gap-3">
                                {!f.deleted_at ? (
                                  <>
                                    <button onClick={() => { setEditingFuId(f.id); setFuForm({ lead_id:f.lead_id, follow_up_date:f.follow_up_date?.slice(0,10), notes:f.notes, follow_up_type:f.follow_up_type, status:f.status }); setFuDrawerOpen(true); }}
                                      className="text-[#ff6b1a] hover:underline font-semibold">Edit</button>
                                    <button onClick={() => handleDeleteFu(f.id)} className="text-red-500 hover:underline font-semibold">Delete</button>
                                  </>
                                ) : (
                                  <button onClick={async () => { await followupApi.restore(f.id); openView(viewData.id); }} className="text-emerald-600 hover:underline font-semibold">Restore</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48"><span className="text-sm text-gray-400">No data available.</span></div>
              )}
            </div>

            {/* Footer */}
            {viewData && !viewLoading && (
              <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <button onClick={() => { setViewOpen(false); openEdit(viewData.id); }}
                  className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background:"linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow:"0 4px 12px rgba(255,107,26,0.25)" }}>
                  <EditIcon/> Edit Lead
                </button>
                <button onClick={() => setViewOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ CREATE / EDIT LEAD DRAWER ══════════════════════ */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit Lead" : "Create Lead"}
        subtitle="PMS HRMS · Sales Pipeline"
        footer={
          <>
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background:"linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow:"0 4px 12px rgba(255,107,26,0.25)" }}>
              {submitting ? <><Spinner/> Saving…</> : (editingId ? "Save Changes" : "Create Lead")}
            </button>
          </>
        }>
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
              <span className="text-base">🎯</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Basic Info</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title <span style={{ color:"#ff6b1a" }}>*</span></label>
                <input className={fieldBase} placeholder="e.g. Enterprise Software Deal" value={form.title} onChange={setField("title")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Bid {!editingId && <span style={{ color:"#ff6b1a" }}>*</span>}</label>
                  <select className={fieldBase} value={form.bid_id} disabled={!!editingId}
                    onChange={e => {
                      const bid = bids.find(b => b.id == e.target.value);
                      setForm(p => ({ ...p, bid_id: e.target.value, client_id: bid?.client_id || "" }));
                    }}>
                    <option value="">Select Bid</option>
                    {bids.map(b => <option key={b.id} value={b.id}>{b.title} ({b.client?.company_name})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Client {!editingId && <span style={{ color:"#ff6b1a" }}>*</span>}</label>
                  <select className={fieldBase} value={form.client_id} disabled={!!editingId} onChange={setField("client_id")}>
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.contact_person_name})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea className={`${fieldBase} resize-y min-h-[80px]`} placeholder="Brief description of the lead…" value={form.description} onChange={setField("description")} />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📊</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lead Details</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Source</label>
                <select className={fieldBase} value={form.source} onChange={setField("source")}>
                  <option value="">— Select —</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select className={fieldBase} value={form.status} onChange={setField("status")}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estimated Value ($)</label>
                <input className={fieldBase} type="number" placeholder="0.00" min="0" step="0.01" value={form.estimated_value} onChange={setField("estimated_value")} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Probability (%)</label>
                <input className={fieldBase} type="number" placeholder="0–100" min="0" max="100" value={form.probability} onChange={setField("probability")} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Expected Close Date</label>
                <input className={fieldBase} type="date" value={form.expected_close_date} onChange={setField("expected_close_date")} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Assigned To</label>
                <select className={fieldBase} value={form.assigned_to||""} onChange={setField("assigned_to")}>
                  <option value="">Select User</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Lost reason */}
          {form.status === "lost" && (
            <div className="bg-red-50/70 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">❌</span>
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Lost Details</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lost Reason</label>
                <textarea className={`${fieldBase} border-red-200 focus:border-red-400 focus:ring-red-200/40 resize-y min-h-[72px]`}
                  placeholder="Why was this lead lost?" value={form.lost_reason} onChange={setField("lost_reason")} />
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* ══ FOLLOW-UP DRAWER ═══════════════════════════════ */}
      <Drawer open={fuDrawerOpen} onClose={() => setFuDrawerOpen(false)}
        title={editingFuId ? "Edit Follow-up" : "Add Follow-up"}
        subtitle="Track communication history"
        footer={
          <>
            <button onClick={() => setFuDrawerOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">Cancel</button>
            <button onClick={handleFuSubmit}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background:"linear-gradient(135deg,#ff6b1a,#ff9a56)", boxShadow:"0 4px 12px rgba(255,107,26,0.25)" }}>
              {editingFuId ? "Update" : "Save Follow-up"}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📞</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Follow-up Details</p>
            </div>
            <div className="space-y-3">
              {!editingFuId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Lead ID</label>
                  <input className={fieldBase} value={fuForm.lead_id} disabled />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Follow-up Date</label>
                  <input type="date" className={fieldBase} value={fuForm.follow_up_date}
                    onChange={e => setFuForm(p => ({ ...p, follow_up_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select className={fieldBase} value={fuForm.follow_up_type}
                    onChange={e => setFuForm(p => ({ ...p, follow_up_type: e.target.value }))}>
                    <option value="">Select Type</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select className={fieldBase} value={fuForm.status}
                  onChange={e => setFuForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                <textarea className={`${fieldBase} min-h-[90px] resize-y`} placeholder="What happened in this follow-up?" value={fuForm.notes}
                  onChange={e => setFuForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}