"use client";

import { useState, useEffect } from "react";
import {
  Coins, Search, RotateCcw, Pencil, Trash2, Eye, X,
  CheckCircle2, XCircle, Loader2, ChevronDown, TrendingUp,
  TrendingDown, Shield, ArrowUpDown, SlidersHorizontal,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api/salary-components";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");
const getRole  = () => (typeof window !== "undefined" ? localStorage.getItem("role")  : "");
const isAdminHRorPM = () => ["admin", "hr", "project_manager"].includes((getRole() || "").toLowerCase());

const CALCULATION_TYPES = ["fixed", "percentage", "variable"];

const initialForm = {
  component_name: "",
  component_type: "earning",
  calculation_type: "fixed",
  is_taxable: true,
  is_active: true,
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 sm:top-5 z-[200] flex flex-col gap-2 pointer-events-none w-[calc(100vw-2rem)] sm:w-auto max-w-sm">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium
            ${t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {t.type === "success" ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <XCircle size={16} className="flex-shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-1 opacity-60 hover:opacity-100 flex-shrink-0"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ component, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full sm:max-w-sm sm:mx-4 border border-gray-200">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-1">Delete Component</h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-700">"{component?.component_name}"</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Drawer (side on desktop, bottom sheet on mobile) ─────────────────────
function EditDrawer({ open, onClose, editData, onSaved }) {
  const [form, setForm]       = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (editData) setForm({ ...initialForm, ...editData });
    else          setForm(initialForm);
    setErrors({});
  }, [editData, open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const validate = () => {
    const e = {};
    if (!form.component_name.trim()) e.component_name = "Name is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/update/${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.data); onClose(); }
      else setErrors({ _api: data.message || "Update failed" });
    } catch {
      setErrors({ _api: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const Body = () => (
    <>
      {errors._api && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <XCircle size={16} className="flex-shrink-0" />{errors._api}
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Component Name</label>
        <input type="text" value={form.component_name} onChange={(e) => setForm({ ...form, component_name: e.target.value })}
          className={`w-full bg-white border rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all ${errors.component_name ? "border-red-400" : "border-gray-200"}`} />
        {errors.component_name && <p className="mt-1 text-xs text-red-500">{errors.component_name}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Calculation Type</label>
        <div className="relative">
          <select value={form.calculation_type} onChange={(e) => setForm({ ...form, calculation_type: e.target.value })}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all">
            {CALCULATION_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-3">
        {[
          { key: "is_taxable", label: "Taxable",  desc: "Subject to income tax"  },
          { key: "is_active",  label: "Active",   desc: "Available for payroll"   },
        ].map(({ key, label, desc }) => (
          <div key={key} onClick={() => setForm({ ...form, [key]: !form[key] })}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <div className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-4 ${form[key] ? "bg-orange-500" : "bg-gray-200"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form[key] ? "left-6" : "left-1"}`} />
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <div className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

      {/* Desktop side drawer */}
      <div className={`hidden sm:flex fixed top-0 right-0 h-full z-[100] bg-white shadow-xl flex-col transition-all duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "min(440px, 100vw)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-orange-500 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Component</h2>
            <p className="text-xs text-white/70 mt-0.5">{editData?.component_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5"><Body /></div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
            {loading && <Loader2 size={15} className="animate-spin" />}Save Changes
          </button>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white shadow-xl flex flex-col rounded-t-2xl transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ maxHeight: "92dvh" }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-orange-500 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Edit Component</h2>
            <p className="text-xs text-white/70 mt-0.5">{editData?.component_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5"><Body /></div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
            {loading && <Loader2 size={15} className="animate-spin" />}Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

// ── Detail Panel (bottom sheet on all) ───────────────────────────────────────
function DetailPanel({ component, onClose, onEdit, onDelete }) {
  useEffect(() => {
    document.body.style.overflow = component ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [component]);

  if (!component) return null;
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:w-[500px] sm:max-w-[90vw] rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-6 py-4 sm:py-5 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${component.component_type === "earning" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {component.component_type === "earning"
                ? <TrendingUp size={20} className="text-emerald-400" />
                : <TrendingDown size={20} className="text-red-400" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate pr-8">{component.component_name}</h2>
              <p className="text-xs text-white/70">Component ID #{component.id}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${component.component_type === "earning" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {component.component_type === "earning" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{component.component_type}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">{component.calculation_type}</span>
            {component.is_taxable && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Shield size={12} /> Taxable</span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${component.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${component.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />{component.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { label: "Component Type",   value: component.component_type,   cap: true },
              { label: "Calculation Type", value: component.calculation_type, cap: true },
              { label: "Taxable",          value: component.is_taxable ? "Yes" : "No" },
              { label: "Status",           value: component.is_active ? "Active" : "Inactive" },
              { label: "Created At",       value: fmt(component.created_at) },
              { label: "Last Updated",     value: fmt(component.updated_at) },
            ].map(({ label, value, cap }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                <p className={`text-sm font-semibold text-gray-700 ${cap ? "capitalize" : ""}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {isAdminHRorPM() && (
          <div className="px-5 sm:px-6 pb-6 flex gap-3">
            <button onClick={() => { onClose(); onEdit(component); }}
              className="flex-1 py-3 rounded-lg border-2 border-orange-500 text-orange-600 text-sm font-semibold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <Pencil size={15} /> Edit
            </button>
            <button onClick={() => { onClose(); onDelete(component); }}
              className="flex-1 py-3 rounded-lg border-2 border-red-400 text-red-500 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mobile Filter Sheet ───────────────────────────────────────────────────────
function FilterSheet({ open, onClose, searchText, setSearchText, filterType, setFilterType, filterCalc, setFilterCalc, filterStatus, setFilterStatus }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const clearAll = () => { setFilterType("all"); setFilterCalc("all"); setFilterStatus("all"); setSearchText(""); };

  return (
    <>
      <div className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed bottom-0 left-0 right-0 z-[85] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex justify-center pt-3 pb-4"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="px-6 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Filters</h3>
            <button onClick={clearAll} className="text-xs text-orange-500 font-semibold">Reset all</button>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search components..."
              className="mt-1.5 w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Component Type</label>
            <div className="flex gap-2">
              {["all", "earning", "deduction"].map((t) => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border-2 capitalize transition-all ${filterType === t ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-500 bg-white"}`}>
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Calculation</label>
            <div className="flex gap-2 flex-wrap">
              {["all", "fixed", "percentage", "variable"].map((c) => (
                <button key={c} onClick={() => setFilterCalc(c)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border-2 capitalize transition-all min-w-[70px] ${filterCalc === c ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-500 bg-white"}`}>
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Status</label>
            <div className="flex gap-2">
              {[["all","All"],["true","Active"],["false","Inactive"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border-2 transition-all ${filterStatus === val ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-500 bg-white"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-lg bg-orange-500 text-white text-sm font-semibold shadow-sm hover:bg-orange-600 transition-all">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${type === "earning" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
    {type === "earning" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{type}
  </span>
);
const CalcBadge = ({ type }) => (
  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 capitalize">{type}</span>
);
const StatusDot = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-emerald-600" : "text-gray-400"}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

// ── Mobile Component Card ─────────────────────────────────────────────────────
function MobileCard({ c, onView, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.component_type === "earning" ? "bg-emerald-100" : "bg-red-100"}`}>
            {c.component_type === "earning"
              ? <TrendingUp size={16} className="text-emerald-600" />
              : <TrendingDown size={16} className="text-red-500" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{c.component_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">ID #{c.id}</p>
          </div>
        </div>
        <StatusDot active={c.is_active} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <TypeBadge type={c.component_type} />
        <CalcBadge type={c.calculation_type} />
        {c.is_taxable && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
            <Shield size={10} /> Taxable
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onView(c)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <Eye size={14} />
          </button>
          {isAdminHRorPM() && (
            <>
              <button onClick={() => onEdit(c)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all">
                <Pencil size={14} />
              </button>
              <button onClick={() => onDelete(c)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-all">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AllSalaryComponents() {
  const [components,    setComponents]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [searchText,    setSearchText]    = useState("");
  const [filterType,    setFilterType]    = useState("all");
  const [filterCalc,    setFilterCalc]    = useState("all");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [sortField,     setSortField]     = useState("created_at");
  const [sortDir,       setSortDir]       = useState("desc");
  const [detailItem,    setDetailItem]    = useState(null);
  const [editItem,      setEditItem]      = useState(null);
  const [editOpen,      setEditOpen]      = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts,        setToasts]        = useState([]);
  const [filterOpen,    setFilterOpen]    = useState(false);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res  = await fetch(API_BASE, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) setComponents(data.data);
    } catch { addToast("Failed to load components", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/delete/${deleteTarget.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) { addToast("Component deleted!"); fetchAll(); }
      else addToast(data.message || "Delete failed", "error");
    } catch { addToast("Network error", "error"); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const handleSaved = (updated) => {
    setComponents((p) => p.map((c) => (c.id === updated.id ? updated : c)));
    addToast("Component updated successfully!");
  };

  const openEdit = (c) => { setEditItem(c); setEditOpen(true); };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const hasActiveFilters = filterType !== "all" || filterCalc !== "all" || filterStatus !== "all" || searchText !== "";

  const filtered = components
    .filter((c) => {
      return (
        (filterType   === "all" || c.component_type    === filterType) &&
        (filterCalc   === "all" || c.calculation_type  === filterCalc) &&
        (filterStatus === "all" || String(c.is_active) === filterStatus) &&
        (!searchText  || c.component_name.toLowerCase().includes(searchText.toLowerCase()))
      );
    })
    .sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return av < bv ? (sortDir === "asc" ? -1 : 1) : av > bv ? (sortDir === "asc" ? 1 : -1) : 0;
    });

  const SortTh = ({ field, label }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
      onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} className={sortField === field ? "text-orange-500" : "text-gray-300"} />
      </span>
    </th>
  );

  const stats = [
    { label: "Total",      value: components.length,                                                  icon: Coins,        color: "text-gray-800",        bg: "bg-white"         },
    { label: "Earnings",   value: components.filter((c) => c.component_type === "earning").length,    icon: TrendingUp,   color: "text-emerald-600", bg: "bg-white" },
    { label: "Deductions", value: components.filter((c) => c.component_type === "deduction").length,  icon: TrendingDown, color: "text-red-500",         bg: "bg-white"     },
    { label: "Active",     value: components.filter((c) => c.is_active).length,                       icon: CheckCircle2, color: "text-orange-500",       bg: "bg-white"  },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />

      {deleteTarget && <DeleteModal component={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
      <EditDrawer open={editOpen} onClose={() => setEditOpen(false)} editData={editItem} onSaved={handleSaved} />
      <DetailPanel component={detailItem} onClose={() => setDetailItem(null)} onEdit={openEdit} onDelete={setDeleteTarget} />
      <FilterSheet
        open={filterOpen} onClose={() => setFilterOpen(false)}
        searchText={searchText} setSearchText={setSearchText}
        filterType={filterType} setFilterType={setFilterType}
        filterCalc={filterCalc} setFilterCalc={setFilterCalc}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Coins size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">All Salary Components</h1>
              <p className="text-xs text-gray-400">{filtered.length} of {components.length} components</p>
            </div>
          </div>
          <button onClick={fetchAll}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0 bg-white">
            <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-lg border border-gray-200 shadow-sm px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3`}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-xl sm:text-2xl font-bold leading-tight ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:flex bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search components..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all" />
          </div>
          {[
            { val: filterType,   set: setFilterType,   opts: ["all","earning","deduction"],         labels: { all: "All Types" } },
            { val: filterCalc,   set: setFilterCalc,   opts: ["all","fixed","percentage","variable"],labels: { all: "All Calc" } },
            { val: filterStatus, set: setFilterStatus, opts: ["all","true","false"],                 labels: { all: "All Status", true: "Active", false: "Inactive" } },
          ].map(({ val, set, opts, labels }, i) => (
            <div key={i} className="relative">
              <select value={val} onChange={(e) => set(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 pr-8 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all">
                {opts.map((o) => <option key={o} value={o}>{labels?.[o] || (o.charAt(0).toUpperCase() + o.slice(1))}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
          {hasActiveFilters && (
            <button onClick={() => { setSearchText(""); setFilterType("all"); setFilterCalc("all"); setFilterStatus("all"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200 bg-white">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Mobile search + filter button */}
        <div className="flex sm:hidden gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search components..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all shadow-sm" />
          </div>
          <button onClick={() => setFilterOpen(true)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold shadow-sm transition-all
              ${hasActiveFilters ? "border-orange-500 text-orange-500 bg-orange-50" : "border-gray-200 text-gray-600 bg-white"}`}>
            <SlidersHorizontal size={14} />
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute -top-0.5 -right-0.5" />}
          </button>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-orange-500" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Coins size={36} className="mb-3 opacity-30" />
              <p className="text-sm">No components found</p>
              {hasActiveFilters && (
                <button onClick={() => { setSearchText(""); setFilterType("all"); setFilterCalc("all"); setFilterStatus("all"); }}
                  className="mt-2 text-xs text-orange-500 font-semibold">Clear filters</button>
              )}
            </div>
          )}
          {!loading && filtered.map((c) => (
            <MobileCard key={c.id} c={c} onView={setDetailItem} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <SortTh field="component_name"   label="Component Name" />
                  <SortTh field="component_type"   label="Type"           />
                  <SortTh field="calculation_type" label="Calculation"    />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxable</th>
                  <SortTh field="is_active"        label="Status"         />
                  <SortTh field="created_at"       label="Created"        />
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr><td colSpan={8} className="py-16 text-center"><Loader2 size={24} className="animate-spin text-orange-500 mx-auto" /></td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Coins size={36} className="mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400">No components found</p>
                      {hasActiveFilters && <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>}
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-orange-50 transition-colors group">
                    <td className="px-4 py-3.5 text-xs text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${c.component_type === "earning" ? "bg-emerald-100" : "bg-red-100"}`}>
                          {c.component_type === "earning" ? <TrendingUp size={13} className="text-emerald-600" /> : <TrendingDown size={13} className="text-red-500" />}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{c.component_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><TypeBadge type={c.component_type} /></td>
                    <td className="px-4 py-3.5"><CalcBadge type={c.calculation_type} /></td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold ${c.is_taxable ? "text-amber-600" : "text-gray-400"}`}>{c.is_taxable ? "Yes" : "No"}</span>
                    </td>
                    <td className="px-4 py-3.5"><StatusDot active={c.is_active} /></td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailItem(c)} title="View"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"><Eye size={14} /></button>
                        {isAdminHRorPM() && (
                          <>
                            <button onClick={() => openEdit(c)} title="Edit"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget(c)} title="Delete"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{components.length}</span> components
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{components.filter((c) => c.component_type === "earning").length} earnings</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />{components.filter((c) => c.component_type === "deduction").length} deductions</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile footer summary */}
        {!loading && filtered.length > 0 && (
          <div className="sm:hidden flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{components.length}</span></span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{components.filter((c) => c.component_type === "earning").length} earn</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{components.filter((c) => c.component_type === "deduction").length} deduct</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}