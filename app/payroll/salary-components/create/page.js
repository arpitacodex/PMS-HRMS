"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlusCircle, Search, X, ChevronDown, Pencil, Trash2,
  CheckCircle2, XCircle, Loader2, Coins, BadgePercent,
  RotateCcw, SlidersHorizontal, ChevronUp
} from "lucide-react";
import Link from "next/link";

const API_BASE = "http://localhost:8080/api/salary-components";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");

const COMPONENT_TYPES   = ["earning", "deduction"];
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
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
            ${t.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <XCircle size={16} className="flex-shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-1 opacity-60 hover:opacity-100 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ component, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm sm:mx-4 border border-gray-100">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-1">Delete Component</h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-700">"{component?.component_name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────────
function ComponentDrawer({ open, onClose, editData, onSaved }) {
  const [form, setForm]       = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (editData) setForm({ ...initialForm, ...editData });
    else          setForm(initialForm);
    setErrors({});
  }, [editData, open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else      document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const validate = () => {
    const e = {};
    if (!form.component_name.trim()) e.component_name = "Component name is required";
    if (!form.component_type)        e.component_type = "Select a type";
    if (!form.calculation_type)      e.calculation_type = "Select calculation type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const url    = editData ? `${API_BASE}/update/${editData.id}` : `${API_BASE}/create`;
      const method = editData ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(editData ? "updated" : "created", data.data);
        onClose();
      } else {
        setErrors({ _api: data.message || "Something went wrong" });
      }
    } catch {
      setErrors({ _api: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );

  const SelectField = ({ value, onChange, options, error }) => (
    <div className="relative">
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all
          ${error ? "border-red-400" : "border-gray-200"}`}
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o.charAt(0).toUpperCase() + o.slice(1)}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Desktop side drawer */}
      <div
        className={`hidden sm:flex fixed top-0 right-0 h-full z-[100] bg-white shadow-2xl flex-col transition-all duration-300 ease-out border-l border-gray-100
          ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "min(440px, 100vw)" }}
      >
        <DrawerContent
          editData={editData} form={form} setForm={setForm}
          errors={errors} loading={loading}
          onClose={onClose} onSubmit={handleSubmit}
          Field={Field} SelectField={SelectField}
        />
      </div>

      {/* Mobile bottom sheet */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white shadow-2xl flex flex-col rounded-t-3xl transition-transform duration-300 ease-out border-t border-gray-100
          ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <DrawerContent
          editData={editData} form={form} setForm={setForm}
          errors={errors} loading={loading}
          onClose={onClose} onSubmit={handleSubmit}
          Field={Field} SelectField={SelectField}
          isMobile
        />
      </div>
    </>
  );
}

function DrawerContent({ editData, form, setForm, errors, loading, onClose, onSubmit, Field, SelectField, isMobile }) {
  return (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-orange-600 flex-shrink-0 ${isMobile ? "rounded-t-3xl" : ""}`}>
        <div>
          <h2 className="text-base font-bold text-white">
            {editData ? "Edit Component" : "Create Salary Component"}
          </h2>
          <p className="text-xs text-white/70 mt-0.5">
            {editData ? `Editing: ${editData.component_name}` : "Add a new salary component"}
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-white">
        {errors._api && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <XCircle size={16} className="flex-shrink-0" />
            {errors._api}
          </div>
        )}

        <Field label="Component Name" error={errors.component_name}>
          <input
            type="text"
            value={form.component_name}
            onChange={(e) => setForm({ ...form, component_name: e.target.value })}
            placeholder="e.g. Basic Salary, HRA, PF Deduction"
            className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all
              ${errors.component_name ? "border-red-400" : "border-gray-200"}`}
          />
        </Field>

        <Field label="Component Type" error={errors.component_type}>
          <div className="flex gap-3">
            {COMPONENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, component_type: t })}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all capitalize
                  ${form.component_type === t
                    ? t === "earning"
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                      : "bg-red-500 border-red-500 text-white shadow-md"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Calculation Type" error={errors.calculation_type}>
          <SelectField
            value={form.calculation_type}
            onChange={(v) => setForm({ ...form, calculation_type: v })}
            options={CALCULATION_TYPES}
            error={errors.calculation_type}
          />
        </Field>

        <div className="space-y-3 pt-1">
          {[
            { key: "is_taxable", label: "Taxable", desc: "Subject to income tax" },
            { key: "is_active",  label: "Active",  desc: "Available for use in payroll" },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              onClick={() => setForm({ ...form, [key]: !form[key] })}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-4 ${form[key] ? "bg-orange-500" : "bg-gray-300"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form[key] ? "left-6" : "left-1"}`} />
              </div>
            </div>
          ))}
        </div>

        {form.calculation_type === "variable" && !form.is_taxable && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</span>
            Variable components must be taxable. Please enable taxable or change calculation type.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
        <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition-colors">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {editData ? "Save Changes" : "Create Component"}
        </button>
      </div>
    </>
  );
}

// ── Lookup By Name ────────────────────────────────────────────────────────────
function LookupByName({ components, onFound }) {
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setError("");
    if (!id) return;
    const found = components.find((c) => c.id === Number(id));
    if (found) onFound(found);
    else setError("Component not found");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Search size={16} className="text-orange-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Lookup by Name</h3>
          <p className="text-xs text-gray-400">Find a specific salary component</p>
        </div>
      </div>
      <div className="relative">
        <select
          value={selectedId}
          onChange={handleChange}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
        >
          <option value="">Select a component...</option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>
              {c.component_name}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Found Component Card ──────────────────────────────────────────────────────
function FoundCard({ component, onEdit, onDelete, onDismiss }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm p-4 sm:p-5 relative">
      <button onClick={onDismiss} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
        <X size={14} />
      </button>
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${component.component_type === "earning" ? "bg-emerald-100" : "bg-red-100"}`}>
          {component.component_type === "earning"
            ? <Coins size={18} className="text-emerald-600" />
            : <BadgePercent size={18} className="text-red-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 truncate pr-6">{component.component_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">ID #{component.id}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        {[
          { label: "Type", value: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${component.component_type === "earning" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{component.component_type}</span> },
          { label: "Calculation", value: <span className="text-gray-700 font-medium capitalize">{component.calculation_type}</span> },
          { label: "Taxable",     value: <span className={component.is_taxable ? "text-orange-600 font-medium" : "text-gray-500"}>{component.is_taxable ? "Yes" : "No"}</span> },
          { label: "Status",      value: <span className={`inline-flex items-center gap-1 text-xs font-semibold ${component.is_active ? "text-emerald-600" : "text-gray-400"}`}><span className={`w-1.5 h-1.5 rounded-full ${component.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />{component.is_active ? "Active" : "Inactive"}</span> },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            {value}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(component)}
          className="flex-1 py-2.5 rounded-xl border border-orange-500 text-orange-600 text-sm font-semibold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-1.5">
          <Pencil size={14} /> Edit
        </button>
        <button onClick={() => onDelete(component)}
          className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-500 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Mobile Filter Sheet ───────────────────────────────────────────────────────
function FilterSheet({ open, onClose, filterType, setFilterType, filterCalc, setFilterCalc, searchText, setSearchText }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else      document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed bottom-0 left-0 right-0 z-[85] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-6 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Filters</h3>
            <button onClick={() => { setFilterType("all"); setFilterCalc("all"); setSearchText(""); }} className="text-xs text-orange-500 font-semibold">Reset all</button>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
            <input
              type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name..."
              className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Component Type</label>
            <div className="flex gap-2">
              {["all", "earning", "deduction"].map((t) => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 capitalize transition-all
                    ${filterType === t ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-500 bg-white"}`}>
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Calculation</label>
            <div className="flex gap-2">
              {["all", "fixed", "percentage", "variable"].map((c) => (
                <button key={c} onClick={() => setFilterCalc(c)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 capitalize transition-all
                    ${filterCalc === c ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-500 bg-white"}`}>
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold shadow-lg transition-all">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateSalaryComponent() {
  const [components,      setComponents]      = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [editData,        setEditData]        = useState(null);
  const [foundComponent,  setFoundComponent]  = useState(null);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [toasts,          setToasts]          = useState([]);
  const [filterType,      setFilterType]      = useState("all");
  const [filterCalc,      setFilterCalc]      = useState("all");
  const [searchText,      setSearchText]      = useState("");
  const [filterOpen,      setFilterOpen]      = useState(false);
  const [lookupOpen,      setLookupOpen]      = useState(false);

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
    } catch {
      addToast("Failed to load components", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaved = () => { addToast("Component saved successfully!"); fetchAll(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/delete/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        addToast("Component deleted successfully!");
        setFoundComponent((p) => (p?.id === deleteTarget.id ? null : p));
        fetchAll();
      } else {
        addToast(data.message || "Delete failed", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const openCreate = () => { setEditData(null); setDrawerOpen(true); };
  const openEdit   = (c)  => { setEditData(c);  setDrawerOpen(true); };

  const hasActiveFilters = filterType !== "all" || filterCalc !== "all" || searchText !== "";

  const filtered = components
    .filter((c) => {
      const matchType = filterType === "all" || c.component_type === filterType;
      const matchCalc = filterCalc === "all" || c.calculation_type === filterCalc;
      const matchText = !searchText || c.component_name.toLowerCase().includes(searchText.toLowerCase());
      return matchType && matchCalc && matchText;
    })
    .slice(0, 5);

  const typeColor = (t) =>
    t === "earning"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";

  const stats = [
    { label: "Total",      value: components.length,                                                  color: "text-gray-700"       },
    { label: "Earnings",   value: components.filter((c) => c.component_type === "earning").length,    color: "text-emerald-600" },
    { label: "Deductions", value: components.filter((c) => c.component_type === "deduction").length,  color: "text-red-500"         },
    { label: "Active",     value: components.filter((c) => c.is_active).length,                       color: "text-orange-500"                         },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />

      {deleteTarget && (
        <DeleteModal
          component={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      <ComponentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editData={editData}
        onSaved={handleSaved}
      />

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filterType={filterType} setFilterType={setFilterType}
        filterCalc={filterCalc} setFilterCalc={setFilterCalc}
        searchText={searchText} setSearchText={setSearchText}
      />

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Coins size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Salary Components</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Create and manage payroll components</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg flex-shrink-0"
            >
              <PlusCircle size={15} />
              <span className="hidden xs:inline">Create</span>
              <span className="hidden sm:inline"> Component</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 sm:px-5 py-3 sm:py-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Mobile Lookup Accordion ── */}
        <div className="lg:hidden">
          <button
            onClick={() => setLookupOpen((p) => !p)}
            className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Search size={14} className="text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Lookup by Name</span>
            </div>
            {lookupOpen
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {lookupOpen && (
            <div className="mt-2 space-y-3">
              <LookupByName components={components} onFound={(c) => { setFoundComponent(c); setLookupOpen(false); }} />
            </div>
          )}
          {foundComponent && (
            <div className="mt-3">
              <FoundCard
                component={foundComponent}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onDismiss={() => setFoundComponent(null)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

          {/* ── Left col — desktop Lookup ── */}
          <div className="hidden lg:block lg:col-span-2 space-y-5">
            <LookupByName components={components} onFound={setFoundComponent} />
            {foundComponent && (
              <FoundCard
                component={foundComponent}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onDismiss={() => setFoundComponent(null)}
              />
            )}
          </div>

          {/* ── Right col — component list ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Recent Components</h3>
                <Link href="/payroll/salary-components/all" className="text-xs text-orange-500 font-semibold hover:underline">
                  View all →
                </Link>
              </div>

              {/* Desktop filters */}
              <div className="hidden sm:flex gap-2 flex-wrap">
                <input
                  type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search name..."
                  className="flex-1 min-w-[120px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
                />
                <select
                  value={filterType} onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
                <select
                  value={filterCalc} onChange={(e) => setFilterCalc(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none"
                >
                  <option value="all">All Calc</option>
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                  <option value="variable">Variable</option>
                </select>
              </div>

              {/* Mobile filter row */}
              <div className="flex sm:hidden gap-2">
                <input
                  type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
                />
                <button
                  onClick={() => setFilterOpen(true)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all
                    ${hasActiveFilters
                      ? "border-orange-500 text-orange-500 bg-orange-50"
                      : "border-gray-200 text-gray-600 bg-gray-50"}`}
                >
                  <SlidersHorizontal size={14} />
                  Filter
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute -top-0.5 -right-0.5" />}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-orange-500" />
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Coins size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No components found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterType("all"); setFilterCalc("all"); setSearchText(""); }}
                      className="mt-2 text-xs text-orange-500 font-semibold"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
              {!loading && filtered.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.component_type === "earning" ? "bg-emerald-100" : "bg-red-100"}`}>
                    {c.component_type === "earning"
                      ? <Coins size={15} className="text-emerald-600" />
                      : <BadgePercent size={15} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{c.component_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${typeColor(c.component_type)}`}>
                        {c.component_type}
                      </span>
                      <span className="text-[10px] text-gray-400 capitalize">{c.calculation_type}</span>
                      {!c.is_active && <span className="text-[10px] text-gray-400">· Inactive</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(c)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">#{c.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-4 sm:hidden z-30">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold shadow-2xl transition-all"
        >
          <PlusCircle size={18} />
          Create
        </button>
      </div>
    </div>
  );
}