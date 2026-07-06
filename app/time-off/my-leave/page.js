"use client";

import { useState, useEffect, useCallback } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : "";
const getRole = () =>
  typeof window !== "undefined" ? (localStorage.getItem("role") || "").toLowerCase() : "";
const isAdminOrHR = () =>
  ["admin", "hr", "project_manager"].includes(getRole());

// ─── status config ──────────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: "Pending",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   border: "border-amber-200",   accent: "#F59E0B", pill: "bg-amber-100 text-amber-700" },
  approved:  { label: "Approved",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", accent: "#10B981", pill: "bg-emerald-100 text-emerald-700" },
  rejected:  { label: "Rejected",  bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500",     border: "border-red-200",     accent: "#EF4444", pill: "bg-red-100 text-red-600" },
  cancelled: { label: "Cancelled", bg: "bg-slate-50",   text: "text-slate-500",   dot: "bg-slate-400",   border: "border-slate-200",   accent: "#94A3B8", pill: "bg-slate-100 text-slate-500" },
};

const API_BASE = "http://localhost:8080";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};
const buildSummary = (data) => ({
  total:    data.length,
  pending:  data.filter((d) => d.status === "pending").length,
  approved: data.filter((d) => d.status === "approved").length,
  rejected: data.filter((d) => d.status === "rejected").length,
});

