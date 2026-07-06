"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Search, Edit2, Trash2, Eye, X, ChevronRight,
  Tag, ToggleLeft, ToggleRight, ImageIcon, Loader2,
  AlertTriangle, CheckCircle, RefreshCw,
  LayoutGrid, Activity, TrendingDown, Zap,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api/asset-categories";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border pointer-events-auto animate-slide-in
            ${t.type === "success" ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-red-200 text-red-700"}`}>
          {t.type === "success"
            ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
            : <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, itemName }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-gray-900 font-bold text-center text-lg mb-1">Delete Category</h3>
        <p className="text-gray-500 text-sm text-center mb-6">
          Are you sure you want to delete <span className="text-gray-800 font-semibold">"{itemName}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);

  return (
    <>
      <div className={`fixed inset-0 bg-black/25 backdrop-blur-sm z-[100] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <div ref={ref}
        className={`fixed top-0 right-0 h-full z-[110] w-full max-w-[460px] flex flex-col bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Tag size={16} className="text-orange-500" />
            </div>
            <h2 className="text-gray-800 font-bold text-base">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all";

// ─── Category Form ────────────────────────────────────────────────────────────
function CategoryForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState({ name: "", description: "", depreciation_rate: "", is_active: true, category_image: null, ...initial });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setForm({ name: "", description: "", depreciation_rate: "", is_active: true, category_image: null, ...initial });
    setPreview(null);
  }, [initial]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    set("category_image", file); setPreview(URL.createObjectURL(file));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name); fd.append("description", form.description);
    fd.append("depreciation_rate", form.depreciation_rate); fd.append("is_active", form.is_active);
    if (form.category_image instanceof File) fd.append("category_image", form.category_image);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Category Name" required>
        <input className={inputCls} placeholder="e.g. Networking Equipment" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field label="Description">
        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Brief description…" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Depreciation Rate (%)" hint="Annual depreciation percentage (0–100)">
        <input className={inputCls} type="number" min="0" max="100" step="0.01" placeholder="e.g. 18" value={form.depreciation_rate} onChange={(e) => set("depreciation_rate", e.target.value)} />
      </Field>
      <Field label="Category Image">
        <label className="relative flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all overflow-hidden group">
          {preview
            ? <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            : <><ImageIcon size={22} className="text-gray-300 group-hover:text-orange-400 transition-colors" /><span className="text-xs text-gray-400 group-hover:text-orange-500 transition-colors">Click to upload image</span></>}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </Field>
      <Field label="Status">
        <button type="button" onClick={() => set("is_active", !form.is_active)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
            ${form.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
          {form.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
          {form.is_active ? "Active" : "Inactive"}
        </button>
      </Field>
      <div className="pt-2">
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Saving…" : "Save Category"}
        </button>
      </div>
    </form>
  );
}

// ─── View Content ─────────────────────────────────────────────────────────────
function ViewContent({ cat }) {
  if (!cat) return null;
  const rows = [
    ["Category ID", `#${cat.id}`],
    ["Depreciation Rate", `${cat.depreciation_rate ?? "—"}%`],
    ["Status", cat.is_active ? "Active" : "Inactive"],
    ["Created", cat.created_at ? new Date(cat.created_at).toLocaleString() : "—"],
    ["Updated", cat.updated_at ? new Date(cat.updated_at).toLocaleString() : "—"],
  ];
  return (
    <div>
      {cat.category_image && (
        <div className="mb-5 rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
          <img src={cat.category_image} alt={cat.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="mb-5 p-4 bg-orange-50 rounded-xl border border-orange-100">
        <h3 className="text-lg font-bold text-orange-600 mb-1">{cat.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{cat.description || "No description provided."}</p>
      </div>
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {rows.map(([k, v], i) => (
          <div key={k} className={`flex items-center justify-between px-4 py-3 ${i !== rows.length - 1 ? "border-b border-gray-100" : ""} ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{k}</span>
            <span className={`text-sm font-semibold ${k === "Status" ? (cat.is_active ? "text-emerald-600" : "text-red-500") : "text-gray-700"}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  const c = {
    orange:  { bg: "bg-orange-50",  border: "border-orange-100",  icon: "text-orange-500",  val: "text-orange-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-500", val: "text-emerald-600" },
    blue:    { bg: "bg-blue-50",    border: "border-blue-100",    icon: "text-blue-500",    val: "text-blue-600"    },
    gray:    { bg: "bg-gray-50",    border: "border-gray-100",    icon: "text-gray-400",    val: "text-gray-600"    },
  }[color] || { bg: "bg-gray-50", border: "border-gray-100", icon: "text-gray-400", val: "text-gray-600" };

  return (
    <div className={`bg-white border ${c.border} rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon size={16} className={c.icon} />
        </div>
      </div>
      <p className={`text-3xl font-extrabold ${c.val} leading-none`}>{value}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssetCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [toasts,     setToasts]     = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [saving,     setSaving]     = useState(false);

  const toast = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await fetch(API_BASE, { headers: authHeaders() });
      const d = await r.json();
      setCategories(Array.isArray(d.data) ? d.data : []);
    } catch { toast("Failed to load categories", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (fd) => {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/create`, { method: "POST", headers: authHeaders(), body: fd });
      const d = await r.json();
      if (d.success) { toast("Category created!"); setCreateOpen(false); fetchAll(); }
      else toast(d.message || "Create failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (fd) => {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/update/${selected.id}`, { method: "PUT", headers: authHeaders(), body: fd });
      const d = await r.json();
      if (d.success) { toast("Category updated!"); setEditOpen(false); fetchAll(); }
      else toast(d.message || "Update failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    try {
      const r = await fetch(`${API_BASE}/delete/${delTarget.id}`, { method: "DELETE", headers: authHeaders() });
      const d = await r.json();
      if (d.success) { toast("Category deleted!"); fetchAll(); }
      else toast(d.message || "Delete failed", "error");
    } catch { toast("Network error", "error"); }
    finally { setDelTarget(null); }
  };

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive   = categories.filter((c) => c.is_active).length;
  const totalInactive = categories.filter((c) => !c.is_active).length;
  const withDepr      = categories.filter((c) => c.depreciation_rate > 0).length;

  return (
    <>
      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>

      <Toast toasts={toasts} />
      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} itemName={delTarget?.name} />

      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Create Asset Category">
        <CategoryForm initial={{}} onSubmit={handleCreate} loading={saving} />
      </Drawer>
      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit Asset Category">
        <CategoryForm initial={selected || {}} onSubmit={handleUpdate} loading={saving} />
      </Drawer>
      <Drawer open={viewOpen} onClose={() => setViewOpen(false)} title="Category Details">
        <ViewContent cat={selected} />
      </Drawer>

      {/* ── Page ── */}
      <div className="min-h-screen bg-gray-50">

        {/* Page Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
                <Tag size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5">
                  <span>Assets</span>
                  <ChevronRight size={11} />
                  <span className="text-gray-600 font-medium">Categories</span>
                </div>
                <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Asset Categories</h1>
                <p className="text-gray-400 text-xs mt-0.5">Create and manage asset categories</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button onClick={fetchAll} disabled={loading}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all">
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
              <button onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all shadow-sm">
                <Plus size={17} />
                Category
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total"              value={loading ? "—" : categories.length} icon={LayoutGrid}   color="orange"  />
            <StatCard label="Active"             value={loading ? "—" : totalActive}       icon={Activity}     color="emerald" />
            <StatCard label="Inactive"           value={loading ? "—" : totalInactive}     icon={TrendingDown} color="gray"    />
            <StatCard label="With Depreciation"  value={loading ? "—" : withDepr}          icon={Zap}          color="blue"    />
          </div>

          {/* Table Card */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Search categories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span className="text-xs text-gray-400 font-medium sm:ml-auto whitespace-nowrap">
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </span>
            </div>

            {/* States */}
            {loading ? (
              <div className="flex items-center justify-center h-56 gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin text-orange-500" />
                <span className="text-sm">Loading categories…</span>
              </div>

            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
                  <Tag size={24} className="text-orange-300" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">No categories found</p>
                <p className="text-gray-400 text-sm mb-4">{search ? "Try a different search term" : "Create your first asset category"}</p>
                {!search && (
                  <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all">
                    <Plus size={15} /> Create Category
                  </button>
                )}
              </div>

            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["#", "Category", "Description", "Depreciation", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((cat, i) => (
                        <tr key={cat.id} className="hover:bg-orange-50 transition-colors group">
                          <td className="px-5 py-4 text-gray-300 text-xs font-mono">{i + 1}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <Tag size={14} className="text-orange-500" />
                              </div>
                              <span className="font-semibold text-gray-800 whitespace-nowrap">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-400 max-w-xs">
                            <span className="line-clamp-1 text-sm">{cat.description || "—"}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-gray-600 text-xs bg-gray-100 px-2.5 py-1 rounded-lg">
                              {cat.depreciation_rate != null ? `${cat.depreciation_rate}%` : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                              ${cat.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
                              {cat.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelected(cat); setViewOpen(true); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all">
                                <Eye size={15} />
                              </button>
                              <button onClick={() => { setSelected(cat); setEditOpen(true); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => setDelTarget(cat)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {filtered.map((cat) => (
                    <div key={cat.id} className="p-4 hover:bg-orange-50 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <Tag size={15} className="text-orange-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{cat.name}</p>
                            {cat.depreciation_rate != null && (
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{cat.depreciation_rate}% depreciation</p>
                            )}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
                          ${cat.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
                          <span className={`w-1 h-1 rounded-full ${cat.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
                          {cat.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {cat.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2 pl-12">{cat.description}</p>}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button onClick={() => { setSelected(cat); setViewOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all font-semibold">
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => { setSelected(cat); setEditOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-orange-500 bg-orange-50 hover:bg-orange-100 transition-all font-semibold">
                          <Edit2 size={13} /> Edit
                        </button>
                        <button onClick={() => setDelTarget(cat)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-red-500 bg-red-50 hover:bg-red-100 transition-all font-semibold">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}