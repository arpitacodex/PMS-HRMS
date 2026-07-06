"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:8080/api";
const getToken = () => localStorage.getItem("token") || "";

const api = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "API error");
  return data;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// SVG Icons
const Ic = ({ d, s = 16, c = "currentColor", sw = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const IcEye = ({ s = 14 }) => <Ic s={s} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />;
const IcEdit = ({ s = 14 }) => <Ic s={s} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />;
const IcTrash = ({ s = 14 }) => <Ic s={s} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />;
const IcReturn = ({ s = 14 }) => <Ic s={s} d="M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1" />;
const IcPlus = ({ s = 15 }) => <Ic s={s} d="M12 5v14M5 12h14" sw={2.2} />;
const IcClose = ({ s = 15 }) => <Ic s={s} d="M18 6L6 18M6 6l12 12" />;
const IcRefresh = ({ s = 16 }) => <Ic s={s} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />;
const IcSearch = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IcChevron = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: "block", flexShrink: 0 }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IcBriefcase = ({ s = 22, color = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

// Theme-aware style helpers - Orange gradient theme
const styles = {
  // Page & layout
  page: "min-h-screen bg-white font-sans",
  header: "bg-white border-b border-gray-200 sticky top-0 z-30",
  breadcrumb: "text-[11px] text-gray-500",
  breadcrumbActive: "text-orange-500 font-semibold",
  pageTitle: "text-xl font-extrabold text-gray-900",

  // Buttons
  btnIcon: "bg-gray-100 border border-gray-200 rounded-xl p-2 text-gray-600 hover:bg-gray-200 transition",
  btnPrimary: "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-1 shadow-md whitespace-nowrap hover:from-orange-600 hover:to-orange-700 transition-all",

  // Stat cards
  statCard: "bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex justify-between items-center",
  statLabel: "text-[10px] font-bold text-gray-500 uppercase tracking-wider",

  // Search / filter bar
  searchWrap: "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6",
  searchInner: "p-3 border-b border-gray-100 flex items-center gap-2",
  searchInput: "w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400",
  resultCount: "text-xs text-gray-500 whitespace-nowrap",

  // Table
  thead: "bg-gray-50 border-b border-gray-200",
  th: "px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider",
  tr: "hover:bg-gray-50/80 transition",
  td: "px-4 py-3",
  tdText: "text-gray-900",
  tdMuted: "text-sm text-gray-500",
  cellPrimary: "font-semibold text-gray-900",
  cellSub: "text-xs text-gray-500",

  // Drawer
  drawerOverlay: "fixed inset-0 bg-slate-900/40 z-[400] transition-all backdrop-blur-sm",
  drawerPanel: "fixed top-0 right-0 h-full w-full max-w-[500px] bg-white z-[401] shadow-2xl flex flex-col transition-transform duration-300 ease-out",
  drawerHeader: "p-5 border-b border-gray-100 flex justify-between items-start shrink-0",
  drawerTitle: "text-lg font-extrabold text-gray-900",
  drawerSubtitle: "text-xs text-gray-500 mt-1",
  drawerCloseBtn: "bg-gray-100 border border-gray-200 rounded-lg p-1.5 text-gray-600 hover:bg-gray-200 transition",

  // Form elements
  label: "block text-xs font-bold text-gray-600 uppercase mb-1",
  input: "w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 placeholder-gray-400",
  textarea: "w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400",
  btnCancel: "flex-1 py-3 border border-gray-200 rounded-xl bg-gray-50 font-semibold text-gray-700 hover:bg-gray-100 transition",

  // View drawer detail rows
  detailWrap: "divide-y divide-gray-100 bg-gray-50 rounded-xl p-3",
  detailLabel: "text-xs font-bold text-gray-500",
  detailValue: "text-gray-900",

  // Delete modal
  delModal: "bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl",
  delTitle: "text-center font-extrabold text-lg text-gray-900",
  delBody: "text-center text-gray-500 text-sm mt-1",
  delAsset: "text-center font-bold text-gray-900 mt-1",

  // Mobile card
  mobileCard: "p-4 hover:bg-gray-50/50 transition",
  mobileAssetName: "font-bold text-gray-900 text-base",
  mobileAssetCode: "text-xs text-gray-500",
  mobileDateBox: "grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded-xl mb-3",
  mobileDateLabel: "text-gray-500",
  mobileDateVal: "font-medium text-gray-900",
};

const Toast = ({ toasts }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2 animate-in slide-in-from-right-2 duration-200 ${t.type === "error" ? "bg-red-50 border border-red-300 text-red-700" : "bg-green-50 border border-green-300 text-green-700"}`}>
        <span className="text-base">{t.type === "error" ? "✕" : "✓"}</span>
        {t.msg}
      </div>
    ))}
  </div>
);

// Searchable Select — orange themed
const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()) || (o.sub || "").toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const avatarColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444"];
  const getColor = (label) => avatarColors[(label?.charCodeAt(0) || 0) % avatarColors.length];
  return (
    <div ref={wrapRef} className="relative">
      <div
        onClick={() => { setOpen(true); setQuery(""); setTimeout(() => inputRef.current?.focus(), 40); }}
        className={`flex items-center gap-2.5 p-2.5 cursor-pointer select-none border rounded-xl bg-gray-50 min-h-[42px] transition-all ${open ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"}`}
      >
        {selected?.avatar && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: getColor(selected.label) }}>
            {selected.avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <div className="text-sm font-semibold text-gray-900 truncate">{selected.label}</div>
              {selected.sub && <div className="text-[11px] text-gray-500 mt-0.5">{selected.sub}</div>}
            </>
          ) : <span className="text-sm text-gray-400">{placeholder}</span>}
        </div>
        <span className="text-gray-500 transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}><IcChevron /></span>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-[600] max-h-72 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500">
              <IcSearch />
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="border-0 bg-transparent outline-none text-sm w-full text-gray-900 placeholder-gray-400" />
              {query && <button onClick={() => setQuery("")} className="text-gray-400"><IcClose s={12} /></button>}
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0
              ? <div className="p-5 text-center text-sm text-gray-500">No results</div>
              : filtered.map((opt) => {
                const active = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2.5 transition-colors ${active ? "bg-orange-50" : "hover:bg-gray-50"}`}
                    style={{ borderLeft: active ? "3px solid #f97316" : "3px solid transparent" }}
                  >
                    {opt.avatar && <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: getColor(opt.label) }}>{opt.avatar}</div>}
                    <div className="flex-1">
                      <div className={`text-sm ${active ? "text-orange-600 font-bold" : "text-gray-900 font-medium"}`}>{opt.label}</div>
                      {opt.sub && <div className="text-[11px] text-gray-500">{opt.sub}</div>}
                    </div>
                    {active && <span className="text-orange-500 text-sm">✓</span>}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

const Drawer = ({ open, onClose, title, subtitle, children }) => (
  <>
    <div onClick={onClose} className={`fixed inset-0 bg-slate-900/40 z-[400] transition-all backdrop-blur-sm ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
    <div className={`${styles.drawerPanel} transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className={styles.drawerHeader}>
        <div>
          <h3 className={styles.drawerTitle}>{title}</h3>
          {subtitle && <p className={styles.drawerSubtitle}>{subtitle}</p>}
        </div>
        <button onClick={onClose} className={styles.drawerCloseBtn}><IcClose /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  </>
);

const Badge = ({ returned }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${returned ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-600 border-orange-200"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${returned ? "bg-green-600" : "bg-orange-500"}`} />
    {returned ? "Returned" : "Assigned"}
  </span>
);

const Spin = ({ size = 24, color = "#f97316" }) => (
  <div className="inline-block rounded-full animate-spin border-2 border-slate-200" style={{ width: size, height: size, borderTopColor: color }} />
);

export default function AssetAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [delTarget, setDelTarget] = useState(null);

  const toast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [asgn, asst, usrs] = await Promise.all([api("/assets-assignments/"), api("/assets/"), api("/auth/all")]);
      setAssignments(asgn.data || []);
      const assetArr = Array.isArray(asst) ? asst : asst.data || asst.assets || [];
      setAssets(assetArr);
      const userArr = usrs.users || usrs.data || [];
      setUsers(userArr);
    } catch (e) { toast(e.message, "error"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const assetOpts = assets.map((a) => ({ value: a.id, label: a.asset_name, sub: a.asset_code, avatar: a.asset_name?.[0]?.toUpperCase() }));
  const userOpts = users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}`, sub: u.employee_code, avatar: `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`.toUpperCase() }));

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const closeDrawer = () => { setDrawer(null); setSelected(null); setForm({}); };
  const openCreate = () => { setForm({ assigned_date: new Date().toISOString().slice(0, 10) }); setDrawer("create"); };
  const openEdit = (row) => { setSelected(row); setForm({ asset_id: row.asset_id, user_id: row.user_id, assigned_date: row.assigned_date?.slice(0, 10), condition_at_assignment: row.condition_at_assignment, remarks: row.remarks }); setDrawer("edit"); };
  const openReturn = (row) => { setSelected(row); setForm({ return_date: new Date().toISOString().slice(0, 10), condition_at_return: "" }); setDrawer("return"); };
  const openView = async (row) => {
    try { const r = await api(`/assets-assignments/${row.id}`); setSelected(r.data || row); } catch { setSelected(row); }
    setDrawer("view");
  };

  const handleCreate = async () => {
    if (!form.asset_id || !form.user_id || !form.assigned_date) { toast("Fill all required fields", "error"); return; }
    setSubmitting(true);
    try { await api("/assets-assignments/assign", { method: "POST", body: JSON.stringify({ ...form, asset_id: +form.asset_id, user_id: +form.user_id }) }); toast("Asset assigned successfully!"); closeDrawer(); loadAll(); } catch (e) { toast(e.message, "error"); } finally { setSubmitting(false); }
  };
  const handleReturn = async () => {
    if (!form.return_date) { toast("Return date required", "error"); return; }
    setSubmitting(true);
    try { await api(`/assets-assignments/return/${selected.id}`, { method: "PUT", body: JSON.stringify(form) }); toast("Asset returned successfully!"); closeDrawer(); loadAll(); } catch (e) { toast(e.message, "error"); } finally { setSubmitting(false); }
  };
  const handleDelete = async () => {
    try { await api(`/assets-assignments/delete/${delTarget.id}`, { method: "DELETE" }); toast("Assignment deleted!"); setDelTarget(null); loadAll(); } catch (e) { toast(e.message, "error"); }
  };

  const filtered = assignments.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.asset?.asset_name?.toLowerCase().includes(q) || a.asset?.asset_code?.toLowerCase().includes(q) || `${a.user?.first_name} ${a.user?.last_name}`.toLowerCase().includes(q);
  });

  const stats = [
    { label: "Total", value: assignments.length, color: "#f97316", bg: "bg-orange-50", iconColor: "text-orange-500", d: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" },
    { label: "Assigned", value: assignments.filter((a) => !a.return_date).length, color: "#3b82f6", bg: "bg-blue-50", iconColor: "text-blue-500", d: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" },
    { label: "Returned", value: assignments.filter((a) => a.return_date).length, color: "#16a34a", bg: "bg-green-50", iconColor: "text-green-600", d: "M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1" },
  ];

  const avatarColor = (name = "") => {
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const tableHeaders = ["#", "Asset", "Assigned To", "Assigned By", "Assigned Date", "Return Date", "Status", "Actions"];

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} />

      {/* Header */}
      <div className={styles.header}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
            <IcBriefcase s={20} color="#fff" />
          </div>
          <div>
            <div className={styles.breadcrumb}>
              Assets &rsaquo; <span className={styles.breadcrumbActive}>Assignment</span>
            </div>
            <h1 className={styles.pageTitle}>Asset Assignments</h1>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={loadAll} className={styles.btnIcon}><IcRefresh /></button>
            <button onClick={openCreate} className={styles.btnPrimary}><IcPlus /> Assign Asset</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>{s.label}</div>
                <div className="text-2xl font-black" style={{ color: s.color }}>
                  {loading ? <Spin size={20} color={s.color} /> : s.value}
                </div>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>
                <Ic d={s.d} s={18} c={s.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className={styles.searchWrap}>
          <div className={styles.searchInner}>
            <div className="relative flex-1 text-gray-400">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcSearch /></span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search asset or employee..."
                className={styles.searchInput}
              />
            </div>
            <span className={styles.resultCount}>{filtered.length} results</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spin size={32} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>No assignments found</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={styles.thead}>
                    <tr>
                      {tableHeaders.map((h) => (
                        <th key={h} className={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((row, idx) => {
                      const userName = row.user ? `${row.user.first_name} ${row.user.last_name}` : `User #${row.user_id}`;
                      const isReturned = !!row.return_date;
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/80 transition">
                          <td className={`${styles.td} text-gray-500 font-medium`}>{idx + 1}</td>
                          <td className={styles.td}>
                            <div className={styles.cellPrimary}>{row.asset?.asset_name || `Asset #${row.asset_id}`}</div>
                            <div className={styles.cellSub}>{row.asset?.asset_code}</div>
                          </td>
                          <td className={styles.td}>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: avatarColor(userName) }}>
                                {`${row.user?.first_name?.[0] || ""}${row.user?.last_name?.[0] || ""}`.toUpperCase() || "?"}
                              </div>
                              <span className="font-medium text-gray-900">{userName}</span>
                            </div>
                          </td>
                          <td className={`${styles.td} text-gray-600`}>
                            {row.assigner ? `${row.assigner.first_name} ${row.assigner.last_name}` : "—"}
                          </td>
                          <td className={`${styles.td} text-gray-700 whitespace-nowrap`}>{fmtDate(row.assigned_date)}</td>
                          <td className={`${styles.td} text-gray-700 whitespace-nowrap`}>{row.return_date ? fmtDate(row.return_date) : "—"}</td>
                          <td className={styles.td}><Badge returned={isReturned} /></td>
                          <td className={styles.td}>
                            <div className="flex gap-1.5">
                              <button onClick={() => openView(row)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="View"><IcEye s={14} /></button>
                              {!isReturned && (
                                <>
                                  <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition" title="Edit"><IcEdit s={14} /></button>
                                  <button onClick={() => openReturn(row)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="Return"><IcReturn s={14} /></button>
                                </>
                              )}
                              <button onClick={() => setDelTarget(row)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition" title="Delete"><IcTrash s={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((row) => {
                  const userName = row.user ? `${row.user.first_name} ${row.user.last_name}` : `User #${row.user_id}`;
                  const isReturned = !!row.return_date;
                  return (
                    <div key={row.id} className={styles.mobileCard}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className={styles.mobileAssetName}>{row.asset?.asset_name || `Asset #${row.asset_id}`}</div>
                          <div className={styles.mobileAssetCode}>{row.asset?.asset_code}</div>
                        </div>
                        <Badge returned={isReturned} />
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: avatarColor(userName) }}>
                          {`${row.user?.first_name?.[0] || ""}${row.user?.last_name?.[0] || ""}`.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{userName}</div>
                          <div className="text-[11px] text-gray-500">
                            Assigned by: {row.assigner ? `${row.assigner.first_name} ${row.assigner.last_name}` : "—"}
                          </div>
                        </div>
                      </div>
                      <div className={styles.mobileDateBox}>
                        <div>
                          <span className={styles.mobileDateLabel}>Assigned: </span>
                          <span className={styles.mobileDateVal}>{fmtDate(row.assigned_date)}</span>
                        </div>
                        <div>
                          <span className={styles.mobileDateLabel}>Returned: </span>
                          <span className={`font-medium ${row.return_date ? "text-green-600" : "text-gray-500"}`}>
                            {row.return_date ? fmtDate(row.return_date) : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => openView(row)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold border border-blue-100 hover:bg-blue-100 transition"><IcEye s={12} /> View</button>
                        {!isReturned && (
                          <>
                            <button onClick={() => openEdit(row)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-semibold border border-orange-100 hover:bg-orange-100 transition"><IcEdit s={12} /> Edit</button>
                            <button onClick={() => openReturn(row)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold border border-green-100 hover:bg-green-100 transition"><IcReturn s={12} /> Return</button>
                          </>
                        )}
                        <button onClick={() => setDelTarget(row)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold border border-red-100 hover:bg-red-100 transition"><IcTrash s={12} /> Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE DRAWER */}
      <Drawer open={drawer === "create"} onClose={closeDrawer} title="Assign Asset" subtitle="Assign an asset to an employee">
        <div className="space-y-5">
          <div><label className={styles.label}>Asset *</label><SearchableSelect options={assetOpts} value={form.asset_id || ""} onChange={(v) => setF("asset_id", v)} placeholder="Select asset..." /></div>
          <div><label className={styles.label}>Assign To *</label><SearchableSelect options={userOpts} value={form.user_id || ""} onChange={(v) => setF("user_id", v)} placeholder="Search employee..." /></div>
          <div><label className={styles.label}>Assigned Date *</label><input type="date" className={styles.input} value={form.assigned_date || ""} onChange={(e) => setF("assigned_date", e.target.value)} /></div>
          <div><label className={styles.label}>Condition at Assignment</label><input className={styles.input} placeholder="e.g. Brand new" value={form.condition_at_assignment || ""} onChange={(e) => setF("condition_at_assignment", e.target.value)} /></div>
          <div><label className={styles.label}>Remarks</label><textarea rows={3} className={styles.textarea} value={form.remarks || ""} onChange={(e) => setF("remarks", e.target.value)} /></div>
          <div className="flex gap-3 pt-3">
            <button onClick={closeDrawer} className={styles.btnCancel}>Cancel</button>
            <button onClick={handleCreate} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-md disabled:opacity-70 hover:from-orange-600 hover:to-orange-700 transition">
              {submitting ? "Processing..." : "Assign Asset"}
            </button>
          </div>
        </div>
      </Drawer>

      {/* EDIT DRAWER */}
      <Drawer open={drawer === "edit"} onClose={closeDrawer} title="Edit Assignment" subtitle={`ID #${selected?.id}`}>
        <div className="space-y-5">
          <div><label className={styles.label}>Asset *</label><SearchableSelect options={assetOpts} value={form.asset_id || ""} onChange={(v) => setF("asset_id", v)} placeholder="Select asset..." /></div>
          <div><label className={styles.label}>Assign To *</label><SearchableSelect options={userOpts} value={form.user_id || ""} onChange={(v) => setF("user_id", v)} placeholder="Search employee..." /></div>
          <div><label className={styles.label}>Assigned Date *</label><input type="date" className={styles.input} value={form.assigned_date || ""} onChange={(e) => setF("assigned_date", e.target.value)} /></div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            ⚠️ Use the <strong>Return</strong> action to mark asset as returned.
          </div>
          <div className="flex gap-3">
            <button onClick={closeDrawer} className={styles.btnCancel}>Cancel</button>
            <button onClick={handleCreate} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-md disabled:opacity-70 hover:from-orange-600 hover:to-orange-700 transition">
              Save Changes
            </button>
          </div>
        </div>
      </Drawer>

      {/* VIEW DRAWER */}
      <Drawer open={drawer === "view"} onClose={closeDrawer} title="Assignment Details" subtitle="Full record">
        {selected && (
          <div className="space-y-3">
            <div className="bg-orange-50 p-4 rounded-xl flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                <IcBriefcase s={22} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-orange-500 truncate">{selected.asset?.asset_name || `Asset #${selected.asset_id}`}</div>
                <div className="text-xs text-gray-500">{selected.asset?.asset_code} · ID #{selected.id}</div>
              </div>
              <Badge returned={!!selected.return_date} />
            </div>
            <div className={styles.detailWrap}>
              {[
                ["Assigned To", selected.user ? `${selected.user.first_name} ${selected.user.last_name}` : `User #${selected.user_id}`],
                ["Assigned By", selected.assigner ? `${selected.assigner.first_name} ${selected.assigner.last_name}` : "—"],
                ["Assigned Date", fmtDate(selected.assigned_date)],
                ["Return Date", selected.return_date ? fmtDate(selected.return_date) : "Not yet"],
                ["Condition (Assign)", selected.condition_at_assignment || "—"],
                ["Condition (Return)", selected.condition_at_return || "—"],
                ["Remarks", selected.remarks || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <span className={styles.detailLabel}>{label}</span>
                  <span className={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
            {!selected.return_date && (
              <button
                onClick={() => { closeDrawer(); openReturn(selected); }}
                className="w-full mt-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                <IcReturn /> Mark as Returned
              </button>
            )}
          </div>
        )}
      </Drawer>

      {/* RETURN DRAWER */}
      <Drawer open={drawer === "return"} onClose={closeDrawer} title="Return Asset" subtitle="Record return details">
        {selected && (
          <div className="space-y-5">
            <div className="bg-green-50 p-3 rounded-xl text-sm text-green-800 border border-green-200">
              <strong>Returning:</strong> {selected.asset?.asset_name} from {selected.user?.first_name} {selected.user?.last_name}
            </div>
            <div><label className={styles.label}>Return Date *</label><input type="date" className={styles.input} value={form.return_date || ""} onChange={(e) => setF("return_date", e.target.value)} /></div>
            <div><label className={styles.label}>Condition at Return</label><textarea rows={3} className={styles.textarea} placeholder="e.g. Good, minor scratches" value={form.condition_at_return || ""} onChange={(e) => setF("condition_at_return", e.target.value)} /></div>
            <div className="flex gap-3">
              <button onClick={closeDrawer} className={styles.btnCancel}>Cancel</button>
              <button onClick={handleReturn} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-md disabled:opacity-70 hover:from-orange-600 hover:to-orange-700 transition">
                Confirm Return
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* DELETE MODAL */}
      {delTarget && (
        <div className="fixed inset-0 bg-slate-900/50 z-[600] backdrop-blur-sm flex items-center justify-center p-4">
          <div className={styles.delModal}>
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
              <IcTrash s={24} />
            </div>
            <h3 className={styles.delTitle}>Delete Assignment</h3>
            <p className={styles.delBody}>You're about to delete assignment for</p>
            <p className={styles.delAsset}>{delTarget.asset?.asset_name || `Asset #${delTarget.asset_id}`}</p>
            <div className="bg-red-50 text-red-700 text-xs p-2 rounded-lg text-center mt-4 border border-red-200">
              ⚠️ This action cannot be undone.
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDelTarget(null)} className={styles.btnCancel}>Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-md transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}