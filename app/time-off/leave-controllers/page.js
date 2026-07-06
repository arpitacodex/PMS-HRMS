"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal, Plus, Search, X, Loader2, CheckCircle2,
  XCircle, Eye, Check, Ban, Clock, CalendarRange,
  AlertTriangle, RefreshCw, Pencil, FileX, ShieldCheck,
  ChevronDown, MessageSquare,
} from "lucide-react";

const API_LEAVES = "http://localhost:8080/api/leaves";
const API_TYPES  = "http://localhost:8080/api/leave-types";

const getToken    = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const getRole     = () => (typeof window !== "undefined" ? localStorage.getItem("role") : ""); // "admin" | "hr" | "employee"
const isAdminOrHR = () => ["admin", "hr", "project_manager"].includes((getRole() || "").toLowerCase());

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  approved:  { label: "Approved",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  rejected:  { label: "Rejected",  color: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-400" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200",      dot: "bg-gray-400" },
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

/* ─── Helpers ────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ─── Toast ────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto border
          ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {t.type === "success"
            ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            : <XCircle size={16} className="text-red-500 flex-shrink-0" />}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ─── Reject Reason Dialog ───────────────────────────── */
function RejectReasonDialog({ open, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (open) { setReason(""); setErr(""); } }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!reason.trim()) { setErr("Please provide a reason for rejection."); return; }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Ban size={20} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Reject Leave Application</p>
            <p className="text-sm text-gray-500">Provide a reason for the employee</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Rejection Reason *
          </label>
          <textarea
            rows={4}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none transition-all
              ${err ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-red-200 focus:border-red-400"}`}
            placeholder="Explain why this leave is being rejected..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (e.target.value.trim()) setErr(""); }}
          />
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <Ban size={14} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────── */
function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel = "Confirm", confirmColor = "bg-[#ff8c42]" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${confirmColor}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Apply Leave Drawer ─────────────────────────────── */
// function ApplyDrawer({ open, onClose, onSubmit, loading, leaveTypes }) {
//   const blank = { leave_type_id: "", from_date: "", to_date: "", reason: "" };
//   const [form, setForm] = useState(blank);
//   const [errors, setErrors] = useState({});

//   useEffect(() => { if (open) { setForm(blank); setErrors({}); } }, [open]);

//   const validate = () => {
//     const e = {};
//     if (!form.leave_type_id) e.leave_type_id = "Select a leave type";
//     if (!form.from_date) e.from_date = "Required";
//     if (!form.to_date) e.to_date = "Required";
//     if (form.from_date && form.to_date && form.from_date > form.to_date) e.to_date = "End date must be after start";
//     if (!form.reason.trim()) e.reason = "Reason is required";
//     setErrors(e);
//     return !Object.keys(e).length;
//   };

//   return (
//     <>
//       <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
//       <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
//         <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center">
//               <Plus size={18} className="text-white" />
//             </div>
//             <div>
//               <p className="font-semibold text-gray-900">Apply for Leave</p>
//               <p className="text-xs text-gray-400">Submit a new leave request</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
//         </div>
//         <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
//           <div>
//             <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Leave Type *</label>
//             <select className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.leave_type_id ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
//               value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
//               <option value="">Select leave type...</option>
//               {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
//             </select>
//             {errors.leave_type_id && <p className="text-xs text-red-500 mt-1">{errors.leave_type_id}</p>}
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">From Date *</label>
//               <input type="date" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.from_date ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
//                 value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
//               {errors.from_date && <p className="text-xs text-red-500 mt-1">{errors.from_date}</p>}
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">To Date *</label>
//               <input type="date" className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.to_date ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
//                 value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
//               {errors.to_date && <p className="text-xs text-red-500 mt-1">{errors.to_date}</p>}
//             </div>
//           </div>
//           <div>
//             <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Reason *</label>
//             <textarea rows={4} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none ${errors.reason ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
//               placeholder="Briefly explain the reason for your leave..."
//               value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
//             {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
//           </div>
//         </div>
//         <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
//           <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
//           <button onClick={() => { if (validate()) onSubmit(form); }} disabled={loading}
//             className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e67a30] transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
//             {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarRange size={16} />}
//             Submit Application
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }

/* ─── Edit Leave Drawer ───────────────────────────────── */
function EditDrawer({ open, onClose, onSubmit, loading, leaveTypes, initial }) {
  const [form, setForm] = useState({ leave_type_id: "", from_date: "", to_date: "", reason: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && initial) {
      setForm({
        leave_type_id: initial.leave_type_id || "",
        from_date: initial.from_date ? initial.from_date.split("T")[0] : "",
        to_date: initial.to_date ? initial.to_date.split("T")[0] : "",
        reason: initial.reason || "",
      });
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!form.leave_type_id) e.leave_type_id = "Required";
    if (!form.from_date) e.from_date = "Required";
    if (!form.to_date) e.to_date = "Required";
    if (!form.reason.trim()) e.reason = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center">
              <Pencil size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Edit Leave Application</p>
              <p className="text-xs text-gray-400">Modify your pending leave request</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Leave Type *</label>
            <select className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${errors.leave_type_id ? "border-red-300" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
              value={form.leave_type_id} onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
              <option value="">Select...</option>
              {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
            </select>
            {errors.leave_type_id && <p className="text-xs text-red-500 mt-1">{errors.leave_type_id}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">From *</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all"
                value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">To *</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all"
                value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Reason *</label>
            <textarea rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all resize-none"
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => { if (validate()) onSubmit(form); }} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e67a30] transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Leave Detail Drawer ────────────────────────────── */
function DetailDrawer({ open, onClose, leave, leaveTypes }) {
  if (!leave) return null;
  const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
  const leaveTypeName = leaveTypes.find((lt) => lt.id === leave.leave_type_id)?.name || `Type #${leave.leave_type_id}`;

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center">
              <Eye size={17} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Leave Details</p>
              <p className="text-xs text-gray-400">Application #{leave.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </div>
          {[
            { label: "Leave Type",  value: leaveTypeName },
            { label: "From Date",   value: fmtDate(leave.from_date) },
            { label: "To Date",     value: fmtDate(leave.to_date) },
            // { label: "Total Days",  value: `${leave.total_days} working day(s)` },
            { label: "Applied On",  value: fmtDate(leave.applied_at) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value}</span>
            </div>
          ))}

          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Reason</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{leave.reason || "No reason provided"}</p>
          </div>

          {/* Rejection reason — shown to employee if rejected */}
          {leave.status === "rejected" && leave.review_comments && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <MessageSquare size={12} /> Rejection Reason
              </p>
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {leave.review_comments}
              </div>
            </div>
          )}

          {leave.user && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Employee</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#ff8c42] flex items-center justify-center text-white text-xs font-bold">
                  {(leave.user.first_name?.[0] || "") + (leave.user.last_name?.[0] || "")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{leave.user.first_name} {leave.user.last_name}</p>
                  <p className="text-xs text-gray-400">{leave.user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Leave Row — Admin / HR view ───────────────────── */
function AdminLeaveRow({ leave, leaveTypes, onView, onApprove, onReject, index }) {
  const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
  const leaveTypeName = leaveTypes.find((lt) => lt.id === leave.leave_type_id)?.name || `Type #${leave.leave_type_id}`;
  const employeeName  = leave.user ? `${leave.user.first_name} ${leave.user.last_name}` : `User #${leave.user_id}`;

  return (
    <div className="px-4 md:px-6 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-12 items-center gap-2">
        <span className="col-span-1 text-sm text-gray-400 font-medium">{index + 1}</span>
        <div className="col-span-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{employeeName}</p>
          <p className="text-xs text-gray-400 truncate">{leave.user?.email}</p>
        </div>
        <div className="col-span-2">
          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">{leaveTypeName}</span>
        </div>
        <div className="col-span-2 text-sm text-gray-600">{fmtDate(leave.from_date)}</div>
        <div className="col-span-2 text-sm text-gray-600">{fmtDate(leave.to_date)}</div>
        {/* <div className="col-span-1 text-center">
          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{leave.total_days}d</span>
        </div> */}
        <div className="col-span-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
        </div>
        {/* 3 actions: View, Approve, Reject */}
        <div className="col-span-2 flex justify-end gap-1">
          <button onClick={() => onView(leave)} title="View"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <Eye size={14} />
          </button>
          {leave.status === "pending" && (
            <>
              <button onClick={() => onApprove(leave)} title="Approve"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <ShieldCheck size={14} />
              </button>
              <button onClick={() => onReject(leave)} title="Reject"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                <Ban size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{employeeName}</p>
            <p className="text-xs text-gray-400">{leaveTypeName} · {leave.total_days} days</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-3">{fmtDate(leave.from_date)} → {fmtDate(leave.to_date)}</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onView(leave)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors">
            <Eye size={12} /> View
          </button>
          {leave.status === "pending" && (
            <>
              <button onClick={() => onApprove(leave)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors">
                <ShieldCheck size={12} /> Approve
              </button>
              <button onClick={() => onReject(leave)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                <Ban size={12} /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Leave Row — Employee view ──────────────────────── */
function EmployeeLeaveRow({ leave, leaveTypes, onView, onEdit, onCancel, index }) {
  const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
  const leaveTypeName = leaveTypes.find((lt) => lt.id === leave.leave_type_id)?.name || `Type #${leave.leave_type_id}`;

  return (
    <div className="px-4 md:px-6 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-12 items-center gap-2">
        <span className="col-span-1 text-sm text-gray-400 font-medium">{index + 1}</span>
        <div className="col-span-3">
          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">{leaveTypeName}</span>
        </div>
        <div className="col-span-2 text-sm text-gray-600">{fmtDate(leave.from_date)}</div>
        <div className="col-span-2 text-sm text-gray-600">{fmtDate(leave.to_date)}</div>
        <div className="col-span-1 text-center">
          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{leave.total_days}d</span>
        </div>
        <div className="col-span-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
        </div>
        {/* 3 actions: View, Edit, Cancel */}
        <div className="col-span-1 flex justify-end gap-1">
          <button onClick={() => onView(leave)} title="View"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <Eye size={14} />
          </button>
          {leave.status === "pending" && (
            <>
              <button onClick={() => onEdit(leave)} title="Edit"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => onCancel(leave)} title="Cancel"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                <FileX size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{leaveTypeName}</p>
            <p className="text-xs text-gray-400">{leave.total_days} days</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${sc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-3">{fmtDate(leave.from_date)} → {fmtDate(leave.to_date)}</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onView(leave)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors">
            <Eye size={12} /> View
          </button>
          {leave.status === "pending" && (
            <>
              <button onClick={() => onEdit(leave)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => onCancel(leave)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                <FileX size={12} /> Cancel
              </button>
            </>
          )}
        </div>
        {/* Show rejection reason on mobile too */}
        {leave.status === "rejected" && leave.review_comments && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            <span className="font-semibold">Rejected: </span>{leave.review_comments}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export default function LeaveControllersPage() {
  const adminOrHR = isAdminOrHR();

  const [allLeaves, setAllLeaves]   = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [filterYear, setFilterYear] = useState(String(currentYear)); // employee year filter

  const [applyDrawer, setApplyDrawer]     = useState(false);
  const [editDrawer, setEditDrawer]       = useState(false);
  const [detailDrawer, setDetailDrawer]   = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [detailTarget, setDetailTarget]   = useState(null);

  // Approve confirm
  const [approveTarget, setApproveTarget] = useState(null);
  // Reject reason dialog
  const [rejectTarget, setRejectTarget]   = useState(null);
  // Cancel confirm
  const [cancelTarget, setCancelTarget]   = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts]         = useState([]);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = adminOrHR ? `${API_LEAVES}/` : `${API_LEAVES}/my-leaves`;
      const [lRes, tRes] = await Promise.all([
        fetch(endpoint,  { headers: authHeaders() }),
        fetch(`${API_TYPES}/`, { headers: authHeaders() }),
      ]);
      const [lData, tData] = await Promise.all([lRes.json(), tRes.json()]);
      if (lData.success) setAllLeaves(lData.data);
      if (tData.success) setLeaveTypes(tData.data);
    } catch { addToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, [adminOrHR]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Apply ── */
  const handleApply = async (form) => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_LEAVES}/apply`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...form, leave_type_id: Number(form.leave_type_id) }) });
      const data = await res.json();
      if (data.success) { addToast("Leave applied successfully!"); setApplyDrawer(false); fetchAll(); }
      else addToast(data.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  /* ── Edit ── */
  const handleEdit = async (form) => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_LEAVES}/edit/${editTarget.id}`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...form, leave_type_id: Number(form.leave_type_id) }) });
      const data = await res.json();
      if (data.success) { addToast("Leave updated!"); setEditDrawer(false); setEditTarget(null); fetchAll(); }
      else addToast(data.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  /* ── Approve ── */
  const handleApproveConfirm = async () => {
    const leave = approveTarget;
    setApproveTarget(null);
    try {
      const res  = await fetch(`${API_LEAVES}/approve/${leave.id}`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.success) { addToast("Leave approved!"); fetchAll(); }
      else addToast(data.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
  };

  /* ── Reject with reason ── */
  const handleRejectConfirm = async (reason) => {
    const leave = rejectTarget;
    setRejectTarget(null);
    try {
      const res  = await fetch(`${API_LEAVES}/reject/${leave.id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ review_comments: reason }),
      });
      const data = await res.json();
      if (data.success) { addToast("Leave rejected."); fetchAll(); }
      else addToast(data.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
  };

  /* ── Cancel ── */
  const handleCancelConfirm = async () => {
    const leave = cancelTarget;
    setCancelTarget(null);
    try {
      const res  = await fetch(`${API_LEAVES}/cancel/${leave.id}`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.success) { addToast("Leave cancelled."); fetchAll(); }
      else addToast(data.message || "Failed", "error");
    } catch { addToast("Network error", "error"); }
  };

  /* ── Filter ── */
  const filtered = allLeaves.filter((l) => {
    const matchStatus = filterStatus === "all" || l.status === filterStatus;

    // Year filter for employees
    const matchYear = adminOrHR
      ? true
      : (filterYear === "all" || new Date(l.applied_at).getFullYear() === Number(filterYear));

    const matchSearch =
      search === "" ||
      (l.user ? `${l.user.first_name} ${l.user.last_name}`.toLowerCase().includes(search.toLowerCase()) : true) ||
      l.status.includes(search.toLowerCase());

    return matchStatus && matchYear && matchSearch;
  });

  const counts = {
    all:       allLeaves.length,
    pending:   allLeaves.filter((l) => l.status === "pending").length,
    approved:  allLeaves.filter((l) => l.status === "approved").length,
    rejected:  allLeaves.filter((l) => l.status === "rejected").length,
    cancelled: allLeaves.filter((l) => l.status === "cancelled").length,
  };

  /* ── Column headers ── */
  const AdminHeader = () => (
    <div className="hidden lg:grid grid-cols-12 gap-2 px-6 py-3 border-b border-gray-100 text-[11px] font-bold uppercase tracking-widest text-gray-400">
      <span className="col-span-1">#</span>
      <span className="col-span-2">Employee</span>
      <span className="col-span-2">Leave Type</span>
      <span className="col-span-2">From</span>
      <span className="col-span-2">To</span>
      {/* <span className="col-span-1 text-center">Days</span> */}
      <span className="col-span-1">Status</span>
      <span className="col-span-2 text-right">Actions</span>
    </div>
  );

  const EmployeeHeader = () => (
    <div className="hidden lg:grid grid-cols-12 gap-2 px-6 py-3 border-b border-gray-100 text-[11px] font-bold uppercase tracking-widest text-gray-400">
      <span className="col-span-1">#</span>
      <span className="col-span-3">Leave Type</span>
      <span className="col-span-2">From</span>
      <span className="col-span-2">To</span>
      <span className="col-span-1 text-center">Days</span>
      <span className="col-span-2">Status</span>
      <span className="col-span-1 text-right">Actions</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 md:p-8">
      <Toast toasts={toasts} remove={removeToast} />

      {/* Approve confirm */}
      <ConfirmDialog
        open={!!approveTarget}
        title="Approve Leave"
        message="This will approve the leave and deduct days from the employee's balance."
        confirmLabel="Approve"
        confirmColor="bg-emerald-500 hover:bg-emerald-600"
        onConfirm={handleApproveConfirm}
        onCancel={() => setApproveTarget(null)}
      />

      {/* Reject reason dialog */}
      <RejectReasonDialog
        open={!!rejectTarget}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />

      {/* Cancel confirm */}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Leave"
        message="This will cancel your leave application. This action cannot be undone."
        confirmLabel="Cancel Leave"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />

      {/* <ApplyDrawer open={applyDrawer} onClose={() => setApplyDrawer(false)} onSubmit={handleApply} loading={submitting} leaveTypes={leaveTypes} /> */}
      <EditDrawer  open={editDrawer}  onClose={() => { setEditDrawer(false); setEditTarget(null); }} onSubmit={handleEdit} loading={submitting} leaveTypes={leaveTypes} initial={editTarget} />
      <DetailDrawer open={detailDrawer} onClose={() => { setDetailDrawer(false); setDetailTarget(null); }} leave={detailTarget} leaveTypes={leaveTypes} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1e2a4a] flex items-center justify-center shadow-lg">
            <SlidersHorizontal size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {adminOrHR ? "Users Leave" : "My Leaves"}
            </h1>
            <p className="text-sm text-gray-500">
              {adminOrHR ? "Manage, approve and track all leave applications" : "View and manage your leave applications"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={16} />
          </button>
          {/* <button onClick={() => setApplyDrawer(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff8c42] text-white rounded-xl font-semibold text-sm hover:bg-[#e67a30] transition-all shadow-md shadow-orange-200 active:scale-95">
            <Plus size={18} /> Apply Leave
          </button> */}
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {["all", "pending", "approved", "rejected", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border
              ${filterStatus === s ? "bg-[#1e2a4a] text-white border-[#1e2a4a] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            {s !== "all" && <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s]?.dot}`} />}
            <span className="capitalize">{s}</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${filterStatus === s ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search + Year filter (employee only) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all"
              placeholder={adminOrHR ? "Search by employee name or status..." : "Search by status..."}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          {/* Year dropdown — only for employees */}
          {!adminOrHR && (
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all cursor-pointer">
                <option value="all">All Years</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {adminOrHR ? <AdminHeader /> : <EmployeeHeader />}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#ff8c42]" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarRange size={40} className="text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No leave applications found</p>
            <p className="text-sm text-gray-400 mt-1">Apply for a leave to get started</p>
          </div>
        ) : adminOrHR ? (
          filtered.map((leave, i) => (
            <AdminLeaveRow
              key={leave.id}
              leave={leave}
              leaveTypes={leaveTypes}
              index={i}
              onView={(l)    => { setDetailTarget(l); setDetailDrawer(true); }}
              onApprove={(l) => setApproveTarget(l)}
              onReject={(l)  => setRejectTarget(l)}
            />
          ))
        ) : (
          filtered.map((leave, i) => (
            <EmployeeLeaveRow
              key={leave.id}
              leave={leave}
              leaveTypes={leaveTypes}
              index={i}
              onView={(l)   => { setDetailTarget(l); setDetailDrawer(true); }}
              onEdit={(l)   => { setEditTarget(l); setEditDrawer(true); }}
              onCancel={(l) => setCancelTarget(l)}
            />
          ))
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-600">{filtered.length}</span> of{" "}
              <span className="font-bold text-gray-600">{allLeaves.length}</span> applications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}