"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tags, Plus, Search, Pencil, Trash2, X, Check,
  CheckCircle2, XCircle, Loader2, AlertTriangle,
  CalendarDays, BadgeCheck, Ban,
} from "lucide-react";

const API = "http://localhost:8080/api/leave-types";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ─── Toast ──────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto
            ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={16} className="text-red-500 flex-shrink-0" />}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────── */
function ConfirmDialog({ open, onConfirm, onCancel, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Confirm Delete</p>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Drawer ─────────────────────────────────────────────── */
function Drawer({ open, onClose, onSubmit, loading, initial }) {
  const isEdit = !!initial;
  const blank = { name: "", description: "", max_days_per_year: "", is_paid: true, is_active: true };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial, max_days_per_year: initial.max_days_per_year ?? "" } : blank);
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.max_days_per_year || isNaN(form.max_days_per_year) || Number(form.max_days_per_year) <= 0)
      e.max_days_per_year = "Enter a valid number of days";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, max_days_per_year: Number(form.max_days_per_year) });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e2a4a] flex items-center justify-center">
              <Tags size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{isEdit ? "Edit Leave Type" : "New Leave Type"}</p>
              <p className="text-xs text-gray-400">{isEdit ? "Update existing configuration" : "Add a new leave category"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Leave Name *</label>
   <input
  className={`w-full px-4 py-2.5 rounded-xl border text-sm 
    text-black
    focus:outline-none focus:ring-2 transition-all
    ${errors.name 
      ? "border-red-300 focus:ring-red-100" 
      : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"
    }`}
  placeholder="e.g. Casual Leave"
  value={form.name}
  onChange={(e) => setForm({ ...form, name: e.target.value })}
/>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all resize-none"
              placeholder="Brief description of this leave type..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Max Days */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Max Days / Year *</label>
            <input
              type="number"
              min="1"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-black focus:outline-none focus:ring-2 transition-all
                ${errors.max_days_per_year ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42]"}`}
              placeholder="e.g. 12"
              value={form.max_days_per_year}
              onChange={(e) => setForm({ ...form, max_days_per_year: e.target.value })}
            />
            {errors.max_days_per_year && <p className="text-xs text-red-500 mt-1">{errors.max_days_per_year}</p>}
          </div>

          {/* Toggles */}
       <div className="grid grid-cols-2 gap-4">
  {[
    {
      key: "is_paid",
      label: "Paid Leave",
      desc: "Salary is paid during this leave",
    },
    {
      key: "is_active",
      label: "Active",
      desc: "Visible to employees",
    },
  ].map(({ key, label, desc }) => (
    <button
      key={key}
      type="button"
      onClick={() => setForm({ ...form, [key]: !form[key] })}
      className={`p-4 rounded-xl border-2 text-left transition-all
      ${
        form[key]
          ? "border-[#ff8c42] bg-white dark:bg-white"
          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1f2937]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        
        {/* Label */}
        <span className="text-sm font-semibold text-black dark:text-black">
          {label}
        </span>

        {/* Checkbox */}
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
          ${
            form[key]
              ? "border-[#ff8c42] bg-[#ff8c42]"
              : "border-gray-300 dark:border-slate-500"
          }`}
        >
          {form[key] && (
            <Check
              size={10}
              className="text-white"
              strokeWidth={3}
            />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-700">
        {desc}
      </p>
    </button>
  ))}
</div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e67a30] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function LeaveTypePage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setLeaveTypes(data.data);
    } catch { addToast("Failed to load leave types", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/create`, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { addToast("Leave type created!"); fetchAll(); setDrawerOpen(false); }
      else addToast(data.message || "Failed to create", "error");
    } catch { addToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/update/${editing.id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { addToast("Leave type updated!"); fetchAll(); setDrawerOpen(false); setEditing(null); }
      else addToast(data.message || "Failed to update", "error");
    } catch { addToast("Network error", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/delete/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (data.success) { addToast("Deleted successfully"); fetchAll(); }
      else addToast(data.message || "Failed to delete", "error");
    } catch { addToast("Network error", "error"); }
    finally { setDeleteTarget(null); }
  };

  const filtered = leaveTypes.filter((lt) =>
    lt.name.toLowerCase().includes(search.toLowerCase()) ||
    (lt.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const active = leaveTypes.filter((l) => l.is_active).length;
  const paid   = leaveTypes.filter((l) => l.is_paid).length;

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 md:p-8">
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        onSubmit={editing ? handleUpdate : handleCreate}
        loading={submitting}
        initial={editing}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1e2a4a] flex items-center justify-center shadow-lg">
            <Tags size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Types</h1>
            <p className="text-sm text-gray-500">Configure leave categories for your organization</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff8c42] text-white rounded-xl font-semibold text-sm hover:bg-[#e67a30] transition-all shadow-md shadow-orange-200 active:scale-95"
        >
          <Plus size={18} /> Add Leave Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Types" value={leaveTypes.length} icon={Tags} color="bg-blue-50 text-blue-500" />
        <StatCard label="Active" value={active} icon={BadgeCheck} color="bg-emerald-50 text-emerald-500" />
        <StatCard label="Inactive" value={leaveTypes.length - active} icon={Ban} color="bg-red-50 text-red-400" />
        <StatCard label="Paid Types" value={paid} icon={CalendarDays} color="bg-purple-50 text-purple-500" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          {/* <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] transition-all"
            placeholder="Search leave types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          /> */}
<input
  className="
    w-full pl-10 pr-4 py-2.5 rounded-xl 
    bg-gray-50 border border-gray-200 text-sm 
    text-black
    focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/20 focus:border-[#ff8c42] 
    transition-all
  "
  placeholder="Search leave types..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#ff8c42]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tags size={40} className="text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No leave types found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first leave type to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="px-6 py-3 border-b border-gray-100 grid grid-cols-12 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <span className="col-span-1">#</span>
                <span className="col-span-3">Name</span>
                <span className="col-span-4">Description</span>
                <span className="col-span-1 text-center">Max Days</span>
                <span className="col-span-1 text-center">Paid</span>
                <span className="col-span-1 text-center">Status</span>
                <span className="col-span-1 text-center">Actions</span>
              </div>
              {filtered.map((lt, i) => (
                <div key={lt.id} className="px-6 py-4 border-b border-gray-50 grid grid-cols-12 items-center hover:bg-gray-50/60 transition-colors">
                  <span className="col-span-1 text-sm text-gray-400 font-medium">{i + 1}</span>
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-gray-900">{lt.name}</p>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm text-gray-500 truncate">{lt.description || <span className="text-gray-300 italic">No description</span>}</p>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{lt.max_days_per_year}</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${lt.is_paid ? "bg-emerald-400" : "bg-gray-300"}`} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${lt.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {lt.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center gap-2">
                    <button
                      onClick={() => { setEditing(lt); setDrawerOpen(true); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(lt)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((lt, i) => (
                <div key={lt.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{lt.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{lt.description || "No description"}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditing(lt); setDrawerOpen(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(lt)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{lt.max_days_per_year} days/yr</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${lt.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {lt.is_paid ? "Paid" : "Unpaid"}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${lt.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {lt.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-600">{filtered.length}</span> of <span className="font-bold text-gray-600">{leaveTypes.length}</span> leave types
            </p>
          </div>
        )}
      </div>
    </div>
  );
}