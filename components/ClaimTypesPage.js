"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080/api/claim-types";

const EMPTY_FORM = {
  name: "",
  description: "",
  max_amount: "",
  requires_document: false,
  is_active: true,
};

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
};

// ============================================================================
// UI Components
// ============================================================================

function Badge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide
        ${active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400
        ${checked ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

function Spinner({ size = 20 }) {
  return (
    <svg className="animate-spin text-orange-500" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 sm:px-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-top duration-300">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClaimTypeForm({ initial = EMPTY_FORM, onSubmit, loading }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.max_amount || isNaN(Number(form.max_amount)) || Number(form.max_amount) <= 0)
      e.max_amount = "Enter a valid positive amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, max_amount: Number(form.max_amount) });
  };

  const fieldBase = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400 focus:border-transparent";
  const fieldNormal = "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500";
  const fieldError = "border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-slate-800 dark:text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Internet Reimbursement"
          className={`${fieldBase} ${errors.name ? fieldError : fieldNormal}`}
        />
        {errors.name && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Brief description of this claim type…"
          className={`${fieldBase} resize-none ${errors.description ? fieldError : fieldNormal}`}
        />
        {errors.description && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.description}</p>}
      </div>

      {/* Max Amount */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Max Amount (₹)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 text-sm font-medium">₹</span>
          <input
            type="number"
            value={form.max_amount}
            onChange={(e) => set("max_amount", e.target.value)}
            placeholder="3000"
            min="1"
            step="1"
            className={`${fieldBase} pl-8 ${errors.max_amount ? fieldError : fieldNormal}`}
          />
        </div>
        {errors.max_amount && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.max_amount}</p>}
      </div>

      {/* Toggles */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex-1 border border-slate-100 dark:border-slate-600">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Requires Document</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Receipt / proof mandatory</p>
          </div>
          <Toggle checked={form.requires_document} onChange={(v) => set("requires_document", v)} />
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex-1 border border-slate-100 dark:border-slate-600">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Available for claims</p>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => set("is_active", v)} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300
            text-white text-sm font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1"
        >
          {loading ? <Spinner size={16} /> : null}
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({ item, onConfirm, onCancel, loading }) {
  return (
    <div className="text-center space-y-5">
      <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </div>
      <div>
        <p className="text-slate-800 dark:text-white font-semibold text-base sm:text-lg">Delete "{item.name}"?</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">This action cannot be undone. The claim type will be permanently removed.</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors disabled:bg-rose-300 flex items-center justify-center gap-2"
        >
          {loading ? <Spinner size={16} /> : null}
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-5 z-[100] flex flex-col gap-2 max-w-xs w-full mx-auto sm:mx-0 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium pointer-events-auto animate-in slide-in-from-bottom-2 duration-200
            ${t.type === "success" ? "bg-emerald-600" : "bg-rose-500"}`}
        >
          <span className="mt-0.5 shrink-0">
            {t.type === "success" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            )}
          </span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ClaimTypesPage() {
  const [claimTypes, setClaimTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const toast = (message, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/`);
      const data = await res.json();
      if (data.success) setClaimTypes(data.data);
      else toast(data.message || "Failed to fetch", "error");
    } catch {
      toast("Could not connect to server", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/create`, { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast("Claim type created successfully"); setModal(null); fetchAll(); }
      else toast(data.message || "Create failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    if (!modal?.item) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/update/${modal.item.id}`, { method: "PUT", body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast("Claim type updated successfully"); setModal(null); fetchAll(); }
      else toast(data.message || "Update failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!modal?.item) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/delete/${modal.item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast("Claim type deleted"); setModal(null); fetchAll(); }
      else toast(data.message || "Delete failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const filtered = claimTypes.filter((ct) => {
    const matchSearch =
      ct.name.toLowerCase().includes(search.toLowerCase()) ||
      ct.description.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active" && ct.is_active) ||
      (filterActive === "inactive" && !ct.is_active);
    return matchSearch && matchActive;
  });

  const stats = {
    total: claimTypes.length,
    active: claimTypes.filter((c) => c.is_active).length,
    withDoc: claimTypes.filter((c) => c.requires_document).length,
  };

  return (
    <div className="font-sans">

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Claim Types
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">Manage reimbursement categories</p>
            </div>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-orange-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">New Claim Type</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {[
            { label: "Total Types", value: stats.total, color: "orange", icon: "M4 6h16M4 12h16M4 18h16" },
            { label: "Active", value: stats.active, color: "emerald", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Requires Doc", value: stats.withDoc, color: "amber", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2
                ${color === "orange" ? "bg-orange-50 dark:bg-orange-900/30"
                  : color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/30"
                  : "bg-amber-50 dark:bg-amber-900/30"}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={color === "orange" ? "#f97316" : color === "emerald" ? "#10b981" : "#f59e0b"}
                  strokeWidth="2">
                  <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claim types..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 self-start sm:self-auto">
            {["all", "active", "inactive"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-all whitespace-nowrap
                  ${filterActive === f
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Spinner size={36} />
              <p className="text-slate-400 dark:text-slate-500 text-sm">Loading claim types…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300 font-semibold">No claim types found</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                {search ? "Try a different search term" : "Create your first claim type to get started"}
              </p>
            </div>
            {!search && (
              <button
                onClick={() => setModal({ type: "create" })}
                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-semibold border border-orange-200 dark:border-orange-800 hover:border-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 px-4 py-2 rounded-xl transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Claim Type
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden w-full min-w-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                      {["Name", "Description", "Max Amount", "Document", "Status", "Actions"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider
                            ${i === 0 ? "text-left w-[18%]" : i === 1 ? "text-left w-[22%]" : i === 2 ? "text-right w-[12%]" : i === 5 ? "text-right w-[14%]" : "text-center w-[11%]"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {filtered.map((ct) => (
                      <tr key={ct.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-orange-500 dark:text-orange-400 font-bold text-xs">
                              {ct.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-white truncate">{ct.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="truncate text-slate-500 dark:text-slate-400">{ct.description}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            ₹{Number(ct.max_amount).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {ct.requires_document ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge active={ct.is_active} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setModal({ type: "edit", item: ct })}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-xs font-semibold transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => setModal({ type: "delete", item: ct })}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 text-xs font-semibold transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden px-3 py-3 space-y-3">
              {filtered.map((ct) => (
                <div
                  key={ct.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3 active:scale-[0.99] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-orange-500 dark:text-orange-400 font-bold text-base">
                        {ct.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 dark:text-white leading-tight truncate">{ct.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{ct.description}</p>
                      </div>
                    </div>
                    <Badge active={ct.is_active} />
                  </div>

                  <div className="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col">
                      <span className="text-slate-400 dark:text-slate-500">Max Amount</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        ₹{Number(ct.max_amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-slate-400 dark:text-slate-500">Document</span>
                      <span className={`font-semibold ${ct.requires_document ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {ct.requires_document ? "Required" : "Optional"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => setModal({ type: "edit", item: ct })}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/30 active:bg-orange-200 dark:active:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-sm font-semibold transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", item: ct })}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 active:bg-rose-200 dark:active:bg-rose-900/50 text-rose-500 dark:text-rose-400 text-sm font-semibold transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-right px-1">
              Showing {filtered.length} of {claimTypes.length} claim types
            </p>
          </>
        )}
      </main>

      {/* Modals */}
      {modal?.type === "create" && (
        <Modal title="New Claim Type" onClose={() => setModal(null)}>
          <ClaimTypeForm onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}
      {modal?.type === "edit" && modal.item && (
        <Modal title="Edit Claim Type" onClose={() => setModal(null)}>
          <ClaimTypeForm
            initial={{
              name: modal.item.name,
              description: modal.item.description,
              max_amount: modal.item.max_amount,
              requires_document: modal.item.requires_document,
              is_active: modal.item.is_active,
            }}
            onSubmit={handleEdit}
            loading={saving}
          />
        </Modal>
      )}
      {modal?.type === "delete" && modal.item && (
        <Modal title="Confirm Deletion" onClose={() => setModal(null)}>
          <DeleteConfirm item={modal.item} onConfirm={handleDelete} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}