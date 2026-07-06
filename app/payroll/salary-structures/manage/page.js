"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, RefreshCw, X, Save, Pencil, Trash2,
  ChevronDown, AlertCircle, CheckCircle2, Loader2,
  User, DollarSign, Percent, CalendarRange, Info, Eye,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const getRole  = () => (typeof window !== "undefined" ? localStorage.getItem("role")  : "");
const isAdminHRorPM = () => ["admin", "hr", "project_manager"].includes((getRole() || "").toLowerCase());

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium
      ${isErr ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
      {isErr ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 flex-shrink-0"><X size={14} /></button>
    </div>
  );
}

/* ─── Drawer ─────────────────────────────────────────────────────────────── */
function Drawer({ open, onClose, title, icon, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-[480px] bg-white z-[100] shadow-2xl flex flex-col
        transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff8c42]/10 flex items-center justify-center flex-shrink-0">
              {icon || <DollarSign size={16} className="text-[#ff8c42]" />}
            </div>
            <h2 className="text-base font-semibold text-gray-800 truncate">{title}</h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0 ml-2">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">{children}</div>
      </div>
    </>
  );
}

/* ─── Field ──────────────────────────────────────────────────────────────── */
function Field({ label, required, children, hint }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-all
        focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] placeholder-gray-400 min-h-[44px] ${className}`}
      {...props}
    />
  );
}

function SelectInput({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none px-3 py-2.5 text-sm text-black border border-gray-200 rounded-lg outline-none transition-all
          focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] bg-white pr-9 min-h-[44px] ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function ViewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value ?? "—"}</span>
    </div>
  );
}

/* ─── Delete Modal ───────────────────────────────────────────────────────── */
function DeleteModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Delete Structure</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          This will deactivate the salary structure entry. The record will be marked as inactive.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile Card ────────────────────────────────────────────────────────── */
function StructureCard({ s, onView, onEdit, onDelete }) {
  return (
    <div className="p-4 border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + name + badges */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#ff8c42]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <DollarSign size={15} className="text-[#ff8c42]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{s.component?.component_name || "—"}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${s.component?.component_type === "earning" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {s.component?.component_type
                  ? s.component.component_type.charAt(0).toUpperCase() + s.component.component_type.slice(1)
                  : "—"}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {s.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500">
                {s.amount
                  ? `₹${Number(s.amount).toLocaleString("en-IN")}`
                  : s.percentage
                  ? `${s.percentage}%`
                  : "—"}
              </span>
              {s.effective_from && (
                <span className="text-xs text-gray-400">
                  {new Date(s.effective_from).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Right: action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onView(s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
            title="View">
            <Eye size={14} />
          </button>
          <button onClick={() => onEdit(s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ManageSalaryStructures() {
  const [components,    setComponents]    = useState([]);
  const [users,         setUsers]         = useState([]);
  const [structures,    setStructures]    = useState([]);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [fetchingUser,  setFetchingUser]  = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast,         setToast]         = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [viewData,      setViewData]      = useState(null);

  const [form, setForm] = useState({
    user_id: "", component_id: "", amount: "",
    percentage: "", percentage_of_component_id: "",
    effective_from: "", effective_to: "",
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchComponents = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/salary-components`, { headers });
      const d = await r.json();
      if (d.success) setComponents(d.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/auth/all`, { headers });
      const d = await r.json();
      if (d.success) setUsers(d.users || d.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchStructuresByUser = useCallback(async (userId) => {
    if (!userId) { setStructures([]); return; }
    setFetchingUser(true);
    try {
      const r = await fetch(`${API_BASE}/salary-structures/${userId}`, { headers });
      const d = await r.json();
      if (d.success) setStructures(d.data || []);
      else { setStructures([]); showToast(d.message || "No structures found", "error"); }
    } catch {
      showToast("Failed to fetch salary structures", "error");
    } finally {
      setFetchingUser(false);
    }
  }, []);

  useEffect(() => { fetchComponents(); fetchUsers(); }, []);

  const selectedComponent = components.find(c => String(c.id) === String(form.component_id));
  const calcType = selectedComponent?.calculation_type || "";

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      user_id: selectedUserId || "", component_id: "", amount: "",
      percentage: "", percentage_of_component_id: "",
      effective_from: new Date().toISOString().split("T")[0], effective_to: "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      user_id: String(s.user_id),
      component_id: String(s.component_id),
      amount: s.amount || "",
      percentage: s.percentage || "",
      percentage_of_component_id: s.percentage_of_component_id ? String(s.percentage_of_component_id) : "",
      effective_from: s.effective_from ? s.effective_from.split("T")[0] : "",
      effective_to: s.effective_to ? s.effective_to.split("T")[0] : "",
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body = {
        user_id: Number(form.user_id),
        component_id: Number(form.component_id),
        effective_from: form.effective_from,
        ...(form.effective_to ? { effective_to: form.effective_to } : {}),
        ...(calcType === "fixed"      ? { amount: Number(form.amount) } : {}),
        ...(calcType === "percentage" ? {
          percentage: Number(form.percentage),
          percentage_of_component_id: Number(form.percentage_of_component_id),
        } : {}),
      };
      let r, d;
      if (editTarget) {
        r = await fetch(`${API_BASE}/salary-structures/update/${editTarget.id}`, { method: "PUT", headers, body: JSON.stringify(body) });
      } else {
        r = await fetch(`${API_BASE}/salary-structures/create`, { method: "POST", headers, body: JSON.stringify(body) });
      }
      d = await r.json();
      if (d.success) {
        showToast(d.message || (editTarget ? "Updated successfully" : "Created successfully"));
        setDrawerOpen(false);
        if (selectedUserId) fetchStructuresByUser(selectedUserId);
      } else {
        showToast(d.message || "Operation failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API_BASE}/salary-structures/delete/${deleteTarget.id}`, { method: "DELETE", headers });
      const d = await r.json();
      if (d.success) {
        showToast("Structure deleted successfully");
        setDeleteTarget(null);
        if (selectedUserId) fetchStructuresByUser(selectedUserId);
      } else {
        showToast(d.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    fetchStructuresByUser(userId);
  };

  if (!isAdminHRorPM()) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Access Denied</p>
          <p className="text-sm text-gray-400 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ff8c42] flex items-center justify-center shadow-sm flex-shrink-0">
              <DollarSign size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Salary Structures</h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Assign and manage employee salary components</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#ff8c42] text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-[#e57a35] transition-all active:scale-95 flex-shrink-0 min-h-[40px]">
            <Plus size={15} />
            <span className="hidden xs:inline sm:inline">Assign Structure</span>
            <span className="xs:hidden sm:hidden">Assign</span>
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="p-3 sm:p-6 max-w-5xl mx-auto">

        {/* Lookup card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <User size={15} className="text-[#ff8c42]" />
            <h2 className="text-sm font-semibold text-gray-700">Lookup by Employee</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">Select an employee to view their active salary structures</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <SelectInput value={selectedUserId} onChange={(e) => handleUserSelect(e.target.value)}>
                <option value="">Select an employee...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}{u.email ? ` (${u.email})` : ""}
                  </option>
                ))}
              </SelectInput>
            </div>
            {selectedUserId && (
              <button
                onClick={() => fetchStructuresByUser(selectedUserId)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
                <RefreshCw size={14} className={fetchingUser ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Structures list */}
        {selectedUserId && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Active Salary Components</h2>
                <p className="text-xs text-gray-400 mt-0.5">{structures.length} record{structures.length !== 1 ? "s" : ""} found</p>
              </div>
            </div>

            {fetchingUser ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin text-[#ff8c42]" />
                <span className="text-sm">Loading structures...</span>
              </div>
            ) : structures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Info size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">No active structures</p>
                <p className="text-xs text-gray-300 mt-1">Assign a salary structure to get started</p>
                <button onClick={openCreate}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff8c42]/10 text-[#ff8c42] text-sm font-medium hover:bg-[#ff8c42]/15 transition-colors min-h-[44px]">
                  <Plus size={14} /> Assign Now
                </button>
              </div>
            ) : (
              <>
                {/* ── Desktop table (md+) ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/70 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Component</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount / %</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Effective From</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structures.map((s, i) => (
                        <tr key={s.id} className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 !== 0 ? "bg-gray-50/20" : ""}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#ff8c42]/10 flex items-center justify-center flex-shrink-0">
                                <DollarSign size={13} className="text-[#ff8c42]" />
                              </div>
                              <span className="font-medium text-gray-800">{s.component?.component_name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                              ${s.component?.component_type === "earning" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                              {s.component?.component_type
                                ? s.component.component_type.charAt(0).toUpperCase() + s.component.component_type.slice(1)
                                : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-700">
                            {s.amount
                              ? <span className="flex items-center gap-1"><DollarSign size={13} className="text-gray-400" />₹{Number(s.amount).toLocaleString("en-IN")}</span>
                              : s.percentage
                              ? <span className="flex items-center gap-1"><Percent size={13} className="text-gray-400" />{s.percentage}%</span>
                              : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-sm">
                            {s.effective_from ? new Date(s.effective_from).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                              ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                              {s.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setViewData(s)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 transition-all" title="View">
                                <Eye size={13} />
                              </button>
                              <button onClick={() => openEdit(s)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteTarget(s)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all" title="Delete">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile cards (< md) ── */}
                <div className="md:hidden divide-y divide-gray-50">
                  {structures.map((s) => (
                    <StructureCard
                      key={s.id}
                      s={s}
                      onView={setViewData}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!selectedUserId && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ff8c42]/8 flex items-center justify-center mb-4">
              <User size={22} className="text-[#ff8c42]/50" />
            </div>
            <p className="text-gray-500 font-medium">Select an employee above</p>
            <p className="text-sm text-gray-400 mt-1">Their salary structures will appear here</p>
          </div>
        )}
      </div>

      {/* ── View Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        open={!!viewData}
        onClose={() => setViewData(null)}
        title={viewData?.component?.component_name || "Salary Structure Details"}
      >
        {viewData && (
          <div className="flex flex-col gap-0 -mx-4 sm:-mx-6 -mt-5">

            {/* Badge strip */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 pb-5 border-b border-gray-100 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                ${viewData.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${viewData.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                {viewData.is_active ? "Active" : "Inactive"}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                ${viewData.component?.component_type === "earning" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                {viewData.component?.component_type
                  ? viewData.component.component_type.charAt(0).toUpperCase() + viewData.component.component_type.slice(1)
                  : "—"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200 capitalize">
                {viewData.component?.calculation_type || "—"}
              </span>
            </div>

            {/* Employee */}
            <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Employee</p>
              {(() => {
                const fullUser = users.find(u => u.id === viewData.user_id) || viewData.user;
                const initials = `${fullUser?.first_name?.[0] || ""}${fullUser?.last_name?.[0] || ""}`.toUpperCase();
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff8c42] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                        {fullUser?.first_name} {fullUser?.last_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{fullUser?.email || "—"}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{fullUser?.employee_code || `#${fullUser?.id}`}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Component Details */}
            <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Component Details</p>
              <div className="space-y-3">
                <ViewRow label="Component Name" value={viewData.component?.component_name} />
                <ViewRow label="Calculation Type" value={<span className="capitalize">{viewData.component?.calculation_type}</span>} />
                <ViewRow label="Taxable" value={
                  <span className={viewData.component?.is_taxable ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                    {viewData.component?.is_taxable ? "Yes" : "No"}
                  </span>
                } />
              </div>
            </div>

            {/* Assigned Value */}
            <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Assigned Value</p>
              {viewData.amount && (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 leading-none mb-1">Fixed Amount</p>
                    <p className="text-lg font-bold text-gray-800">₹{Number(viewData.amount).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}
              {viewData.percentage && (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Percent size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 leading-none mb-1">
                      Percentage{viewData.base_component ? ` of ${viewData.base_component.component_name}` : ""}
                    </p>
                    <p className="text-lg font-bold text-gray-800">{viewData.percentage}%</p>
                  </div>
                </div>
              )}
              {!viewData.amount && !viewData.percentage && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
                  <Info size={15} className="text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-600">Computed dynamically at payroll run</p>
                </div>
              )}
            </div>

            {/* Effective Period */}
            <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Effective Period</p>
              <div className="space-y-3">
                <ViewRow label="Effective From" value={
                  viewData.effective_from
                    ? new Date(viewData.effective_from).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                    : "—"
                } />
                <ViewRow label="Effective To" value={
                  viewData.effective_to
                    ? new Date(viewData.effective_to).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                    : <span className="text-green-600 font-medium">Open-ended</span>
                } />
              </div>
            </div>

            {/* Record Info */}
            <div className="px-4 sm:px-6 py-5 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Record Info</p>
              <div className="space-y-3">
                <ViewRow label="Record ID" value={<span className="text-gray-500">#{viewData.id}</span>} />
                <ViewRow label="Created" value={
                  viewData.created_at
                    ? new Date(viewData.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"
                } />
                <ViewRow label="Last Updated" value={
                  viewData.updated_at
                    ? new Date(viewData.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"
                } />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 pt-5 pb-2 flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => { setViewData(null); setDeleteTarget(viewData); }}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors min-h-[44px]">
                <Trash2 size={14} />
                Delete
              </button>
              <button
                onClick={() => { setViewData(null); openEdit(viewData); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e57a35] transition-all min-h-[44px]">
                <Pencil size={14} />
                Edit Structure
              </button>
            </div>

          </div>
        )}
      </Drawer>

      {/* ── Create / Edit Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? "Edit Salary Structure" : "Assign Salary Structure"}
      >
        <div className="space-y-1">
          {editTarget && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
              <Info size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Editing will close the current record and create a new one effective from the new date.
                The component cannot be changed on edit.
              </p>
            </div>
          )}

          <Field label="Employee" required>
            <SelectInput
              value={form.user_id}
              onChange={(e) => setForm(f => ({ ...f, user_id: e.target.value }))}
              disabled={!!editTarget}
            >
              <option value="">Select employee...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Salary Component" required>
            <SelectInput
              value={form.component_id}
              onChange={(e) => setForm(f => ({ ...f, component_id: e.target.value, amount: "", percentage: "", percentage_of_component_id: "" }))}
              disabled={!!editTarget}
            >
              <option value="">Select component...</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>{c.component_name} ({c.calculation_type})</option>
              ))}
            </SelectInput>
            {editTarget && <p className="text-xs text-gray-400 mt-1">Component is locked on edit.</p>}
          </Field>

          {calcType === "fixed" && (
            <Field label="Amount (₹)" required hint="Enter the fixed monthly amount">
              <Input
                type="number" min="0" placeholder="e.g. 10000"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </Field>
          )}

          {calcType === "percentage" && (
            <>
              <Field label="Percentage (%)" required>
                <div className="relative">
                  <Input
                    type="number" min="0" max="100" placeholder="e.g. 12"
                    value={form.percentage}
                    onChange={(e) => setForm(f => ({ ...f, percentage: e.target.value }))}
                    className="pr-10"
                  />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </Field>
              <Field label="Based On Component" required hint="Select the base component for percentage calculation">
                <SelectInput
                  value={form.percentage_of_component_id}
                  onChange={(e) => setForm(f => ({ ...f, percentage_of_component_id: e.target.value }))}
                >
                  <option value="">Select base component...</option>
                  {components.filter(c => String(c.id) !== String(form.component_id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.component_name}</option>
                  ))}
                </SelectInput>
              </Field>
            </>
          )}

          {calcType === "variable" && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4">
              <Info size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">Variable components do not require amount or percentage — they are computed dynamically.</p>
            </div>
          )}

          <Field label="Effective From" required>
            <div className="relative">
              <Input
                type="date" className="text-black" value={form.effective_from}
                onChange={(e) => setForm(f => ({ ...f, effective_from: e.target.value }))}
              />
              <CalendarRange size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
            </div>
          </Field>

          {!editTarget && (
            <Field label="Effective To" hint="Leave empty for open-ended / no end date">
              <div className="relative">
                <Input
                  type="date" className="text-black" value={form.effective_to}
                  onChange={(e) => setForm(f => ({ ...f, effective_to: e.target.value }))}
                />
                <CalendarRange size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.user_id || !form.component_id || !form.effective_from}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e57a35] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} />
              {editTarget ? "Update" : "Assign"}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}