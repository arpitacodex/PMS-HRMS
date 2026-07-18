"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Search, X, Eye, Pencil, Trash2,
  DollarSign, Percent, AlertCircle, Loader2,
  CheckCircle2, ChevronDown, Filter, Users,
  CalendarRange, Info, ArrowUpRight, Save, Plus,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const getRole  = () => (typeof window !== "undefined" ? localStorage.getItem("role")  : "");
const isAdminHRorPM = () => ["admin", "hr", "project_manager"].includes((getRole() || "").toLowerCase());

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium
      ${isErr ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
      {isErr ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      {toast.msg}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

/* ─── Delete Modal ───────────────────────────────────────────────────────── */
function DeleteModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Delete Structure</h3>
            <p className="text-sm text-gray-500">This will deactivate the record</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          The salary structure will be marked as inactive with today as the effective end date.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Drawer (Edit / Create) ─────────────────────────────────────────────── */
function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-[100] shadow-2xl flex flex-col
        transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff8c42]/10 flex items-center justify-center">
              <DollarSign size={16} className="text-[#ff8c42]" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  );
}

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
        focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] placeholder-gray-400 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none
          focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] bg-white pr-9 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

/* ─── View / Click-up Panel ──────────────────────────────────────────────── */
function ViewPanel({ structure, onClose, onEdit, onDelete }) {
  if (!structure) return null;
  const s = structure;
  const calcType = s.component?.calculation_type || "";

  return (
    <>
      <div onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]" />
      <div className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-[100] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#ff6b1a] flex items-center justify-center shadow-sm">
              <DollarSign size={17} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Salary Structure</p>
              <h2 className="text-base font-bold text-gray-800">{s.component?.component_name || "—"}</h2>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              ${s.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-400"}`}>
              {s.is_active ? "● Active" : "● Inactive"}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              ${s.component?.component_type === "earning"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"}`}>
              {s.component?.component_type
                ? s.component.component_type.charAt(0).toUpperCase() + s.component.component_type.slice(1)
                : "—"}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 capitalize">
              {calcType}
            </span>
          </div>

          {/* Employee */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Employee</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff8c42] to-[#ff6b1a] flex items-center justify-center text-white text-sm font-bold">
                {(s.user?.first_name?.[0] || "") + (s.user?.last_name?.[0] || "")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{s.user?.first_name} {s.user?.last_name}</p>
                <p className="text-xs text-gray-400">ID: #{s.user_id}</p>
              </div>
            </div>
          </div>

          {/* Component Details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Component Details</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Component Name</span>
                <span className="font-medium text-gray-800">{s.component?.component_name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Calculation Type</span>
                <span className="font-medium text-gray-800 capitalize">{calcType || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxable</span>
                <span className={`font-medium ${s.component?.is_taxable ? "text-red-600" : "text-green-600"}`}>
                  {s.component?.is_taxable ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Assigned Value</p>
            {s.amount && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign size={15} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fixed Amount</p>
                  <p className="text-lg font-bold text-gray-800">₹{Number(s.amount).toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
            {s.percentage && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Percent size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Percentage</p>
                  <p className="text-lg font-bold text-gray-800">{s.percentage}%</p>
                  {s.base_component && (
                    <p className="text-xs text-gray-400">of {s.base_component?.component_name}</p>
                  )}
                </div>
              </div>
            )}
            {!s.amount && !s.percentage && (
              <p className="text-sm text-gray-400 italic">Variable — computed dynamically</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Effective Period</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Effective From</span>
                <span className="font-medium text-gray-800">
                  {s.effective_from
                    ? new Date(s.effective_from).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Effective To</span>
                <span className="font-medium text-gray-800">
                  {s.effective_to
                    ? new Date(s.effective_to).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                    : <span className="text-emerald-600">Open-ended</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Record Info</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Record ID</span>
                <span className="font-mono text-xs text-gray-600">#{s.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-700">
                  {s.updated_at ? new Date(s.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {s.is_active && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => { onDelete(s); onClose(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => { onEdit(s); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e57a35] transition-all">
              <Pencil size={14} />
              Edit Structure
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function AllSalaryStructures() {
  const [structures, setStructures]   = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [search,     setSearch]       = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  // Default to "active" so the table shows only active records unless the user changes the filter.
  const [statusFilter, setStatusFilter] = useState("active");
  const [toast,      setToast]        = useState(null);
  const [viewTarget, setViewTarget]   = useState(null);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm,   setEditForm]     = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [components, setComponents]   = useState([]);

  // Users (for the "assign to" dropdown when creating a structure)
  const [users, setUsers]             = useState([]);

  // Create drawer state
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState({
    user_id: "",
    component_id: "",
    amount: "",
    percentage: "",
    percentage_of_component_id: "",
    effective_from: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/salary-structures/`, { headers });
      const d = await r.json();
      if (d.success) setStructures(d.data || []);
      else showToast(d.message || "Failed to fetch", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComponents = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/salary-components`, { headers });
      const d = await r.json();
      if (d.success) setComponents(d.data || []);
    } catch { /* silent */ }
  }, []);

  // Fetch all users so we can show "Name (#id)" in the create form's employee dropdown.
  const fetchUsers = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/auth/all`, { headers });
      const d = await r.json();
      const list = d?.data?.users || d?.users || (Array.isArray(d?.data) ? d.data : []);
      setUsers(Array.isArray(list) ? list : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchComponents();
    fetchUsers();
  }, []);

  /* Filter */
  const filtered = structures.filter((s) => {
    const name = `${s.user?.first_name || ""} ${s.user?.last_name || ""} ${s.component?.component_name || ""}`.toLowerCase();
    const matchSearch = search === "" || name.includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || s.component?.component_type === typeFilter;
    const matchStatus = statusFilter === "all"
      || (statusFilter === "active" && s.is_active)
      || (statusFilter === "inactive" && !s.is_active);
    return matchSearch && matchType && matchStatus;
  });

  /* Stats (always reflect the full dataset, not the current filter) */
  const stats = {
    total:    structures.length,
    active:   structures.filter(s => s.is_active).length,
    earnings: structures.filter(s => s.component?.component_type === "earning").length,
    deductions: structures.filter(s => s.component?.component_type === "deduction").length,
  };

  const openEdit = (s) => {
    setEditTarget(s);
    const calcType = s.component?.calculation_type || "";
    setEditForm({
      amount: s.amount || "",
      percentage: s.percentage || "",
      percentage_of_component_id: s.percentage_of_component_id ? String(s.percentage_of_component_id) : "",
      effective_from: s.effective_from ? s.effective_from.split("T")[0] : "",
      calcType,
    });
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const { calcType, ...rest } = editForm;
      const body = {
        effective_from: rest.effective_from,
        ...(calcType === "fixed"      ? { amount: Number(rest.amount) } : {}),
        ...(calcType === "percentage" ? {
          percentage: Number(rest.percentage),
          percentage_of_component_id: Number(rest.percentage_of_component_id),
        } : {}),
      };
      const r = await fetch(`${API_BASE}/salary-structures/update/${editTarget.id}`, {
        method: "PUT", headers, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        showToast("Structure updated successfully");
        setEditTarget(null);
        fetchAll();
      } else {
        showToast(d.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API_BASE}/salary-structures/delete/${deleteTarget.id}`, {
        method: "DELETE", headers,
      });
      const d = await r.json();
      if (d.success) {
        showToast("Structure deleted successfully");
        setDeleteTarget(null);
        fetchAll();
      } else {
        showToast(d.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ─── Create ────────────────────────────────────────────────────────── */
  const openCreate = () => {
    setCreateForm({
      user_id: "",
      component_id: "",
      amount: "",
      percentage: "",
      percentage_of_component_id: "",
      effective_from: "",
    });
    setShowCreate(true);
  };

  const selectedCreateComponent = components.find(
    (c) => String(c.id) === String(createForm.component_id)
  );
  const createCalcType = selectedCreateComponent?.calculation_type || "";

  const createFormValid =
    createForm.user_id &&
    createForm.component_id &&
    createForm.effective_from &&
    (createCalcType !== "fixed" || createForm.amount) &&
    (createCalcType !== "percentage" || (createForm.percentage && createForm.percentage_of_component_id));

  const handleCreateSubmit = async () => {
    if (!createFormValid) return;
    setCreateLoading(true);
    try {
      const body = {
        user_id: Number(createForm.user_id),
        component_id: Number(createForm.component_id),
        effective_from: createForm.effective_from,
        ...(createCalcType === "fixed"      ? { amount: Number(createForm.amount) } : {}),
        ...(createCalcType === "percentage" ? {
          percentage: Number(createForm.percentage),
          percentage_of_component_id: Number(createForm.percentage_of_component_id),
        } : {}),
      };
      const r = await fetch(`${API_BASE}/salary-structures/create`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        showToast("Salary structure created successfully");
        setShowCreate(false);
        fetchAll();
      } else {
        showToast(d.message || "Create failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  if (!isAdminHRorPM()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Access Denied</p>
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

      {/* View Panel */}
      {viewTarget && (
        <ViewPanel
          structure={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create Drawer */}
      <Drawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Salary Structure"
      >
        <div>
          <Field label="Employee" required>
            <Select
              value={createForm.user_id}
              onChange={(e) => setCreateForm(f => ({ ...f, user_id: e.target.value }))}
            >
              <option value="">Select employee...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} (#{u.id})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Salary Component" required>
            <Select
              value={createForm.component_id}
              onChange={(e) => setCreateForm(f => ({
                ...f,
                component_id: e.target.value,
                amount: "",
                percentage: "",
                percentage_of_component_id: "",
              }))}
            >
              <option value="">Select component...</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.component_name} ({c.calculation_type})
                </option>
              ))}
            </Select>
          </Field>

          {createCalcType === "fixed" && (
            <Field label="Amount (₹)" required>
              <Input
                type="number"
                min="0"
                value={createForm.amount}
                onChange={(e) => setCreateForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 30000"
              />
            </Field>
          )}

          {createCalcType === "percentage" && (
            <>
              <Field label="Percentage (%)" required>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={createForm.percentage}
                  onChange={(e) => setCreateForm(f => ({ ...f, percentage: e.target.value }))}
                  placeholder="e.g. 12"
                />
              </Field>
              <Field label="Based On Component" required>
                <Select
                  value={createForm.percentage_of_component_id}
                  onChange={(e) => setCreateForm(f => ({ ...f, percentage_of_component_id: e.target.value }))}
                >
                  <option value="">Select base component...</option>
                  {components
                    .filter((c) => String(c.id) !== String(createForm.component_id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.component_name}</option>
                    ))}
                </Select>
              </Field>
            </>
          )}

          <Field label="Effective From" required>
            <div className="relative">
              <Input
                type="date"
                value={createForm.effective_from}
                onChange={(e) => setCreateForm(f => ({ ...f, effective_from: e.target.value }))}
              />
              <CalendarRange size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setShowCreate(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreateSubmit} disabled={createLoading || !createFormValid}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e57a35] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {createLoading && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} />
              Create
            </button>
          </div>
        </div>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Salary Structure"
      >
        {editTarget && (
          <div>
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
              <Info size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Editing will close the current record and create a new one effective from the new date.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 mb-5">
              <p className="text-xs text-gray-400 mb-1">Editing structure for</p>
              <p className="text-sm font-semibold text-gray-800">
                {editTarget.user?.first_name} {editTarget.user?.last_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{editTarget.component?.component_name} • {editForm.calcType}</p>
            </div>

            {editForm.calcType === "fixed" && (
              <Field label="Amount (₹)" required>
                <Input
                  type="number"
                  min="0"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 15000"
                />
              </Field>
            )}

            {editForm.calcType === "percentage" && (
              <>
                <Field label="Percentage (%)" required>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.percentage}
                    onChange={(e) => setEditForm(f => ({ ...f, percentage: e.target.value }))}
                    placeholder="e.g. 12"
                  />
                </Field>
                <Field label="Based On Component" required>
                  <Select
                    value={editForm.percentage_of_component_id}
                    onChange={(e) => setEditForm(f => ({ ...f, percentage_of_component_id: e.target.value }))}
                  >
                    <option value="">Select base component...</option>
                    {components.filter(c => String(c.id) !== String(editTarget.component_id)).map(c => (
                      <option key={c.id} value={c.id}>{c.component_name}</option>
                    ))}
                  </Select>
                </Field>
              </>
            )}

            <Field label="New Effective From" required>
              <div className="relative">
                <Input
                  type="date"
                  value={editForm.effective_from}
                  onChange={(e) => setEditForm(f => ({ ...f, effective_from: e.target.value }))}
                />
                <CalendarRange size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setEditTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleEditSubmit} disabled={editLoading || !editForm.effective_from}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e57a35] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {editLoading && <Loader2 size={14} className="animate-spin" />}
                <Save size={14} />
                Update
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#ff6b1a] flex items-center justify-center shadow-sm">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">All Salary Structures</h1>
              <p className="text-sm text-gray-400">View and manage all assigned salary structures</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff8c42] text-white text-sm font-semibold hover:bg-[#e57a35] transition-all shadow-sm">
              <Plus size={14} />
              Create Salary Structure
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",      value: stats.total,      color: "text-gray-800",   bg: "bg-gray-50"     },
            { label: "Active",     value: stats.active,     color: "text-emerald-700", bg: "bg-gray-50" },
            { label: "Earnings",   value: stats.earnings,   color: "text-green-700",  bg: "bg-gray-50"    },
            { label: "Deductions", value: stats.deductions, color: "text-red-600",    bg: "bg-gray-50"      },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white shadow-sm`}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2.5 text-sm text-black border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42]"
                placeholder="Search by employee or component..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400 flex-shrink-0" />
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 text-sm text-black border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] bg-white">
                  <option value="all">All Types</option>
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Status filter — defaults to "Active"; user can switch to Inactive or All */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 text-sm  text-black border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#ff8c42]/30 focus:border-[#ff8c42] bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All Status</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 size={22} className="animate-spin text-[#ff8c42]" />
              <span className="text-sm">Loading salary structures...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Info size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">No structures found</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting filters or refresh</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Employee</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Component</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount / %</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Effective From</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.id}
                        className="border-t border-gray-50 hover:bg-gray-50/40 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-mono text-gray-400">#{s.id}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff8c42] to-[#ff6b1a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(s.user?.first_name?.[0] || "") + (s.user?.last_name?.[0] || "")}
                            </div>
                            <span className="font-medium text-gray-800 whitespace-nowrap">
                              {s.user?.first_name} {s.user?.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-gray-700">{s.component?.component_name || "—"}</span>
                          <span className="ml-1.5 text-xs text-gray-400 capitalize">({s.component?.calculation_type})</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                            ${s.component?.component_type === "earning"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"}`}>
                            {s.component?.component_type
                              ? s.component.component_type.charAt(0).toUpperCase() + s.component.component_type.slice(1)
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">
                          {s.amount
                            ? <span className="flex items-center gap-1 font-medium">₹{Number(s.amount).toLocaleString("en-IN")}</span>
                            : s.percentage
                            ? <span className="flex items-center gap-1 font-medium">{s.percentage}%</span>
                            : <span className="text-gray-400 italic text-xs">Variable</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-sm">
                          {s.effective_from
                            ? new Date(s.effective_from).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewTarget(s)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ff8c42]/8 text-[#ff8c42] text-xs font-medium hover:bg-[#ff8c42]/15 transition-colors"
                              title="View">
                              <Eye size={12} />
                              View
                            </button>
                            {s.is_active && (
                              <>
                                <button
                                  onClick={() => openEdit(s)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all"
                                  title="Edit">
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(s)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                                  title="Delete">
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((s) => (
                  <div key={s.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff8c42] to-[#ff6b1a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(s.user?.first_name?.[0] || "") + (s.user?.last_name?.[0] || "")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{s.user?.first_name} {s.user?.last_name}</p>
                          <p className="text-xs text-gray-400">{s.component?.component_name}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <p className="text-gray-400">Value</p>
                        <p className="font-semibold text-gray-700">
                          {s.amount ? `₹${Number(s.amount).toLocaleString("en-IN")}` : s.percentage ? `${s.percentage}%` : "Variable"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Effective From</p>
                        <p className="font-semibold text-gray-700">
                          {s.effective_from ? new Date(s.effective_from).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewTarget(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff8c42]/10 text-[#ff8c42] text-xs font-medium">
                        <Eye size={12} /> View
                      </button>
                      {s.is_active && (
                        <>
                          <button onClick={() => openEdit(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium">
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => setDeleteTarget(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-red-500 text-xs font-medium">
                            <Trash2 size={12} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer count */}
              <div className="px-5 py-3.5 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>Showing {filtered.length} of {structures.length} structures</span>
                {(search || typeFilter !== "all" || statusFilter !== "active") && (
                  <button onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("active"); }}
                    className="text-[#ff8c42] hover:underline font-medium">
                    Reset filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}