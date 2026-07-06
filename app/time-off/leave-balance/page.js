"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Scale, Search, X, Loader2, CheckCircle2, XCircle,
  SlidersHorizontal, UserRound, Wallet, CalendarDays,
  TrendingUp, RefreshCw, ChevronDown, BadgeCheck,
  Clock, Coins, ChevronLeft, ChevronRight,
} from "lucide-react";

/* ─── API endpoints ──────────────────────────────────── */
const API_BALANCE = "http://localhost:8080/api/leave-balances";
const API_LEAVES  = "http://localhost:8080/api/leaves";   // GET /api/leaves/ → all leaves with user info
const API_TYPES   = "http://localhost:8080/api/leave-types";
const API_USERS   = "http://localhost:8080/api/auth/all";

const ITEMS_PER_PAGE = 3; // 3 cards per page

/* ─── Auth helpers ───────────────────────────────────── */
const getToken     = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const getRole      = () => (typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "");
const isPrivileged = () => ["admin", "project_manager", "hr"].includes(getRole());
const authHeaders  = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ─── Status config ──────────────────────────────────── */
const STATUS_CFG = {
  approved:  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-400" },
  pending:   { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200",   dot: "bg-amber-400"   },
  rejected:  { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-400"     },
  cancelled: { bg: "bg-gray-100",   text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400"    },
};

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto border
            ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {t.type === "success"
            ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            : <XCircle      size={16} className="text-red-500 shrink-0" />}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════ */
function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);

  // build page numbers with ellipsis
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 px-1">
      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{" "}
        <span className="font-semibold text-gray-600">{totalItems}</span> records
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`el-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all border
                ${currentPage === p
                  ? "bg-[#ff8c42] text-white border-[#ff8c42] shadow-sm shadow-orange-200"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LEAVE CARD  (uses /api/leaves/ response shape)
═══════════════════════════════════════════════════════ */
function LeaveCard({ leave, leaveTypes = []  }) {
  const status = leave.status || "pending";
  const s      = STATUS_CFG[status] || STATUS_CFG.pending;
  const user   = leave.user;
  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "U";
  const fullName = user ? `${user.first_name} ${user.last_name}` : `User #${leave.user_id}`;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all">

      {/* Top: user + status */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{fullName}</p>
            <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{user?.email || ""}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Leave type + ID */}
      <div className="flex items-center justify-between mb-3">
        {/* <p className="text-sm font-medium text-gray-700">Leave Type #{leave.leave_type_id}</p> */}
        <p className="text-sm font-medium text-gray-700">
  {leaveTypes.find(lt => lt.id === leave.leave_type_id)?.name || "Unknown"} #{leave.leave_type_id}
</p>
        <span className="text-xs text-gray-400 font-mono">#{String(leave.id).padStart(3, "0")}</span>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">From</p>
          <p className="text-sm font-semibold text-gray-700">{fmtDate(leave.from_date)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">To</p>
          <p className="text-sm font-semibold text-gray-700">{fmtDate(leave.to_date)}</p>
        </div>
      </div>

      {/* Days + Applied on */}
      <div className="flex items-center justify-between">
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <CalendarDays size={13} className="text-orange-500" />
          <span className="text-sm font-bold text-orange-600">{parseFloat(leave.total_days)}</span>
          <span className="text-xs text-orange-400">days</span>
        </div>
        <p className="text-[11px] text-gray-400">
          Applied {new Date(leave.applied_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </p>
      </div>

      {/* Reason */}
      {leave.reason && (
        <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 line-clamp-1 italic">
          "{leave.reason}"
        </p>
      )}

      {/* Review comment */}
      {leave.review_comments && (
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 line-clamp-2">
          💬 {leave.review_comments}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   USER SELECT (reusable)
═══════════════════════════════════════════════════════ */
function UserSelect({ users, value, onChange, error, placeholder = "Select user..." }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border text-sm text-black focus:outline-none focus:ring-2 transition-all
          ${error ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
      >
        <option value="">{placeholder}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BALANCE MODAL
═══════════════════════════════════════════════════════ */
function UserBalanceModal({ open, onClose, data, userName }) {
  if (!open) return null;
  const totalAllocated = data.reduce((s, b) => s + Number(b.total_allocated), 0);
  const totalUsed      = data.reduce((s, b) => s + Number(b.used), 0);
  const totalRemaining = data.reduce((s, b) => s + Number(b.remaining), 0);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1e2a4a] flex items-center justify-center">
              <UserRound size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{userName || "User"} — Leave Balance</p>
              <p className="text-xs text-gray-400">{data.length} leave type(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Allocated", value: totalAllocated, color: "text-blue-600",    bg: "bg-blue-50",    icon: Wallet },
              { label: "Days Used",       value: totalUsed,      color: "text-red-500",     bg: "bg-red-50",     icon: TrendingUp },
              { label: "Remaining",       value: totalRemaining, color: "text-emerald-600", bg: "bg-emerald-50", icon: CalendarDays },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <Icon size={16} className={`${color} mx-auto mb-1`} />
                <p className={`text-2xl font-bold ${color}`}>{value.toFixed(0)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {data.length === 0 ? (
            <div className="text-center py-10">
              <Scale size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No balance records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((b) => {
                const pct = Math.min(100, (Number(b.used) / Number(b.total_allocated)) * 100) || 0;
                return (
                  <div key={b.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{b.leave_type?.name || `Type #${b.leave_type_id}`}</p>
                        <p className="text-xs text-gray-400">Year: {b.year}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                        ${pct >= 80 ? "bg-red-50 text-red-600" : pct >= 50 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {(100 - pct).toFixed(0)}% left
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {[
                        { label: "Allocated", value: b.total_allocated, color: "text-blue-600",    icon: Wallet },
                        { label: "Used",      value: b.used,            color: "text-red-500",     icon: TrendingUp },
                        { label: "Remaining", value: b.remaining,       color: "text-emerald-600", icon: CalendarDays },
                        { label: "Carry Fwd", value: b.carry_forward,   color: "text-purple-600",  icon: BadgeCheck },
                        { label: "Encashed",  value: b.encashed,        color: "text-amber-600",   icon: Coins },
                      ].map(({ label, value, color, icon: Icon }) => (
                        <div key={label} className="text-center bg-white rounded-xl py-2.5 px-1 border border-gray-100">
                          <Icon size={12} className={`${color} mx-auto mb-0.5`} />
                          <p className={`text-lg font-bold ${color}`}>{Number(value).toFixed(0)}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700
                        ${pct >= 80 ? "bg-red-400" : pct >= 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   INITIALIZE DRAWER
═══════════════════════════════════════════════════════ */
function InitDrawer({ open, onClose, onSubmit, loading, users }) {
  const [form, setForm]     = useState({ user_id: "", year: new Date().getFullYear() });
  const [errors, setErrors] = useState({});
  useEffect(() => { if (open) { setForm({ user_id: "", year: new Date().getFullYear() }); setErrors({}); } }, [open]);

  const validate = () => {
    const e = {};
    if (!form.user_id) e.user_id = "Please select a user";
    if (!form.year || isNaN(form.year)) e.year = "Valid year required";
    setErrors(e); return !Object.keys(e).length;
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center"><RefreshCw size={17} className="text-white" /></div>
            <div><p className="font-semibold text-gray-900">Initialize Leave Balance</p><p className="text-xs text-gray-400">Allocate leave quota for a new year</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            This will create leave balance records for <strong>all active leave types</strong> for the selected user and year.
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">User *</label>
            <UserSelect users={users} value={form.user_id} onChange={(v) => setForm({ ...form, user_id: v })} error={errors.user_id} />
            {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Year *</label>
            <input type="number"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.year ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
              value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (validate()) onSubmit({ user_id: Number(form.user_id), year: Number(form.year) }); }}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e67a30] flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Initialize
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   ADJUST DRAWER
═══════════════════════════════════════════════════════ */
function AdjustDrawer({ open, onClose, onSubmit, loading, leaveTypes, users }) {
  const [form, setForm]     = useState({ user_id: "", leave_type_id: "", year: new Date().getFullYear(), adjustment_days: "" });
  const [errors, setErrors] = useState({});
  useEffect(() => { if (open) { setForm({ user_id: "", leave_type_id: "", year: new Date().getFullYear(), adjustment_days: "" }); setErrors({}); } }, [open]);

  const validate = () => {
    const e = {};
    if (!form.user_id) e.user_id = "Please select a user";
    if (!form.leave_type_id) e.leave_type_id = "Required";
    if (!form.year) e.year = "Required";
    if (form.adjustment_days === "" || isNaN(form.adjustment_days)) e.adjustment_days = "Enter a valid number (+/-)";
    setErrors(e); return !Object.keys(e).length;
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center"><SlidersHorizontal size={17} className="text-white" /></div>
            <div><p className="font-semibold text-gray-900">Adjust Leave Balance</p><p className="text-xs text-gray-400">Add or deduct days from a user's balance</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">User *</label>
            <UserSelect users={users} value={form.user_id} onChange={(v) => setForm({ ...form, user_id: v })} error={errors.user_id} />
            {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Leave Type *</label>
            <div className="relative">
              <select
                className={`w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border text-sm text-black focus:outline-none focus:ring-2 transition-all ${errors.leave_type_id ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
                value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
                <option value="">Select leave type...</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {errors.leave_type_id && <p className="text-xs text-red-500 mt-1">{errors.leave_type_id}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Year *</label>
            <input type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all"
              value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Adjustment Days *</label>
            <input type="number"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-black focus:outline-none focus:ring-2 transition-all ${errors.adjustment_days ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
              placeholder="e.g. +5 or -2" value={form.adjustment_days} onChange={(e) => setForm({ ...form, adjustment_days: e.target.value })} />
            {errors.adjustment_days && <p className="text-xs text-red-500 mt-1">{errors.adjustment_days}</p>}
            <p className="text-xs text-gray-400 mt-1">Use positive (+) to add days, negative (-) to deduct</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (validate()) onSubmit({ user_id: Number(form.user_id), leave_type_id: Number(form.leave_type_id), year: Number(form.year), adjustment_days: Number(form.adjustment_days) }); }}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e67a30] flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />} Adjust
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   VIEW USER DRAWER
═══════════════════════════════════════════════════════ */
function ViewUserDrawer({ open, onClose, users }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading]               = useState(false);
  const [modalOpen, setModalOpen]           = useState(false);
  const [balanceData, setBalanceData]       = useState([]);
  const [userName, setUserName]             = useState("");

  useEffect(() => { if (open) { setSelectedUserId(""); setBalanceData([]); setModalOpen(false); } }, [open]);

  const handleSearch = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BALANCE}/user/${selectedUserId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setBalanceData(data.data);
        const u = users.find((u) => String(u.id) === String(selectedUserId));
        setUserName(u ? `${u.first_name} ${u.last_name}` : `User #${selectedUserId}`);
        setModalOpen(true);
      }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center"><UserRound size={17} className="text-white" /></div>
            <div><p className="font-semibold text-gray-900">View User Balance</p><p className="text-xs text-gray-400">Look up balance for any user</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex-1 px-6 py-6 space-y-3">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Select Employee</label>
          <UserSelect users={users} value={selectedUserId} onChange={setSelectedUserId} placeholder="Choose an employee..." />
          <button onClick={handleSearch} disabled={loading || !selectedUserId}
            className="w-full px-4 py-2.5 bg-[#1e2a4a] text-white rounded-xl text-sm font-semibold hover:bg-[#2a3a5a] disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} View Balance
          </button>
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500">
            Select an employee and click <strong>View Balance</strong> to see their full leave balance details.
          </div>
        </div>
      </div>
      <UserBalanceModal open={modalOpen} onClose={() => setModalOpen(false)} data={balanceData} userName={userName} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function LeaveBalancePage() {
  const privileged = isPrivileged();

  const [allLeaves,   setAllLeaves]   = useState([]);
  const [leaveTypes,  setLeaveTypes]  = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [initDrawer,     setInitDrawer]     = useState(false);
  const [adjustDrawer,   setAdjustDrawer]   = useState(false);
  const [viewUserDrawer, setViewUserDrawer] = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [toasts,         setToasts]         = useState([]);

  const addToast    = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  /* ── GET http://localhost:8080/api/leaves/ ── */
  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_LEAVES}/`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
      if (json.success) {
        setAllLeaves(json.data || []);
        setCurrentPage(1); // reset pagination on fresh load
      } else {
        throw new Error(json.message || "Failed to load leaves");
      }
    } catch (e) {
      addToast(e.message || "Failed to load leave data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res  = await fetch(`${API_TYPES}/`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setLeaveTypes(json.data || []);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res  = await fetch(API_USERS, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setUsers(json.users || json.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchLeaveTypes();
    if (privileged) fetchUsers();
  }, []);

  const handleInitialize = async (form) => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_BALANCE}/initialize`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { addToast("Leave balance initialized!"); setInitDrawer(false); fetchLeaves(); }
      else addToast(json.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  const handleAdjust = async (form) => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_BALANCE}/adjust`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { addToast("Balance adjusted!"); setAdjustDrawer(false); fetchLeaves(); }
      else addToast(json.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(allLeaves.length / ITEMS_PER_PAGE);
  const pageLeaves = allLeaves.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /* ── Summary stats ── */
  const totalLeaves    = allLeaves.length;
  const approvedLeaves = allLeaves.filter((l) => l.status === "approved").length;
  const pendingLeaves  = allLeaves.filter((l) => l.status === "pending").length;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 md:p-8">
      <Toast toasts={toasts} remove={removeToast} />

      {privileged && (
        <>
          <InitDrawer     open={initDrawer}     onClose={() => setInitDrawer(false)}     onSubmit={handleInitialize} loading={submitting} users={users} />
          <AdjustDrawer   open={adjustDrawer}   onClose={() => setAdjustDrawer(false)}   onSubmit={handleAdjust}     loading={submitting} leaveTypes={leaveTypes} users={users} />
          <ViewUserDrawer open={viewUserDrawer} onClose={() => setViewUserDrawer(false)} users={users} />
        </>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1e2a4a] flex items-center justify-center shadow-lg">
            <Scale size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Balance</h1>
            <p className="text-sm text-gray-500">
              {privileged ? "Track and manage employee leave allocations" : "Your leave balance overview"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchLeaves} title="Refresh"
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm">
            <RefreshCw size={16} />
          </button>
          {privileged && (
            <>
         <button
  onClick={() => setViewUserDrawer(true)}
  className="flex items-center gap-2 px-4 py-2.5 
  bg-white dark:bg-[#1f2937]
  border border-gray-200 dark:border-slate-700
  text-black dark:text-white
  rounded-xl text-sm font-medium
  hover:bg-gray-50 dark:hover:bg-[#273449]
  shadow-sm transition-all"
>
  <UserRound size={16} />
  View User
</button>

<button
  onClick={() => setAdjustDrawer(true)}
  className="flex items-center gap-2 px-4 py-2.5 
  bg-white dark:bg-[#1f2937]
  border border-gray-200 dark:border-slate-700
  text-black dark:text-white
  rounded-xl text-sm font-medium
  hover:bg-gray-50 dark:hover:bg-[#273449]
  shadow-sm transition-all"
>
  <SlidersHorizontal size={16} />
  Adjust
</button>
              <button onClick={() => setInitDrawer(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#ff8c42] text-white rounded-xl font-semibold text-sm hover:bg-[#e67a30] shadow-md shadow-orange-200 active:scale-95">
                <RefreshCw size={16} /> Initialize
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Leaves", value: totalLeaves,    icon: CalendarDays, iconBg: "bg-blue-50 text-blue-500",       textColor: "text-blue-600"    },
          { label: "Approved",     value: approvedLeaves, icon: TrendingUp,   iconBg: "bg-emerald-50 text-emerald-500", textColor: "text-emerald-600" },
          { label: "Pending",      value: pendingLeaves,  icon: Clock,        iconBg: "bg-amber-50 text-amber-500",     textColor: "text-amber-600"   },
        ].map(({ label, value, icon: Icon, iconBg, textColor }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}><Icon size={18} /></div>
            </div>
            <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">leave records</p>
          </div>
        ))}
      </div>

      {/* ── User Leave Balance ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">User Leave Balance</h2>
        {!loading && allLeaves.length > 0 && (
          <span className="text-xs text-gray-400">
            Page <span className="font-semibold text-gray-600">{currentPage}</span> of{" "}
            <span className="font-semibold text-gray-600">{totalPages}</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#ff8c42]" />
        </div>
      ) : allLeaves.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Scale size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No leave records found</p>
          <p className="text-sm text-gray-400 mt-1">
            {privileged ? "Initialize leave balance to get started" : "Contact your admin to initialize your balance"}
          </p>
          {privileged && (
            <button onClick={() => setInitDrawer(true)}
              className="mt-4 px-5 py-2.5 bg-[#ff8c42] text-white rounded-xl text-sm font-semibold hover:bg-[#e67a30] inline-flex items-center gap-2">
              <RefreshCw size={15} /> Initialize Balance
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 3 cards per page */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageLeaves.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} leaveTypes={leaveTypes} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={allLeaves.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}