// ═══════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: "calc(100vw - 2rem)" }}>
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl shadow-xl text-sm font-medium pointer-events-auto border backdrop-blur-sm ${t.type === "success" ? "bg-emerald-50/95 text-emerald-800 border-emerald-200" : "bg-red-50/95 text-red-800 border-red-200"}`}
          style={{ minWidth: "240px", maxWidth: "320px", animation: "slideInRight 0.3s ease-out" }}>
          <span className="text-base shrink-0">{t.type === "success" ? "✅" : "❌"}</span>
          <span className="flex-1 text-xs leading-snug">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="w-6 h-6 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-black/10 shrink-0 transition-all text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════════════════════
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[350] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-3xl shadow-2xl p-6" style={{ animation: "slideUp 0.25s ease-out" }}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
          <p className="font-bold text-gray-900 text-lg">{title}</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Keep It</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Cancel Leave
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APPLY / EDIT DRAWER
// ═══════════════════════════════════════════════════════════════════════════
function ApplyDrawer({ open, onClose, onSubmit, loading, leaveTypes, editLeave = null }) {
  const blank = { leave_type_id: "", from_date: "", to_date: "", reason: "" };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(editLeave ? {
        leave_type_id: String(editLeave.leave_type_id),
        from_date: editLeave.from_date?.slice(0, 10) || "",
        to_date:   editLeave.to_date?.slice(0, 10)   || "",
        reason:    editLeave.reason || "",
      } : blank);
      setErrors({});
    }
  }, [open, editLeave]);

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const validate = () => {
    const e = {};
    if (!form.leave_type_id) e.leave_type_id = "Select a leave type";
    if (!form.from_date) e.from_date = "Required";
    if (!form.to_date) e.to_date = "Required";
    if (form.from_date && form.to_date && form.from_date > form.to_date) e.to_date = "End date must be after start";
    if (!form.reason.trim()) e.reason = "Reason is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const isEdit = !!editLeave;

  const fieldClass = (hasErr) =>
    `w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-all bg-gray-50/60 font-medium
    ${hasErr
      ? "border-red-300 focus:border-red-400 focus:bg-red-50/30"
      : "border-gray-200 focus:border-orange-400 focus:bg-white focus:shadow-sm focus:shadow-orange-100"}`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed z-[210] bg-white shadow-2xl flex flex-col transition-all duration-300 ease-out
          bottom-0 left-0 right-0 rounded-t-3xl
          lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[480px] lg:rounded-none lg:rounded-l-3xl
          ${open ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}`}
        style={{ maxHeight: "93dvh", ...(typeof window !== "undefined" && window.innerWidth >= 1024 ? { maxHeight: "100vh" } : {}) }}
      >
        {/* Handle bar for mobile */}
        <div className="lg:hidden pt-3 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #1e2a4a 0%, #2d3f6f 100%)" }}>
              <span className="text-lg">{isEdit ? "✏️" : "📋"}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900">{isEdit ? "Edit Request" : "Apply for Leave"}</p>
              <p className="text-xs text-gray-400">{isEdit ? `Editing #${String(editLeave.id).padStart(3, "0")}` : "Submit a new leave request"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 text-black">
          {/* Leave Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Leave Type <span className="text-red-400">*</span>
            </label>
            <select
              className={fieldClass(!!errors.leave_type_id)}
              value={form.leave_type_id}
              onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
            >
              <option value="">Select leave type...</option>
              {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
            </select>
            {errors.leave_type_id && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.leave_type_id}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {[{ label: "From Date", key: "from_date" }, { label: "To Date", key: "to_date" }].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {label} <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  className={fieldClass(!!errors[key])}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
                {errors[key] && <p className="text-xs text-red-500 mt-1.5">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              className={`resize-none ${fieldClass(!!errors.reason)}`}
              placeholder="Briefly explain the reason for your leave..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
            {errors.reason && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠️</span>{errors.reason}</p>}
          </div>

          {isEdit && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed flex gap-2.5">
              <span className="shrink-0">⚠️</span>
              <span>Only <strong>pending</strong> leaves can be edited. Saving changes will reset the approval status.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50/50"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-white hover:border-gray-300 transition-all"
          >Cancel</button>
          <button
            onClick={() => { if (validate()) onSubmit(form); }}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-200 hover:scale-[1.01] active:scale-100"
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {isEdit ? "Save Changes" : "Submit Request"}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════
function DetailModal({ leave, leaveTypes, onClose, onEdit, onCancel, adminOrHR }) {
  if (!leave) return null;
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const s = STATUS[leave.status] || STATUS.pending;
  const typeName = leaveTypes.find((lt) => lt.id === leave.leave_type_id)?.name || `Type #${leave.leave_type_id}`;
  const lt = leaveTypes.find((lt) => lt.id === leave.leave_type_id);
  const canEdit = leave.status === "pending";
  const canCancel = ["pending", "approved"].includes(leave.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 text-bla" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92dvh", animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-3 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Status accent bar */}
        <div className="h-1 w-full rounded-t-3xl sm:rounded-t-3xl shrink-0" style={{ backgroundColor: s.accent }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-xl">🏖️</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{typeName}</p>
              <p className="text-xs text-gray-400">Leave #{String(leave.id).padStart(3, "0")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 shrink-0 ml-2 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Status badge */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${s.bg} ${s.border}`}>
            <span className={`w-3 h-3 rounded-full shrink-0 ${s.dot}`} style={{ boxShadow: `0 0 0 3px ${s.accent}30` }} />
            <span className={`font-bold ${s.text}`}>{s.label}</span>
            {leave.reviewed_at && <span className="text-xs text-gray-400 ml-auto">Reviewed {fmtDate(leave.reviewed_at)}</span>}
          </div>

          {/* Duration grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">From</p>
              <p className="text-sm font-bold text-gray-800 leading-snug">{fmtDate(leave.from_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">To</p>
              <p className="text-sm font-bold text-gray-800 leading-snug">{fmtDate(leave.to_date)}</p>
            </div>
            <div className="rounded-2xl p-3.5 text-center flex flex-col items-center justify-center border-2 border-orange-200 bg-orange-50">
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Days</p>
              <p className="text-2xl font-black text-orange-600 leading-none">{parseFloat(leave.total_days)}</p>
            </div>
          </div>

          {/* Leave type */}
          {lt && (
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Leave Type</p>
                <p className="font-bold text-gray-800 truncate">{lt.name}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${lt.is_paid ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                {lt.is_paid ? "✓ Paid" : "Unpaid"}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Reason</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-gray-700 text-sm leading-relaxed">{leave.reason}</div>
          </div>

          {/* Review comments */}
          {leave.review_comments && (
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Review Comments</p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-gray-700 text-sm leading-relaxed">{leave.review_comments}</div>
            </div>
          )}

          {/* Meta info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
            {[
              ["Applied At", fmtDateTime(leave.applied_at)],
              ["Leave ID", `#${String(leave.id).padStart(3, "0")}`],
              ["User ID", leave.user_id]
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-4">
                <span className="text-xs text-gray-400">{l}</span>
                <span className="text-xs font-semibold text-gray-700 text-right">{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pb-1" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}>
            {canEdit && (
              <button
                onClick={() => onEdit(leave)}
                className="w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md"
                style={{ background: "linear-gradient(135deg, #1e2a4a 0%, #2d3f6f 100%)" }}
              >
                <span>✏️</span> Edit Request
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(leave)}
                className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>🚫</span> Cancel Leave
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS PILL
// ═══════════════════════════════════════════════════════════════════════════
function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAVE CARD (mobile / tablet)
// ═══════════════════════════════════════════════════════════════════════════
function LeaveCard({ leave, getTypeName, onView, onEdit, onConfirmCancel }) {
  const s = STATUS[leave.status] || STATUS.pending;
  const canEdit = leave.status === "pending";
  const canCancel = ["pending", "approved"].includes(leave.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
      <div className="h-1 w-full" style={{ backgroundColor: s.accent }} />
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-800 text-sm leading-snug truncate">{getTypeName(leave.leave_type_id)}</p>
            <p className="text-xs text-gray-400 mt-0.5">#{String(leave.id).padStart(3, "0")} · Applied {fmtDate(leave.applied_at)}</p>
          </div>
          <StatusPill status={leave.status} />
        </div>

        {/* Duration row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">From</p>
            <p className="text-[11px] font-bold text-gray-700 leading-tight">{fmtDate(leave.from_date)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">To</p>
            <p className="text-[11px] font-bold text-gray-700 leading-tight">{fmtDate(leave.to_date)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
            <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Days</p>
            <p className="text-lg font-black text-orange-600 leading-none">{parseFloat(leave.total_days)}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Reason</p>
          <p className="text-xs text-gray-600 line-clamp-2">{leave.reason}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(leave)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors flex items-center justify-center gap-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(leave)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 transition-colors flex items-center justify-center gap-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onConfirmCancel(leave)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors flex items-center justify-center gap-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY CARD
// ═══════════════════════════════════════════════════════════════════════════
function SummaryCard({ icon, label, value, color, bg, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm transition-all duration-200 text-left w-full
        ${active ? "border-orange-300 shadow-orange-100 shadow-md ring-1 ring-orange-200" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}
    >
      <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center text-xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={`text-2xl font-black ${color} leading-none`}>{value}</p>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function MyLeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [applyDrawer, setApplyDrawer] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  const adminOrHR = isAdminOrHR();

  const fetchLeaves = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/my-leaves`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed");
      setLeaves(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leave-types/`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setLeaveTypes(json.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchLeaves(); fetchLeaveTypes(); }, []);

  const handleApply = async (form) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/apply`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ leave_type_id: Number(form.leave_type_id), from_date: form.from_date, to_date: form.to_date, reason: form.reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      addToast("Leave application submitted successfully!");
      setApplyDrawer(false);
      fetchLeaves();
    } catch (e) { addToast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (form) => {
    if (!editLeave) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/edit/${editLeave.id}`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ leave_type_id: Number(form.leave_type_id), from_date: form.from_date, to_date: form.to_date, reason: form.reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      addToast("Leave request updated!");
      setEditLeave(null); setSelectedLeave(null);
      fetchLeaves();
    } catch (e) { addToast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/cancel/${confirmCancel.id}`, { method: "DELETE", headers: authHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      addToast("Leave cancelled successfully!");
      setConfirmCancel(null); setSelectedLeave(null);
      fetchLeaves();
    } catch (e) { addToast(e.message, "error"); }
    finally { setCancelling(false); }
  };

  const filtered = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);
  const summary = buildSummary(leaves);
  const getTypeName = (id) => leaveTypes.find((lt) => lt.id === id)?.name || `Type #${id}`;

  const FILTERS = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending" },
    { key: "approved",  label: "Approved" },
    { key: "rejected",  label: "Rejected" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const summaryCards = [
    { key: "all",      label: "Total",    value: summary.total,    color: "text-blue-600",    bg: "bg-blue-50",    icon: "📋" },
    { key: "pending",  label: "Pending",  value: summary.pending,  color: "text-amber-600",   bg: "bg-amber-50",   icon: "⏳" },
    { key: "approved", label: "Approved", value: summary.approved, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✅" },
    { key: "rejected", label: "Rejected", value: summary.rejected, color: "text-red-500",     bg: "bg-red-50",     icon: "❌" },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: "#f8f9fc", overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { overflow-x: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .table-row-hover:hover { background: #fff8f5; }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      <ApplyDrawer
        open={applyDrawer || !!editLeave}
        onClose={() => { setApplyDrawer(false); setEditLeave(null); }}
        onSubmit={editLeave ? handleEdit : handleApply}
        loading={submitting}
        leaveTypes={leaveTypes}
        editLeave={editLeave}
      />

      {selectedLeave && (
        <DetailModal
          leave={selectedLeave}
          leaveTypes={leaveTypes}
          onClose={() => setSelectedLeave(null)}
          onEdit={(l) => { setSelectedLeave(null); setEditLeave(l); }}
          onCancel={(l) => { setSelectedLeave(null); setConfirmCancel(l); }}
          adminOrHR={adminOrHR}
        />
      )}

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel Leave?"
        message={`Are you sure you want to cancel Leave #${String(confirmCancel?.id || "").padStart(3, "0")}? This action cannot be undone.`}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(null)}
        loading={cancelling}
      />

      {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
              🏖️
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight">My Leave</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Track &amp; manage your leave requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchLeaves}
              disabled={refreshing}
              title="Refresh"
              className="w-10 h-10 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 flex items-center justify-center transition-all hover:bg-gray-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}>
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
            <button
              onClick={() => { setEditLeave(null); setApplyDrawer(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-200 hover:scale-[1.02] active:scale-100 transition-all whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="hidden sm:inline">Apply Leave</span>
              <span className="sm:hidden">Apply</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryCards.map((c) => (
            <SummaryCard
              key={c.key}
              icon={c.icon}
              label={c.label}
              value={c.value}
              color={c.color}
              bg={c.bg}
              onClick={() => setFilter(c.key)}
              active={filter === c.key}
            />
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {FILTERS.map((f) => {
            const count = f.key !== "all" ? leaves.filter((l) => l.status === f.key).length : leaves.length;
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 shrink-0
                  ${isActive
                    ? "text-white border-transparent shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500"}`}
                style={isActive ? { background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" } : {}}
              >
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-colors
                  ${isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading your leaves...</p>
          </div>
        ) : error ? (
          <div className="bg-white border-2 border-red-100 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-700 font-bold mb-1">Something went wrong</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button onClick={fetchLeaves} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center shadow-sm px-4" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="text-6xl mb-4">🌴</div>
            <p className="text-gray-800 font-bold text-lg mb-1">
              No {filter !== "all" ? filter : ""} leaves found
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {filter !== "all" ? `You have no ${filter} leave requests.` : "Apply for your first leave to get started."}
            </p>
            <button
              onClick={() => { setFilter("all"); setApplyDrawer(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md shadow-orange-100 hover:shadow-orange-200 transition-all"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Apply Leave
            </button>
          </div>
        ) : (
          <>
            {/* ── DESKTOP TABLE (lg+) ─────────────────────────────────── */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: "750px" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fc" }}>
                      {["#", "Leave Type", "Duration", "Days", "Reason", "Status", "Applied", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap border-b border-gray-100">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((leave, idx) => {
                      const canEdit = leave.status === "pending";
                      const canCancel = ["pending", "approved"].includes(leave.status);
                      return (
                        <tr
                          key={leave.id}
                          className={`table-row-hover transition-colors ${idx !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}
                        >
                          <td className="px-5 py-4 text-gray-400 font-mono text-xs font-bold">
                            {String(leave.id).padStart(3, "0")}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-gray-800 text-sm">{getTypeName(leave.leave_type_id)}</span>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                            <span className="font-medium">{fmtDate(leave.from_date)}</span>
                            <span className="text-gray-300 mx-1.5">→</span>
                            <span className="font-medium">{fmtDate(leave.to_date)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-orange-600 font-black text-sm">
                              {parseFloat(leave.total_days)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-xs max-w-[160px] truncate" title={leave.reason}>
                            {leave.reason}
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={leave.status} />
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap font-medium">
                            {fmtDate(leave.applied_at)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedLeave(leave)}
                                title="View"
                                className="w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => setEditLeave(leave)}
                                  title="Edit"
                                  className="w-8 h-8 rounded-lg text-amber-500 hover:bg-amber-50 flex items-center justify-center transition-colors"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  onClick={() => setConfirmCancel(leave)}
                                  title="Cancel"
                                  className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between" style={{ background: "#fafafa" }}>
                <p className="text-xs text-gray-400">
                  Showing <strong className="text-gray-600">{filtered.length}</strong> of <strong className="text-gray-600">{leaves.length}</strong> records
                </p>
                {filter !== "all" && (
                  <button onClick={() => setFilter("all")} className="text-xs text-orange-500 font-bold hover:text-orange-600 transition-colors">
                    View all →
                  </button>
                )}
              </div>
            </div>

            {/* ── TABLET TABLE (md) ───────────────────────────────────── */}
            <div className="hidden md:block lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: "600px" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fc" }}>
                      {["#", "Leave Type", "Duration", "Days", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap border-b border-gray-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((leave, idx) => {
                      const canEdit = leave.status === "pending";
                      const canCancel = ["pending", "approved"].includes(leave.status);
                      return (
                        <tr key={leave.id} className={`table-row-hover transition-colors ${idx !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                          <td className="px-4 py-3.5 text-gray-400 font-mono text-xs font-bold">{String(leave.id).padStart(3, "0")}</td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-gray-800 text-sm">{getTypeName(leave.leave_type_id)}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{leave.reason}</p>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                            {fmtDate(leave.from_date)} <span className="text-gray-300">→</span> {fmtDate(leave.to_date)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-black text-sm">
                              {parseFloat(leave.total_days)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5"><StatusPill status={leave.status} /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedLeave(leave)} className="w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              {canEdit && <button onClick={() => setEditLeave(leave)} className="w-8 h-8 rounded-lg text-amber-500 hover:bg-amber-50 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>}
                              {canCancel && <button onClick={() => setConfirmCancel(leave)} className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                              </button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400" style={{ background: "#fafafa" }}>
                Showing <strong className="text-gray-600">{filtered.length}</strong> of <strong className="text-gray-600">{leaves.length}</strong> records
              </div>
            </div>

            {/* ── MOBILE CARDS (sm) ───────────────────────────────────── */}
            <div className="md:hidden space-y-3" style={{ animation: "fadeIn 0.3s ease-out" }}>
              {filtered.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  getTypeName={getTypeName}
                  onView={setSelectedLeave}
                  onEdit={setEditLeave}
                  onConfirmCancel={setConfirmCancel}
                />
              ))}
              <p className="text-center text-xs text-gray-400 py-2">
                Showing {filtered.length} of {leaves.length} records
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}