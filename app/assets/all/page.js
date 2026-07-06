"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:8080/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function fmt(val) {
  if (val == null || val === "") return "—";
  return val;
}

function fmtCurrency(val) {
  if (val == null || val === "") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val));
}

function fmtDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLORS = {
  available:        "bg-green-100 text-green-700 border border-green-200",
  assigned:         "bg-blue-100 text-blue-700 border border-blue-200",
  under_maintenance:"bg-yellow-100 text-yellow-700 border border-yellow-200",
  retired:          "bg-red-100 text-red-700 border border-red-200",
  disposed:         "bg-gray-100 text-gray-600 border border-gray-200",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Plus:         ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
  Refresh:      ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.9-1M20 15a9 9 0 01-15.9 1"/></svg>,
  Eye:          ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Edit:         ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:        ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><polyline points="3,6 5,6 21,6"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>,
  Close:        ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>,
  Search:       ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>,
  Tag:          ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Grid:         ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Activity:     ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  TrendingDown: ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/></svg>,
  Zap:          ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>,
  ChevronDown:  ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><polyline points="6,9 12,15 18,9"/></svg>,
  Check:        ({ cls="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cls}><polyline points="20,6 9,17 4,12"/></svg>,
  Warning:      ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Dots:         ({ cls="w-5 h-5" }) => <svg viewBox="0 0 24 24" fill="currentColor" className={cls}><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
};

// ─── Global CSS ───────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { font-family: 'Inter', sans-serif; box-sizing: border-box; }
  @keyframes slideRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideUp    { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes scaleIn    { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes toastIn    { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes pulse      { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .drawer-desktop { animation: slideRight 0.28s cubic-bezier(.22,.68,0,1.1); }
  .drawer-mobile  { animation: slideUp   0.28s cubic-bezier(.22,.68,0,1.1); }
  .modal-anim     { animation: scaleIn   0.2s  ease-out; }
  .toast-anim     { animation: toastIn   0.22s ease-out; }
  .spin           { animation: spin      0.75s linear infinite; }
  .pulse          { animation: pulse     2s    ease-in-out infinite; }
  ::-webkit-scrollbar       { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [list, setList] = useState([]);
  const add = useCallback((message, type = "success") => {
    const id = Date.now();
    setList((p) => [...p, { id, message, type }]);
    setTimeout(() => setList((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const rem = useCallback((id) => setList((p) => p.filter((t) => t.id !== id)), []);
  return { list, add, rem };
}

function Toasts({ list, rem }) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 pointer-events-none">
      {list.map((t) => (
        <div key={t.id} className={`toast-anim pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium w-full sm:min-w-[280px] sm:max-w-sm
          ${t.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          <span className={`mt-0.5 shrink-0 ${t.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {t.type === "success" ? <Icon.Check /> : <Icon.Warning />}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button onClick={() => rem(t.id)} className="mt-0.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <Icon.Close cls="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ sm, white }) {
  const sz  = sm ? "w-4 h-4" : "w-5 h-5";
  const clr = white ? "border-white/30 border-t-white" : "border-orange-200 border-t-orange-500";
  return <div className={`${sz} rounded-full border-2 ${clr} spin shrink-0`} />;
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function Drawer({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const inner = (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="ml-3 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0 touch-manipulation">
          <Icon.Close />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
    </>
  );

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      {/* Desktop: right panel */}
      <div className={`hidden sm:flex fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        {inner}
      </div>
      {/* Mobile: bottom sheet */}
      <div className={`sm:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col max-h-[92dvh] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>
        {inner}
      </div>
    </>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ asset, onConfirm, onCancel, busy }) {
  if (!asset) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="modal-anim relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl p-6">
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-500 shrink-0"><Icon.Trash cls="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-gray-900">Delete Asset</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-gray-900">{asset.asset_name}</span>?{" "}
          <span className="text-gray-400">({asset.asset_code})</span>
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors touch-manipulation">
            {busy && <Spinner sm white />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const CARD_COLORS = {
  orange: { bg: "bg-orange-50", icon: "text-orange-500", val: "text-orange-500" },
  green:  { bg: "bg-green-50",  icon: "text-green-500",  val: "text-green-500"  },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   val: "text-blue-500"   },
  gray:   { bg: "bg-gray-50",   icon: "text-gray-400",   val: "text-gray-700"   },
};

function StatCard({ label, value, Ico, color }) {
  const c = CARD_COLORS[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${c.val}`}>{value}</p>
      </div>
      <div className={`${c.bg} ${c.icon} p-2.5 sm:p-3 rounded-xl`}><Ico cls="w-5 h-5" /></div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function iCls(err) {
  return `w-full px-3.5 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 bg-white
    focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500
    ${err ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-orange-300 focus:border-orange-400"}`;
}

// ─── Category Dropdown ────────────────────────────────────────────────────────

function CategorySelect({ value, onChange, error }) {
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/asset-categories/`, { headers: authHeaders() })
      .then((r) => r.json()).then((d) => { if (d.success) setCats(d.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = cats.find((c) => c.id === Number(value));
  const filtered = cats.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className={`${iCls(error)} flex items-center justify-between text-left`}>
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.name : "Select category"}
        </span>
        <Icon.ChevronDown cls={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-lg">
              <span className="text-gray-400 shrink-0"><Icon.Search /></span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories…" className="flex-1 text-sm bg-transparent outline-none" />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 p-3 text-center">No categories found</p>
            ) : filtered.map((c) => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c.id); setOpen(false); setQ(""); }}
                className={`w-full text-left px-3.5 py-3 text-sm flex items-center justify-between gap-2 transition-colors touch-manipulation
                  ${Number(value) === c.id ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"}`}>
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-gray-400 shrink-0">ID: {c.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Asset Form ───────────────────────────────────────────────────────────────

const EMPTY = { asset_name:"", category_id:"", description:"", purchase_date:"", purchase_cost:"", current_value:"", serial_number:"", warranty_expiry_date:"", location:"", status:"available" };
const STATUSES = ["available","assigned","under_maintenance","retired","disposed"];

function AssetForm({ initial = EMPTY, onSubmit, busy, btnLabel }) {
  const [form, setForm] = useState(initial);
  const [err,  setErr]  = useState({});

  useEffect(() => { setForm(initial); setErr({}); }, [JSON.stringify(initial)]);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setErr((p) => ({ ...p, [k]: "" })); }

  function validate() {
    const e = {};
    if (!form.asset_name.trim()) e.asset_name  = "Asset name is required";
    if (!form.category_id)       e.category_id = "Category is required";
    if (!form.purchase_date)     e.purchase_date = "Purchase date is required";
    if (!form.purchase_cost)     e.purchase_cost = "Purchase cost is required";
    return e;
  }

  function submit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErr(v); return; }
    onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Asset Name" required error={err.asset_name}>
        <input value={form.asset_name} onChange={(e) => set("asset_name", e.target.value)}
          placeholder="e.g. Toyota Innova Crysta" className={iCls(err.asset_name)} />
      </Field>

      <Field label="Category" required error={err.category_id}>
        <CategorySelect value={form.category_id} onChange={(v) => set("category_id", v)} error={err.category_id} />
      </Field>

      <Field label="Description">
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={3} placeholder="Brief description…" className={`${iCls(false)} resize-none`} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Purchase Date" required error={err.purchase_date}>
          <input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} className={iCls(err.purchase_date)} />
        </Field>
        <Field label="Warranty Expiry">
          <input type="date" value={form.warranty_expiry_date} onChange={(e) => set("warranty_expiry_date", e.target.value)} className={iCls(false)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost (₹)" required error={err.purchase_cost}>
          <input type="number" value={form.purchase_cost} onChange={(e) => set("purchase_cost", e.target.value)} placeholder="0" className={iCls(err.purchase_cost)} />
        </Field>
        <Field label="Current Value (₹)">
          <input type="number" value={form.current_value} onChange={(e) => set("current_value", e.target.value)} placeholder="0" className={iCls(false)} />
        </Field>
      </div>

      <Field label="Serial Number">
        <input value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} placeholder="e.g. WB-02-AB-1234" className={iCls(false)} />
      </Field>

      <Field label="Location">
        <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Corporate Parking Area" className={iCls(false)} />
      </Field>

      <Field label="Status">
        <select value={form.status} onChange={(e) => set("status", e.target.value)} className={iCls(false)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
          ))}
        </select>
      </Field>

      <div className="pt-1 sticky bottom-0 bg-white pb-1">
        <button type="submit" disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 text-white font-semibold rounded-xl text-sm transition-colors touch-manipulation">
          {busy && <Spinner sm white />}{btnLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ assets, onSelect }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = assets.filter((a) =>
    a.asset_name.toLowerCase().includes(q.toLowerCase()) ||
    a.asset_code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-orange-400 transition-all">
        <span className="text-gray-400 shrink-0"><Icon.Search /></span>
        <input value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search assets…"
          className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent min-w-0" />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }} className="text-gray-400 hover:text-gray-600 shrink-0 touch-manipulation">
            <Icon.Close cls="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && q && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-30 max-h-52 overflow-y-auto overscroll-contain">
          {filtered.length === 0
            ? <p className="text-sm text-gray-400 p-3 text-center">No results</p>
            : filtered.map((a) => (
              <button key={a.id} onClick={() => { onSelect(a); setQ(""); setOpen(false); }}
                className="w-full text-left px-3.5 py-3 hover:bg-orange-50 flex items-center justify-between gap-2 text-sm transition-colors touch-manipulation">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{a.asset_name}</p>
                  <p className="text-xs text-gray-400">{a.asset_code}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}>
                  {a.status?.replace(/_/g," ")}
                </span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── Mobile Row Action Menu ───────────────────────────────────────────────────

function RowMenu({ onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((p) => !p)}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation">
        <Icon.Dots cls="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-white rounded-xl border border-gray-200 shadow-xl z-20 min-w-[140px] overflow-hidden modal-anim">
          <button onClick={() => { onView(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors touch-manipulation">
            <Icon.Eye /> View
          </button>
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors touch-manipulation">
            <Icon.Edit /> Edit
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors touch-manipulation">
            <Icon.Trash /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── View Detail Row ──────────────────────────────────────────────────────────

function DetailRow({ label, value, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-[10px] sm:text-sm text-gray-400 sm:w-40 shrink-0 uppercase tracking-widest sm:normal-case sm:tracking-normal font-medium sm:font-normal">
        {label}
      </span>
      {badge
        ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[value] || "bg-gray-100 text-gray-600"}`}>
            {value?.replace(/_/g," ")}
          </span>
        : <span className="text-sm font-medium text-gray-900 break-words">{fmt(value)}</span>
      }
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const { list: toasts, add: toast, rem: remToast } = useToast();

  const [assets,  setAssets]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [formBusy,setFormBusy]= useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [delBusy,    setDelBusy]    = useState(false);

  const stats = {
    total:       assets.length,
    available:   assets.filter((a) => a.status === "available").length,
    assigned:    assets.filter((a) => a.status === "assigned").length,
    maintenance: assets.filter((a) => a.status === "under_maintenance").length,
  };

  async function fetchAll() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/assets/`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setAssets(d.data); else toast(d.message || "Failed to load", "error");
    } catch { toast("Network error", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleCreate(form) {
    setFormBusy(true);
    try {
      const r = await fetch(`${API_BASE}/assets/create`, { method:"POST", headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { toast("Asset created!"); setCreateOpen(false); fetchAll(); }
      else toast(d.message || "Create failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setFormBusy(false); }
  }

  async function handleUpdate(form) {
    if (!selected) return;
    setFormBusy(true);
    try {
      const r = await fetch(`${API_BASE}/assets/update/${selected.id}`, { method:"PUT", headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { toast("Asset updated!"); setEditOpen(false); fetchAll(); }
      else toast(d.message || "Update failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setFormBusy(false); }
  }

  async function handleDelete() {
    if (!delTarget) return;
    setDelBusy(true);
    try {
      const r = await fetch(`${API_BASE}/assets/delete/${delTarget.id}`, { method:"DELETE", headers: authHeaders() });
      const d = await r.json();
      if (d.success) { toast("Asset deleted!"); setDelTarget(null); fetchAll(); }
      else toast(d.message || "Delete failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setDelBusy(false); }
  }

  async function openView(asset) {
    try {
      const r = await fetch(`${API_BASE}/assets/${asset.id}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) { setSelected(d.data); setViewOpen(true); }
      else toast(d.message || "Fetch failed", "error");
    } catch { toast("Network error", "error"); }
  }

  function openEdit(asset) { setSelected(asset); setEditOpen(true); }

  const editInitial = selected ? {
    asset_name:           selected.asset_name || "",
    category_id:          selected.category_id || "",
    description:          selected.description || "",
    purchase_date:        selected.purchase_date?.split("T")[0] || "",
    purchase_cost:        selected.purchase_cost || "",
    current_value:        selected.current_value || "",
    serial_number:        selected.serial_number || "",
    warranty_expiry_date: selected.warranty_expiry_date?.split("T")[0] || "",
    location:             selected.location || "",
    status:               selected.status || "available",
  } : EMPTY;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <style>{CSS}</style>

      <Toasts list={toasts} rem={remToast} />
      <DeleteModal asset={delTarget} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} busy={delBusy} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* ── Header ── */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-orange-500 rounded-xl sm:rounded-2xl text-white shadow-md shadow-orange-200 shrink-0">
              <Icon.Tag cls="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 hidden sm:block">Assets › Assets</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Assets</h1>
              <p className="text-xs sm:text-sm text-gray-500">Create and manage company assets</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchAll}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300 active:bg-gray-50 transition-colors shadow-sm touch-manipulation">
              <Icon.Refresh />
            </button>
            <button onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-orange-200 touch-manipulation">
              <Icon.Plus />
              <span>Asset</span>
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatCard label="Total"       value={stats.total}       Ico={Icon.Grid}         color="orange" />
          <StatCard label="Available"   value={stats.available}   Ico={Icon.Activity}     color="green"  />
          <StatCard label="Assigned"    value={stats.assigned}    Ico={Icon.Zap}          color="blue"   />
          <StatCard label="Maintenance" value={stats.maintenance} Ico={Icon.TrendingDown} color="gray"   />
        </div>

        {/* ── Table / Card List ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
            <SearchBar assets={assets} onSelect={(a) => openView(a)} />
            <p className="text-xs sm:text-sm text-gray-400 shrink-0">
              {loading ? "Loading…" : `${assets.length} result${assets.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* ─ Desktop Table ─ */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["#","Asset","Category","Purchase Cost","Status","Location","Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? Array.from({length:4}).map((_,i) => (
                      <tr key={i}>{Array.from({length:7}).map((__,j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded pulse" style={{width:`${48+(j*17)%48}%`}} />
                        </td>
                      ))}</tr>
                    ))
                  : assets.length === 0
                    ? <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-400">
                        No assets found. Click <strong className="text-gray-600">+ Asset</strong> to create one.
                      </td></tr>
                    : assets.map((a, i) => (
                        <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4 text-sm text-gray-400">{i + 1}</td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900">{a.asset_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.asset_code}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{a.category?.name || `#${a.category_id}`}</td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">{fmtCurrency(a.purchase_cost)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}>
                              {a.status?.replace(/_/g," ")}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 max-w-[150px] truncate">{fmt(a.location)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openView(a)} title="View"
                                className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                <Icon.Eye />
                              </button>
                              <button onClick={() => openEdit(a)} title="Edit"
                                className="p-2 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                <Icon.Edit />
                              </button>
                              <button onClick={() => setDelTarget(a)} title="Delete"
                                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Icon.Trash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>

          {/* ─ Mobile Card List ─ */}
          <div className="sm:hidden divide-y divide-gray-50">
            {loading
              ? Array.from({length:3}).map((_,i) => (
                  <div key={i} className="px-4 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded pulse w-3/4" />
                      <div className="h-3 bg-gray-100 rounded pulse w-1/2" />
                    </div>
                  </div>
                ))
              : assets.length === 0
                ? <div className="px-4 py-14 text-center text-sm text-gray-400">
                    No assets. Tap <strong className="text-gray-600"> Asset</strong> to create one.
                  </div>
                : assets.map((a) => (
                    <div key={a.id} className="px-4 py-4 flex items-start gap-3 active:bg-gray-50/80 transition-colors">
                      <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Icon.Tag cls="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{a.asset_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.asset_code}</p>
                          </div>
                          <RowMenu
                            onView={() => openView(a)}
                            onEdit={() => openEdit(a)}
                            onDelete={() => setDelTarget(a)}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}>
                            {a.status?.replace(/_/g," ")}
                          </span>
                          <span className="text-xs text-gray-500">{a.category?.name || `#${a.category_id}`}</span>
                          <span className="text-xs font-semibold text-gray-700 ml-auto">{fmtCurrency(a.purchase_cost)}</span>
                        </div>
                        {a.location && (
                          <p className="text-xs text-gray-400 mt-1.5 truncate">📍 {a.location}</p>
                        )}
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>
      </div>

      {/* ── Drawers ── */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Asset" subtitle="Fill in the details to register a new asset">
        <AssetForm onSubmit={handleCreate} busy={formBusy} btnLabel="Create Asset" />
      </Drawer>

      <Drawer open={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }} title="Edit Asset" subtitle={selected ? `Editing: ${selected.asset_name}` : ""}>
        {selected && <AssetForm key={selected.id} initial={editInitial} onSubmit={handleUpdate} busy={formBusy} btnLabel="Update Asset" />}
      </Drawer>

      <Drawer open={viewOpen} onClose={() => { setViewOpen(false); setSelected(null); }} title="Asset Details" subtitle={selected?.asset_code || ""}>
        {selected && (
          <div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl mb-5">
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                <Icon.Tag cls="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-500 truncate">{selected.asset_name}</h3>
                <p className="text-xs text-gray-500">{selected.asset_code}</p>
              </div>
              <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[selected.status] || "bg-gray-100 text-gray-600"}`}>
                {selected.status?.replace(/_/g," ")}
              </span>
            </div>

            <DetailRow label="Category"      value={selected.category?.name || `#${selected.category_id}`} />
            <DetailRow label="Description"   value={selected.description} />
            <DetailRow label="Serial Number" value={selected.serial_number} />
            <DetailRow label="Location"      value={selected.location} />
            <DetailRow label="Purchase Date" value={fmtDate(selected.purchase_date)} />
            <DetailRow label="Warranty"      value={fmtDate(selected.warranty_expiry_date)} />
            <DetailRow label="Cost"          value={fmtCurrency(selected.purchase_cost)} />
            <DetailRow label="Current Value" value={fmtCurrency(selected.current_value)} />
            <DetailRow label="Status"        value={selected.status} badge />
            <DetailRow label="Assigned To"   value={selected.assignee ? `${selected.assignee.first_name} ${selected.assignee.last_name}` : "—"} />
            <DetailRow label="Assigned Date" value={fmtDate(selected.assigned_date)} />
            <DetailRow label="Created"       value={fmtDate(selected.created_at)} />
            <DetailRow label="Updated"       value={fmtDate(selected.updated_at)} />

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setViewOpen(false); openEdit(selected); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 active:bg-amber-200 transition-colors touch-manipulation">
                <Icon.Edit /> Edit
              </button>
              <button onClick={() => { setViewOpen(false); setDelTarget(selected); }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 active:bg-red-200 transition-colors touch-manipulation">
                <Icon.Trash />
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}